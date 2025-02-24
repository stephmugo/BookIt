const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");

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
    res.render('index');
});

//============================== Routes FOR THE lANDING PAGE =====================

app.get(['/users/register' ], (req, res) => {  
    res.render('login');  // Render the same page for both routes
});

app.get(['/business/register' ], (req, res) => {  
    res.render('login');  // Render the same page for both routes
});

app.get('/users/login', (req, res) => {  
    res.render('login');
});


app.get('/users/dashboard', (req, res) => {  
    res.render('userDashboard', {user: 'John Doe'});
});

app.get('/admin/dashboard', (req, res) => {  
    res.render('adminDashboard', {user: 'admin'});
});

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
        res.render('register', { errors });
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

                console.log(results.rows);

                if (results.rows.length > 0) {
                    errors.push({ message: "Email already registered" });
                    res.render('register', { errors });
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



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}  );