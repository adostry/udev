this.uCoz = (function(uCoz) {
	'use strict';
	
	var callbacks = {};
	
	
	callbacks.test = function() {
		// this === window.uCoz
		uCoz.console.error('uCoz.controlPanelCallbacks.test', arguments);
	};
	
	
	uCoz.controlPanelCallbacks = callbacks; uCoz.controlPanelCallbacks.dependencies = ['console'];
	
	return uCoz;
}).call(this, this.uCoz || {});
