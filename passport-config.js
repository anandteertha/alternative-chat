const LocalStrategy = require('passport-local').Strategy
const User = require('./schema/user');

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const k = await User.find({ email: email },(err,results)=>{
  		if(err) {
  			return error
  		}
  		else {
  			//console.log(results);
  			const user = results;
        
        if (user.length == 0) {
          return done(null, false, { message: 'No user with that email' })
        }

        try {
          if (password == user[0].password) {
            return done(null, user)
          } else {
            return done(null, false, { message: 'Password incorrect' })
          }
        } catch (e) {
          return done(e)
        }
  		}
  	})
    //print(user)

  }

  passport.use(new LocalStrategy({ usernameField: 'emailid',passwordField: 'passwordid' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => {
    return done(null, user)
  })
}

module.exports = initialize
