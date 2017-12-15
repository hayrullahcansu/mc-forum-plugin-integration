'use strict';

var User = require.main.require('./src/user');
var Controller = require.main.require('./src/controllers');
var Groups = require.main.require('./src/groups');
var meta = require.main.require('./src/meta');
var db = require.main.require('./src/database');
var passport = module.parent.require('passport');
var fs = module.parent.require('fs');
var path = module.parent.require('path');
var nconf = module.parent.require('nconf');
var async = module.parent.require('async');
var Authentication = Controller.authentication;
var Https = require('https');
var Requester = require('request');
var Controllers = {};


Controllers.CheckSession = function (req, res, next) {
	if (req.session.userAccessKey || req.session.userAccessKey !== '') {
		res.render('check_session');
	} else {
		res.redirect('/');
	}
};
//maybe need
//var app = express();
//app.use(express.bodyParser());
Controllers.AuthFromBaseSite = function (req, res, next) {

	res.contentType('json');
	if (!req.session.userAccessKey || req.session.userAccessKey === '') {
		res.status(200).send(prepareResult(false, '/register', 'local', false));
		next();
	} else {
		Requester('127.0.0.1/api/getUserInfoById/' + req.session.userAccessKey,
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var result = JSON.parse(body);
					if (result.result) {
						ControlUserInfo(req, res, result);
					} else {
						//user not found or error.
						res.status(200).send(prepareResult(false, '/register', 'local', false));
					}
				};
			});
	}

};

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
function getUserInfoByAccessKey(_id) {
	var result = {
		userid: _id || '',
		content: ''
	}
	var post_data = querystring.stringify({
		userid: _id
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

	var post_req = Https.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (data) {
			result.content = data;
		});
	});

	post_req.write(post_data);
	post_req.end();
	return result;
}

function ParseUserData(_userData) {
	userData = {
		oAuthid: '',
		handle: '',
		email: '',
		password: '',
		oAuthType: '',
		isAdmin: false
	}
	switch (_userData.authType) {
		case 'local':
			userData.oAuthid = _userData.local.id || '';
			userData.handle = _userData.local.username || '';
			userData.email = _userData.local.email || '';
			userData.password = _userData.local.password || '';
		case 'facebook':
			userData.oAuthid = _userData.facebook.id || '';
			userData.handle = _userData.facebook.username || '';
			userData.email = _userData.facebook.email;
			break;

		case 'twitter':
			userData.oAuthid = _userData.twitter.id || '';
			userData.handle = _userData.twitter.username || '';
			break;

		case 'google':
			userData.oAuthid = _userData.google.id || '';
			userData.handle = _userData.google.name || '';
			userData.email = _userData.google.email || '';
			userData.isAdmin = _userData.google.isAdmin
			break;

		case 'soundcloud':
			userData.oAuthid = _userData.soundcloud.id || '';
			userData.handle = _userData.soundcloud.username || '';
			break;
		default:
			break;
	}
	_userData.oAuthType = _userData.authType;
	return userData;
}

function ControlUserInfo(req, res, result) {
	var result = getUserInfoByAccessKey(req.session.userAccessKey);
	var takenUserData = JSON.parse(result.content);
	if (takenUserData.result) {
		var userData = ParseUserData(takenUserData);
		Controllers.login(userData, function (err, user) {
			if (!err) {
				Authentication.doLogin(req, user.uid, function (err) {
					if (err) {
						res.status(200).send(prepareResult(false, '/register', 'local', false));
					} else {
						res.status(200).send(prepareResult(true, '/', 'local', true));
					}
				});
			}
		})
	}
}
Controllers.login = function (userData, callback) {
	var payload = ParseUserData(userData);
	Controllers.getUidByOAuthid(payload.oAuthid, function (err, uid) {
		if (err) {
			return callback(err);
		}

		if (uid !== null) {
			// Existing User
			callback(null, {
				uid: uid
			});
		} else {
			// New User
			var success = function (uid) {
				// Save provider-specific information to the user
				User.setUserField(uid, payload.oAuthType + 'Id', payload.oAuthid);
				db.setObjectField(payload.oAuthType + 'Id:uid', payload.oAuthid, uid);

				if (payload.isAdmin) {
					Groups.join('administrators', uid, function (err) {
						callback(null, {
							uid: uid
						});
					});
				} else {
					callback(null, {
						uid: uid
					});
				}
			};
			User.getUidByEmail(payload.email, function (err, uid) {
				if (err) {
					return callback(err);
				}

				if (!uid) {
					User.create({
						username: payload.handle,
						email: payload.email || '',
						password: payload.password || '',
						isHash: true
					}, function (err, uid) {
						if (err) {
							return callback(err);
						}

						success(uid);
					});


				} else {
					success(uid); // Existing account -- merge
				}
			});
		}
	});
};

Controllers.getUidByOAuthid = function (oAuthid, callback) {
	db.getObjectField(constants.name + 'Id:uid', oAuthid, function (err, uid) {
		if (err) {
			return callback(err);
		}
		callback(null, uid);
	});
};

Controllers.deleteUserData = function (data, callback) {
	async.waterfall([
		async.apply(User.getUserField, data.uid, constants.name + 'Id'),
		function (oAuthIdToDelete, next) {
			db.deleteObjectField(constants.name + 'Id:uid', oAuthIdToDelete, next);
		}
	], function (err) {
		if (err) {
			winston.error('[sso-oauth] Could not remove OAuthId data for uid ' + data.uid + '. Error: ' + err);
			return callback(err);
		}

		callback(null, data);
	});
};

module.exports = Controllers;