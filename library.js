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
//	router.get('/AuthFromBaseSite',middlewares,middleware.buildHeader, controllers.AuthFromBaseSite);
//	router.get('api/AuthFromBaseSite',middlewares,controllers.AuthFromBaseSite);
	callback();
};

plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/quickstart',
		icon: 'fa-tint',
		name: 'Quickstart'
	});

	callback(null, header);
};

module.exports = plugin;