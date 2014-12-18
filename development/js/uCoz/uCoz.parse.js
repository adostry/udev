this.uCoz = (function() {
	'use strict';
	
	var globalContext = this;
	
	
	var parse = {
		internal: {
			regexp: {
				url: /^\s*(?:([0-9a-z]+):\/\/)?(?:([0-9a-z_.-]+)(?::([0-9]+))?)?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?\s*$/i
			}
		}
	};
	
	
	parse.query = function(query) {
		var parsed = {};
		var pairs = query.split(/&|;/);
		for( var i = 0; i < pairs.length; i++ ) {
			if( !pairs[i].length ) {
				continue;
			};
			var pair = pairs[i].split(/=/);
			var key = pair.shift();
			var value = pair.join('=');
			key = decodeURIComponent(key);
			value = decodeURIComponent(value);
			if( typeof parsed[key] === 'undefined' ) {
				parsed[key] = value;
			} else {
				if( !parsed[key].push ) {
					parsed[key] = [parsed[key]];
				};
				parsed[key].push(value);
			};
		};
		return parsed;
	};
	
	
	parse.url = function(url) {
		var buffer = parse.internal.regexp.url.exec(url);
		var parsed = {
			protocol: buffer[1] || '',
			host: buffer[2] || '',
			port: parseInt(buffer[3] || '0'),
			path: buffer[4] || '/',
			query: parse.query(buffer[5] || ''),
			hash: buffer[6] || ''
		};
		return parsed;
	};
	
	
	uCoz.parse = parse;
	
	return uCoz;
}).call(this, this.uCoz || {});
