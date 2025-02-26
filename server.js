const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

app.get('/', (req, res) => {
    res.render('landing');
});

//============================== Routes FOR THE lANDING PAGE =====================

app.get(['/users/register' ], (req, res) => {  
    res.render('login');  // Render the same page for both routes
});

app.get('/users/login', (req, res) => {  
    res.render('login');
});

app.get(['/business/register' ], (req, res) => {  
    res.render('businessLogin');  // Render the same page for both routes
});

app.get(['/business/login' ], (req, res) => {  
    res.render('businessLogin');  // Render the same page for both routes
});

app.get('/users/dashboard', (req, res) => {  
    res.render('userDashboard', {user: 'John Doe'});
});

app.get('/admin/dashboard', (req, res) => {  
    res.render('adminDashboard', {user: 'admin'});
});
//==================================REGISTER USER======================
app.post('/users/register', async  (req, res) => {
    let { first_name, last_name, phone_number, email, password, password2 } = req.body;
    console.log({
        first_name, 
        last_name, 
        phone_number, 
        email, 
        password, 
        password2
    });

    let errors = [];

    if (!first_name || !last_name || !phone_number || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters long" });
    }

    if (password !== password2) {
        errors.push({ message: "Passwords do not match" });
    }

    if (errors.length > 0) {
        res.render('login', { errors });
    } else {
        // Form validation has passed
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users
            WHERE email = $1`, [email], (err, results) => {
                if (err) {
                    throw err;
                }

                console.log(results.rows); // Empty array if email is not registered
                
                if (results.rows.length > 0) {
                    errors.push({ message: "Email already registered" });
                    res.render('login', { errors });
                } else {
                    pool.query(
                        `INSERT INTO users (first_name, last_name, phone_number, email, password)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id, password`, [first_name, last_name, phone_number, email, hashedPassword], (err, results) => {
                            if (err) {
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash('success_msg', "You are now registered. Please log in");
                            res.redirect('/users/login');
                        }
                    )
                }
            }
        )
    }
});

app.post('/business/register', async (req, res) => {

    let { business_name, industry, business_email, location, password, password2 } = req.body;
    console.log(business_name, industry, business_email, location, password, password2);
    
        // Parse the services JSON string back to an array
    let services = [];
    try {
        services = JSON.parse(req.body.services || '[]');
    } catch (e) {
        console.error('Error parsing services:', e);
    }
    
    // Now you have the services array to save to the database
    // ...
    console.log(services);

    let errors = [];

    if (!business_name || !industry || !business_email || !location || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters long" });
    }

    if (password !== password2) {
        errors.push({ message: "Passwords do not match" });
    }

    if (errors.length > 0) {
        res.render('businessLogin', { errors });
    } else {
        // Form validation has passed
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        
        pool.query(
            `SELECT * FROM businesses
            WHERE email = $1`, [business_email], (err, results) => {
                if (err) {
                    throw err;
                }

                console.log(results.rows); // Empty array if email is not registerd

                if (results.rows.length > 0){
                    errors.push({ message: "Email already registered" });
                    res.render('businessLogin', {errors});
                } else {
                    pool.query(
                        `INSERT INTO businesses (name, email, industry, location, password)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id`, [business_name, business_email, industry, location, hashedPassword], (err, results) => {
                            if (err) {
                                throw err;
                            }

                            //  Get the new business ID
                            console.log(results.rows);
                            const businessId = results.rows[0].id;

                            if( services.length > 0){

                                // Build part of the query : ($1, $2), ($1, $3), ...
                                const values = [];
                                const params = [businessId];

                                services.forEach((service, index) => {
                                    values.push(`($1, $${index + 2})`);
                                    params.push(service); 
                                });

                                const serviceQuery = `
                                INSERT INTO business_services (business_id, service)
                                VALUES ${values.join(', ')}
                                ON CONFLICT (business_id, service) DO NOTHING`;

                                pool.query(serviceQuery, params, (serviceErr) => {
                                    if (serviceErr){
                                        console.log('Error adding services:', serviceErr);
                                    }

                                    req.flash('success_msg', "You are now registered. Please log in");
                                    res.redirect('/business/login');
                                });
                            } else {
                                req.flash('success_msg', "You are now registered. Please log in");
                                res.redirect('/business/login');
                            }
                        }
                    )
                }
            }    
        )
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}  );