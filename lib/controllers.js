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
var Http = require('http');
var Requester = require('request');
var winston = require('winston');
var querystring = require('querystring');
var pino = require('pino')();
var request = require('request-json');

var Controllers = {};

var apiClient = process.env.NODE_ENV === 'development' ? request.createClient('https://staging.musicoin.org') : request.createClient('https://musicoin.org');

Controllers.authenticate = function authenticate(req, res, next) {

  pino.info({ method: 'authenticate', input: req.session });

  async.waterfall([function getUserById(done) {
    doGetUserById({ userId: req.session.user._id }, done);
  }, function findOrCreateUser(user, done) {
  	doFindOrCreateUser(user, done);
  }], (error, uid) => {

  	if(error) {
  		return next(error);
  	}

  	req.uid = uid;

  	next();

  });

};

Controllers.getUserAccessKey = function(req, res, next) {
  pino.info(req.session.userAccessKey || 'bulunmadi');
  res.send(req.session.userAccessKey || 'bulunamadi');
};
Controllers.setUserAccessKey = function(req, res, next) {
  req.session.userAccessKey = req.query.userAccessKey || 'test';
  req.session.userName = req.query.userName || 'hayroreis';
  pino.info('oluşturuldu: ' + req.session.userAccessKey + req.session.userName);
  res.send('oluşturuldu: ' + req.session.userAccessKey + req.session.userName);
};

Controllers.CheckSession = function(req, res, next) {
  pino.info('check session request begin');
  pino.info('session=', req.session);
  if (req.session.userAccessKey && req.session.userAccessKey !== '') {
    pino.info('userAccessKey found: ' + req.session.userAccessKey + ':');
    pino.info('rendering check_session page');
    res.render('check_session');
  } else {
    pino.info('userAccessKey Not Found');
    res.redirect('/');
  }
  pino.info('check session request end');
};
//maybe need
//var app = express();
//app.use(express.bodyParser());
Controllers.AuthFromBaseSite = function(req, res, next) {
  pino.info('checking session begin:' + req.session.userAccessKey + ':::');
  res.contentType('json');
  if (req.session.userAccessKey && req.session.userAccessKey !== '') {
    pino.info('user access key info found: ' + req.session.userAccessKey + ':');
    pino.info('calling api/getUserInfoById begin');
    ControlUserInfo(req, res);
  } else {
    pino.info('user access key info not found. response is /register url redirect');
    res.status(200).send(prepareResult(false, '/register', 'local', false));
  }
  pino.info('checking session end');
};

