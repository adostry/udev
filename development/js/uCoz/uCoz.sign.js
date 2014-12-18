this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	var sign = {
		internal: {
			signs: {}
		}
	};
	
	
	sign.get = function(signKey, defaultValue) {
		return sign.internal.signs[signKey] || defaultValue || 'Error: no sign ' + signKey;
	};
	
	
	sign.add = function(signs) {
		for( var signKey in signs ) {
			var signValue = signs[signKey];
			sign.internal.signs[signKey] = signValue;
		};
		return sign;
	};
	
	
	uCoz.sign = sign;
	
	return uCoz;
}).call(this, this.uCoz || {});
