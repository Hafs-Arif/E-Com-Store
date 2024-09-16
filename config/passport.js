const localStrategy = require('passport-local').Strategy;
const user = require('../models/user');

module.exports = function(passport){
    passport.use(new localStrategy({usernameField: 'email'},async(email,password,done) => {
        try {
            const User = await user.findOne({ email });
            if(!User) return done(null, false, { message:'User not Found.'});
    
            const isMatch = await User.comparePassword(password);
            if(!isMatch) return done(null, false, { message:'Incorrect Password.'});
    
            return done(null, user);
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
