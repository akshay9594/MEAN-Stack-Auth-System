var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

//User Schema
var UserSchema = mongoose.Schema ({
	username : {
		type: String, 
		index: true
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		type: String
	},
	localdate : {
		type : []
		
	},
	google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
        googledate		 :  []
    }
});

var User = module.exports = mongoose.model('User', UserSchema, 'users');  //users = collection name


//hash the password
module.exports.createUser = function(newUser, callback) {
	//from npm bycryptjs website
	bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB. 
        newUser.password = hash;
        newUser.save(callback);
        console.log(newUser.username);
    });
});
}

module.exports.getUserByUsername = function(username, callback) {
	var query = {username : username};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback) {
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    // res === true 
    if(err) throw err;
    callback(null, isMatch);
});
}