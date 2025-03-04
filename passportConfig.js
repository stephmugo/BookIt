const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
  // Authentication strategy for regular users
  passport.use('local-user', new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Check if the user exists in the users table
        const results = await pool.query(
          `SELECT * FROM users WHERE email = $1`, [email]
        );

        if (results.rows.length === 0) {
          return done(null, false, { message: "Email is not registered" });
        }

        const user = results.rows[0];
        // type field to distinguish user type for authorization
        user.type = "user";

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Email or password is incorrect" });
        }

        // Successfully authenticated
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Authentication strategy for business users
  passport.use('local-business', new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const results = await pool.query(
          'SELECT * FROM businesses WHERE email = $1',
          [email]
        );

        if (results.rows.length > 0) {
          const business = results.rows[0];
          const isMatch = await bcrypt.compare(password, business.password);

          if (isMatch) {
            business.type = 'business'; // Add type for authentication checks
            return done(null, business);
          }
        }
        
        return done(null, false, { message: "Incorrect email or password" });
      } catch (err) {
        return done(err);
      }
    }
  ));

  // Serialize user to store in session
  passport.serializeUser((user, done) => {
    // Store just the id and type in the session for minimizing session data
    done(null, { id: user.id, type: user.type });
  });

  // Deserialize user from session
  passport.deserializeUser(async (sessionUser, done) => {
    try {
      let user;
      
      if (sessionUser.type === "user") {
        const results = await pool.query(
          `SELECT * FROM users WHERE id = $1`, [sessionUser.id]
        );
        if (results.rows.length > 0) {
          user = results.rows[0];
          user.type = "user";
        }
      } else if (sessionUser.type === "business") {
        const results = await pool.query(
          `SELECT * FROM businesses WHERE id = $1`, [sessionUser.id]
        );
        if (results.rows.length > 0) {
          user = results.rows[0];
          user.type = "business";
        }
      }

      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;