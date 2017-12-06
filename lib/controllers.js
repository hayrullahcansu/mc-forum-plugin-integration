'use strict';

var User = require.main.require('./src/user');

var Controllers = {};

Controllers.AuthFromBaseSite = function (req, res, next) {
	var userData = {
		username: res.session.email || '',
		email: res.session.email || '',
		password: res.session.password || '',
		isHash: true
	}
	User.create(userData, function (err, uid) {
		//user didnt create 
		if (err) {
			res.redirect('/register');
		}
		//user created and return wellcomepage
		res.redirect('/');
	});
};

module.exports = Controllers;