this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	function timeout(callback, delay) {
		var id = new Number(setTimeout(callback, delay));
		id.cancel = function() { clearTimeout(id); };
		return id;
	};
	
	
	uCoz.timeout = timeout;
	
	return uCoz;
}).call(this, this.uCoz || {});