function log(msg) {
  console.error(msg);
  winston.log(msg);
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

function getUserInfoByAccessKey(_id, next) {
  pino.info('testtesttesttestetstets');
  var result = {
    userid: _id || '',
    content: ''
  }
  var options = {
    host: '127.0.0.1',
    port: '3001',
    path: '/api/getUserInfoById/' + (_id || '')
  };
  var callback = function(response) {
    var data = '';
    response.on('data', function(chunk) {
      data += chunk;
    });
    response.on('end', function() {
      result.content = data;
      pino.info('/api/getUserInfoById/ response = ', data);
      next(null, result);
    });
    response.on('error', function(err) {
      pino.info('Error = ', err);
      next(err, result);
    });
  };
  Http.request(options, callback).end();
}

function ParseUserData(_userData) {
  pino.info('parsing begin');
  var userData = {
    oAuthid: '',
    handle: '',
    email: '',
    password: '',
    oAuthType: '',
    isAdmin: false
  }
  switch (_userData.authType) {
    case 'local':
      userData.oAuthid = _userData.user.local.id || '';
      userData.handle = _userData.user.local.username || '';
      userData.email = _userData.user.local.email || '';
      userData.password = _userData.user.local.password || '';
    case 'facebook':
      userData.oAuthid = _userData.user.facebook.id || '';
      userData.handle = _userData.user.facebook.username || '';
      userData.email = _userData.user.facebook.email;
      break;

    case 'twitter':
      userData.oAuthid = _userData.user.twitter.id || '';
      userData.handle = _userData.user.twitter.username || '';
      break;

    case 'google':
      userData.oAuthid = _userData.user.google.id || '';
      userData.handle = _userData.user.google.name || '';
      userData.email = _userData.user.google.email || '';
      userData.isAdmin = _userData.user.google.isAdmin
      break;

    case 'soundcloud':
      userData.oAuthid = _userData.user.soundcloud.id || '';
      userData.handle = _userData.user.soundcloud.username || '';
      break;
    default:
      break;
  }
  userData.oAuthType = _userData.authType;
  pino.info('parsing end');
  pino.info(JSON.stringify(userData));
  return userData;
}

function ControlUserInfo(req, res) {
  pino.info('OnControlUserInfo');
  pino.info(req.session.userAccessKey);
  getUserInfoByAccessKey(req.session.userAccessKey, function(err, result) {
    if (err) {
      pino.info('HTTP ERROR result == false redirecting to /register');
      res.status(200).send(prepareResult(false, '/register', 'local', false));
    } else if (result.content && result.content !== '' && result.content.length > 5) {
      pino.info('Result is: ', result);
      var takenUserData = JSON.parse(result.content);
      if (takenUserData.result) {
        pino.info('result controlling begin');
        Controllers.login(takenUserData, function(err, user) {
          if (!err) {
            pino.info('no error. user will login');
            Authentication.doLogin(req, user.uid, function(err) {
              if (err) {
                pino.info('logined failed error code X6 :' + err);
                res.status(200).send(prepareResult(false, '/register', 'local', false));
              } else {
                pino.info('no error user logined sussecfully');
                res.status(200).send(prepareResult(true, '/', 'local', true));
              }
            });
          } else {
            pino.info('error code X5 :' + err);
          }
        });
      } else {
        pino.info('result == false redirecting to /register');
        res.status(200).send(prepareResult(false, '/register', 'local', false));
      }
    } else {
      pino.info('result == false redirecting to /register');
      res.status(200).send(prepareResult(false, '/register', 'local', false));
    }
  });
}
Controllers.login = function(userData, callback) {
  pino.info('login begin');
  pino.info('typeof = ', typeof(userData));
  pino.info('object = ', userData);
  var payload = ParseUserData(userData);
  pino.info('payload is');
  pino.info(payload);
  Controllers.getUidByOAuthid(payload.oAuthType, payload.oAuthid, function(err, uid) {
    if (err) {
      pino.info('error code X1');
      return callback(err);
    }

    if (uid !== null) {
      pino.info('Existing User');
      // Existing User
      callback(null, {
        uid: uid
      });
    } else {
      pino.info('This is New User ------------');
      // New User
      var success = function(uid) {
        // Save provider-specific information to the user
        pino.info('on success begin uid:' + uid);
        User.setUserField(uid, payload.oAuthType + 'Id', payload.oAuthid);
        pino.info('setUserField: ' + payload.oAuthType + 'Id    oAuthid:' + payload.oAuthid);
        db.setObjectField(payload.oAuthType + 'Id:uid', payload.oAuthid, uid);
        pino.info('setObjectField: ' + payload.oAuthType + 'Id:uid');
        if (payload.isAdmin) {
          pino.info('this is admin.');
          Groups.join('administrators', uid, function(err) {
            callback(null, {
              uid: uid
            });
          });
        } else {
          pino.info('this is normal user');
          callback(null, {
            uid: uid
          });
        }
      };
      pino.info('Check Email');
      User.getUidByEmail(payload.email, function(err, uid) {
        if (err) {
          pino.info('error code X2');
          return callback(err);
        }
        if (!uid) {
          pino.info('İts really new user. will create a new account');
          pino.info(payload.handle || 'tempNick');
          User.create({
            username: payload.handle,
            email: payload.email || '',
            password: payload.password || '',
            isHash: true
          }, function(err, uid) {
            if (err) {
              pino.info('error code X3');
              return callback(err);
            }
            pino.info('new account created step1');
            success(uid);
          });


        } else {
          pino.info('user already registerd with this email :' + payload.email + ': we will merging accounts');
          success(uid); // Existing account -- merge
        }
      });
    }
  });
};

Controllers.getUidByOAuthid = function(name, oAuthid, callback) {
  db.getObjectField((name + 'Id:uid'), oAuthid, function(err, uid) {
    if (err) {
      return callback(err);
    }
    callback(null, uid);
  });
};

Controllers.deleteUserData = function(data, callback) {
  async.waterfall([
    async.apply(User.getUserField, data.uid, constants.name + 'Id'),
    function(oAuthIdToDelete, next) {
      db.deleteObjectField(constants.name + 'Id:uid', oAuthIdToDelete, next);
    }
  ], function(err) {
    if (err) {
      winston.error('[sso-oauth] Could not remove OAuthId data for uid ' + data.uid + '. Error: ' + err);
      return callback(err);
    }

    callback(null, data);
  });
};

function doGetUserById(options, callback) {

  pino.info({ method: 'doGetUserById', input: options });

  apiClient.get('/api/getUserInfoById/' + options.userId, function getCallback(error, response, body) {

    if (error) {
      pino.error({ method: 'doGetUserById', input: options, error: error });
      return callback(error);
    }

    if (response.statusCode !== 200) {
      pino.error({ method: 'doGetUserById', input: options, error: response.statusCode });
      return callback(new Error('Invalid status code: ' + response.statusCode));
    }

    pino.info({ method: 'doGetUserById', input: options, output: body });

    return callback(null, body);

  });

}

function doFindOrCreateUser(user, callback) {

	pino.info({ method: 'findOrCreateUser', input: user });

  async.waterfall([function findUser(done) {
    User.getUidByEmail(user.email, (error, uid) => done(error, uid ? uid : null));
  }, function tryCreateUser(uid, done) {
    if (!uid) {
      return User.create({
        username: user.handle,
        email: user.email || '',
        password: user.password || '',
        isHash: true
      }, done);
    }
    return done(null, uid);
  }], (error, uid) => {
  	if(error) {
  		pino.error({ method: 'findOrCreateUser', input: user, error: error });
  		return callback(error);
  	}
  	pino.info({ method: 'findOrCreateUser', input: user, output: uid });
  	callback(null, uid);
  });

}

module.exports = Controllers;