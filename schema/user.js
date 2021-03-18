const mongoose = require('mongoose');
const validator = require('validator');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

const userSchemaNew = new mongoose.Schema({
	email: {
		type: String,
		required: [true, 'Email Address Required'],
		trim: true,
		lowercase: [true, 'Invalid Email Address'],
		unique: [true, 'You have already Registered!'],
		validate: {
			validator: (value) => {
				return validator.isEmail(value);
			},
			message: 'Invalid email address provided'
		}
	},
  username: {
    type: String,
    required: [true, 'username required'],
		unique: [false]
  },
	password: {
		type: String
	}
});

userSchemaNew.plugin(passportLocalMongoose);
userSchemaNew.plugin(findOrCreate);

const User = new mongoose.model('User', userSchemaNew);

module.exports = User;
