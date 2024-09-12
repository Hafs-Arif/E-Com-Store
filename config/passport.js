const passport = require('passport');
const localStrategy = require('passport-local');
const user = require('./models/user');

passport.use(new localStrategy(async(username,password,done) => {
    try {
        const user = await user.findOne({ username });
        if(!user) return done(null, false, { message:'User not Found.'});

        const isMatch = await user.comparePassword(password);
        if(!isMatch) return done(null, false, { message:'Incorrect Password.'});

        return done(null, user);
    } catch (err) {
        return done(err);
    } 
}));

passport.serializeUser(async (id, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try{
        const user = await user.findOne(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});