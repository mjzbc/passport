// to maintain logged in status across site, "npm install passport passport-local"
const passport = require('passport');

// create local strategy use of passport to initialize
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// create function to configure all our passport stuff
function initialize(passport, getUserByEmail, getUserById) {
    // create authenticate inside initialize to simplify
    const authenticateUser = async (email, password, done) => {
        const user = getUserByEmail(email);
        if (user == null) {
            // done() parameters:
            // 1. error if something wrong on server
            // 2. user returned
            // 3. message
            return done(null, false, { message: "No user with that email" });
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect' });
            }
        } catch (e) {
            return done(e);
        }
    };

    // use local strategy created, pass options from form, ex: "email"
    //and password field defaults to "password" so no need to include
    //and pass function called to authenticate user
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
    
    // to login, setup passport to serialize to store inside session
    passport.serializeUser((user, done) => {
        return done(null, user.id);
     });

    // setup passport to deserialize and logout
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id));
    });
};

module.exports = initialize;