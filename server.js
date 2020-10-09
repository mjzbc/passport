// FIRST THING: load in environment variables .env
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

const express = require('express');
const app = express();
// to hash password, "npm install bcrypt"
const bcrypt = require('bcrypt');

// require the passport, and the config file we created to initialize
const passport = require('passport');

// in order to store and persist login across pages, "npm install express-session"
// in order to display messages if fail login, (used by passport) "npm install express-flash"
const session = require('express-session');
const flash = require('express-flash');

// to logout, need to call form method="Delete" instead of post
//so need "npm install method-override"
const methodOverride = require('method-override');

const initializePassport = require('./passport-config');
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

// Store users locally here for now - NOT USE for production
const users = [];

// Use EJS syntax, tell server we're using EJS Views
app.set('view-engine', 'ejs');

// Use forms, tell Express we want to tell app take inputs
//from form and we want to access within request "name" variable from EJS
//in post method, EX: "req.body.email" or "req.body.password"
// (middleware)
app.use(express.urlencoded( { extended: false }));

// setup middleware for express to use passport
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// Homepage route - need to be logged in to access, add "middleware" function
//before the standard (req, res)
//ex: app.get('/', (req, res) => {...}
//becomes...
app.get('/', checkAuthenticated, (req, res) => {
    // Pass the ejs template to "<%= name %>" the name Miguel
    res.render('index.ejs', { name : req.user.name });
});

// LOGIN Route (VIEWS)
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

// REGISTER ROUTES
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs');
});

// add middleware check to prevent submitting
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        // hash password, and salt it 10 times
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push( {
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });
        // if successful, continue to login page
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
    // testing - see if registered
    console.log(users);
});

//LOGOUT route - call delete request for passport token
app.delete('/logout', (req, res) => {
    // call passport logOut to clear session
    req.logOut();
    res.redirect('/');
} )

// prevent unAuthenticated users from accessing login page
function checkAuthenticated (req, res, next) {
    // user passport "isAuthenticated" method
    if (req.isAuthenticated()) {
        // if true, authenticated
        return next();
    }

    res.redirect('/login');
}

// if user is logged in, don't allow them to access
//either 'login' or 'register' page, should just be allowed in
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    // if not authenticated, continue with call
    next();
}

// Startup the server on the port
const port = 3000;
app.listen(port, () => { console.log(`Listening on port ${port}`)});