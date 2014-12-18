this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	function debounced(callback, delay) {
		var id = null;
		var wrapper = function() {
			var ctx = this;
			var args = arguments;
			if( id ) {
				id.cancel();
			};
			id = uCoz.timeout(function() {
				id.cancel();
				id = null;
				callback.apply(ctx, args);
			}, delay);
		};
		wrapper.cancel = function() {
			if( id ) {
				id.cancel();
			};
			return wrapper;
		};
		return wrapper;
	};
	
	
	uCoz.debounced = debounced; uCoz.debounced.dependencies = ['timeout'];
	
	return uCoz;
}).call(this, this.uCoz || {});
