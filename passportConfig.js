const localStrategy = require("passport-local").Strategy;
const {pool} = require("./dbConfig");


function initialize(passport) {
    const authenticateUser = (email, password, done) => {
        'SELECT'
    }
}