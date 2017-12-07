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
	if(checkUserDataValid(userData)) {
		User.create(userData, function (err, uid) {
			//user didnt create 
			if (err) {
				
				res.redirect('/register');
			}
			//user created and return wellcomepage
			res.redirect('/');
		});
	}
};
function checkUserDataValid(_userData) {
	if(!_userData.password || _userData.password=='') return false;
	if((!_userData.username || _userData.username=='') && (!_userData.email || _userData.email=='')) return false;	
}
function prepareResult(_result=false,_redirectUrl='/',_authType='local',_isNewAccount=false) {
	return {
		result: _result,
		redirectUrl: _redirectUrl,
		authType: _authType,
		isNewAccount:_isNewAccount
	}
}

Controllers.CheckSession = function (req, res, next) {
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