const localStrategy = require('passport-local').Strategy;
const user = require('../models/user');
const bcrypt = require('bcrypt');

module.exports = function(passport){
  passport.use(new localStrategy({  usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
    try {
      // Find the user by email
      const existingUser = await user.findOne({ email });

      console.log(existingUser);
      
      if (!existingUser) {
        return done(null, false, { message: 'No user found with that email.' });
      }

      // Compare the provided password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        console.log('Incorrect password');
        return done(null, false, { message: 'Incorrect password.' });
      }

      // if(password == existingUser.password){
      //   return done(null, existingUser);
      // } else {
      //   return done(null, false, { message: 'Incorrect password.' }); 
      // }

      // If passwords match, return the user object
      console.log('User authenticated successfully');
      return done(null, existingUser);
    } catch (err) {
      return done(err);
    }
  }));
    
  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user,user._id); // Log the _id for debugging
    done(null, user._id); // Use _id to serialize the user
  });
    
    // Deserialize the user from the session
  passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user with id:', id);
    try {
      const User = await user.findById(id); // Fetch the user by _id
      console.log('Deserializing user:', User); // Log the user for debugging
      done(null, User); // Attach the full user object to req.user
    } catch (err) {
      done(err, null);
    }
  });
};
