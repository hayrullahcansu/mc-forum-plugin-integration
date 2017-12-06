'use strict';
/* globals $, app, socket */

define('integration', ['settings'], function(Settings) {

	var ACP = {};

    ACP.init = function() {
		$('#save').on('click', function() {
			console.log("hello world !");
			alert("hello world!");
		});
	};
	return ACP;
});