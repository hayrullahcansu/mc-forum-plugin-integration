"use strict";

var controllers = require('./lib/controllers'),
	plugin = {};
var middleware = module.parent.require('./middleware');
var User = module.parent.require('./user');

plugin.init = function (params, callback) {
	var router = params.router,
		hostMiddleware = params.middleware,
		hostControllers = params.controllers;
	var middlewares = [
		middleware.maintenanceMode,
		middleware.registrationComplete,
		middleware.redirectToAccountIfLoggedIn
	]
	router.get('/check_session', controllers.CheckSession);

	//will add hostMiddleware.applyCSRF,
	router.post('/api/AuthFromBaseSite', controllers.AuthFromBaseSite);
	router.get('/api/AuthFromBaseSite', controllers.AuthFromBaseSite);
	router.get('/setUserAccessKey', controllers.setUserAccessKey);
	router.get('/getUserAccessKey', controllers.getUserAccessKey);
	callback();
};

module.exports = plugin;