'use strict';

var User = require.main.require('./src/user');
var https = require('https');
var Controllers = {};


//maybe need
//var app = express();
//app.use(express.bodyParser());
Controllers.AuthFromBaseSite = function (req, res, next) {

	res.contentType('json');
	if (!req.session.id || !req.session.id == '') {
		res.send(prepareResult(false, '/register', 'local', false));
		next();
	}
	var userData = {
		username: res.session.email || '',
		email: res.session.email || '',
		password: res.session.password || '',
		isHash: true
	}
	if (!checkUserDataValid(userData)) {
		var result = getUserInfoById(req.session.id);
		var takenUserData = JSON.parse(result.content);
		switch (takenUserData._authType) {
			case 'local':
				userData = {
					username: takenUserData.username,
					email: takenUserData.email,
					password: takenUserData.password,
					isHash: true
				}
				break;
			case 'google':
			case 'facebook':
			case 'twitter':
			default:
				res.send(prepareResult(false, '/register', 'local', false));
				next();
		}
	}
	CreateNewUserAndLogin(userData, res);
	next();
};
function CreateNewUserAndLogin(_userData, res) {
	User.create(_userData, function (err, uid) {
		//user didnt create 
		if (err) {

			res.send(prepareResult(false, '/register', 'local', false))
		}
		//user created and return wellcomepage
		res.send(prepareResult(true, '/', 'local', true))
	});
}
function checkUserDataValid(_userData) {
	if (!_userData.password || _userData.password == '') return false;
	if ((!_userData.username || _userData.username == '') && (!_userData.email || _userData.email == '')) return false;
}
function prepareResult(_result = false, _redirectUrl = '/', _authType = 'local', _isNewAccount = false) {
	return {
		result: _result,
		redirectUrl: _redirectUrl,
		authType: _authType,
		isNewAccount: _isNewAccount
	}
}
function getUserInfoById(_id = '') {
	var result = {
		sessionid : _id,
		content : ''
	}
	var post_data = querystring.stringify({
		sessionid : _id
	});
	var post_options = {
		host: 'localhost',
		port: '80',
		path: '/api/getUserInfoById',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(post_data)
		}
	};

	var post_req = https.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (data) {
			result.content = data;
		});
	});

	post_req.write(post_data);
	post_req.end();
	return result;
}

Controllers.CheckSession = function (req, res, next) {
	if (req.session.id || !req.session.id == '') {

	}
	res.render('check_session');
};

module.exports = Controllers;