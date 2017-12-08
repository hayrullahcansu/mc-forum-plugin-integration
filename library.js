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
	router.get('/check_session',middlewares,controllers.CheckSession);
	router.post('/api/AuthFromBaseSite',middlewares,controllers.AuthFromBaseSite);
	callback();
};

module.exports = plugin;