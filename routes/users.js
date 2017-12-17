var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

var User = require('../models/user.model.js');
var ConfigAuth = require('../auth.js');
var date= new Date();

//Get register page
router.get('/register', function(req, res) {
	res.render('register');
});

//Get login page
router.get('/', function(req, res) {
	res.render('login');
});

router.get('/index', function(req, res) {
	res.render('index');
});

//POST Part
router.post('/register', function(req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords dont match').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors) {
		res.render('register', {
			errors : errors,
		});
	} else {
		//console.log('PASSED');
	//	var d = new Date();
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password,
			localdate: Date.now()
		});

		User.createUser(newUser, function(err, user) {
			if(err) throw err;
			console.log(user);
		});		

		req.flash('success_msg', 'You are registered and can now login!');

		res.redirect('/');
	}
});


//Login Part Begins
passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
    	if(err) throw err;
    	if(!user) {
    		
    		return done(null, false, {message : 'Unknown User!'});
    	}

    User.comparePassword(password, user.password, function(err, isMatch) {
    	if(err) throw err;
    	if(isMatch) {
    	    //User.date.push(new Date());
    	    
                
                //var d= new Date();
    	    //User.update({'username':username},{ '$push' : {'localdate' : Date.now()}});
    		return done(null, user);
    		
    	}
    	else {
    		
    		return done(null, false, {message : 'Invalid Password!'});
    	}
    });
   });		
  }
));

 passport.use(new GoogleStrategy({

        clientID        : ConfigAuth.googleAuth.clientID,
        clientSecret    : ConfigAuth.googleAuth.clientSecret,
        callbackURL     : ConfigAuth.googleAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                            var d2 = new Date();
                            //user.google.googledate = d2.toGMTString();
                user.findOneAndUpdate({"google.name" : profile.displayName},{ "$addToSet" : {"googledate" : d2.toGMTString()}});
                //var d = new Date();
                  //          user.google.googledate = d.toDateString();

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser          = new User();

                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                        var d3 = new Date();
                        newUser.google.googledate = d3.toGMTString();

                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                            
                            
                            return done(null, newUser);
                        });
                        
                        
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user               = req.user; // pull the user out of the session

                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email
                //user.google.date = new Date();
                //user.google.date += new Date();
                var d4 = new Date();
                user.findOneAndUpdate({"google.id" : profile.id},{ "$addToSet" : {"googledate" : d4.toGMTString()}});
                //user.google.googledate += d4.toGMTString();
                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });

            }

        });

    }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/',
  passport.authenticate('local', {successRedirect: '/index', failureRedirect: '/',failureFlash: true}),
  function(req, res) {
      var d1 = new Date();
      User.findOneAndUpdate({"username" : username},{ "$addTosSet" : {"localdate" : d1.toGMTString()}});
      //user.localdate += d1.toGMTString();
    res.render('/index', {username: username});
  });

router.get('/logout', function(req, res) {
	req.logout();

	req.flash('success_msg', 'Logged Out Successfully !');

	res.redirect('/');
});	

 router.get('/auth/google', passport.authenticate('google', { scope : ['profile','email'] }));

        // the callback after google has authenticated the user
        router.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/index',
                failureRedirect : '/'
            }));
            
 router.get('/connect/google', passport.authorize('google', { scope : ['profile','email'] }));

        // the callback after google has authorized the user
        router.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/index',
                failureRedirect : '/'
            }));

module.exports = router;