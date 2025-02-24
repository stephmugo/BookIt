const express = require("express");


const app = express();

const PORT = process.env.PORT || 4000;



app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


app.get('/', (req, res) => {
    res.render('landing');
});
//============================== Routes FOR THE lANDING PAGE =====================
app.get(['/users/register', '/business/register'], (req, res) => {  
    res.render('login_sign');  // Render the same page for both routes
});

app.get('/users/login', (req, res) => {  
    res.render('login_sign');
});

app.get('/users/dashboard', (req, res) => {  
    res.render('dashboard', {user: 'John Doe'});
});

app.get('/admin/dashboard', (req, res) => {  
    res.render('adminDashboard', {user: 'admin'});
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}  );