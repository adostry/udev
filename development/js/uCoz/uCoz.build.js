this.uCoz = (function() {
	'use strict';
	
	var globalContext = this;
	
	
	var build = {
		internal: {}
	};
	
	
	build.query = function(query) {
		var pairs = [];
		for( var key in query ) {
			var value = query[key];
			// TODO: это грязный хак, убрать потом, как переведем ПУ на нормальные адреса
			// key = encodeURIComponent(key);
			// value = encodeURIComponent(value);
			key = encodeURI(key);
			value = encodeURI(value);
			pairs.push(key + '=' + value);
		};
		var string = pairs.join('&');
		return string ? '?' + string : string;
	};
	
	
	uCoz.build = build;
	
	return uCoz;
}).call(this, this.uCoz || {});
