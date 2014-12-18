this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	function URL(url) {
		this.internal = {
			url: {}
		};
		this.init(url);
	};
	
	
	URL.instance = function(url) {
		return url instanceof URL ? url : new URL(url);
	};
	
	
	URL.prototype.init = function(url) {
		if( typeof url === 'string' ) {
			this.internal.url = uCoz.parse.url(url);
		} else {
			this.internal.url = url || {};
		};
		return this;
	};
	
	
	URL.prototype.protocol = function(protocol) {
		if( !protocol ) {
			return this.internal.url.protocol || '';
		};
		protocol = protocol.toString ? protocol.toString() : '';
		this.internal.url.protocol = protocol;
		return this;
	};
	
	
	URL.prototype.host = function(host) {
		if( !host ) {
			return this.internal.url.host || '';
		};
		host = host.toString ? host.toString() : '';
		this.internal.url.host = host;
		return this;
	};
	
	
	URL.prototype.port = function(port) {
		if( !port ) {
			return this.internal.url.port || 0;
		};
		port = parseInt(port.toString ? port.toString() : '0');
		port = port.toString() === 'NaN' ? 0 : port;
		this.internal.url.port = port;
		return this;
	};
	
	
	URL.prototype.path = function(path) {
		if( !path ) {
			return this.internal.url.path || '/';
		};
		path = path.toString() ? path.toString() || '/' : '/';
		this.internal.url.path = path;
		return this;
	};
	
	
	URL.prototype.query = function(query) {
		if( !query ) {
			return this.internal.url.query || {};
		};
		query = typeof query === 'object' ? query || {} : uCoz.parse.query(query.toString ? query.toString() : '');
		this.internal.url.query = query;
		return this;
	};
	
	
	URL.prototype.hash = function(hash) {
		if( !hash ) {
			return this.internal.url.hash || '';
		};
		hash = hash.toString ? hash.toString() : '';
		this.internal.url.hash = hash;
		return this;
	};
	
	
	URL.prototype.clone = function() {
		return URL.instance(this.toString());
	};
	
	
	URL.prototype.toString = function() {
		var protocol = this.protocol();
		var host = this.host();
		var port = this.port();
		var path = this.path();
		var query = this.query();
		var hash = this.hash();
		
		var pieces = [
			host && protocol ? protocol + '://' : '',
			host ? host : '',
			host && port ? ':' + port : '',
			path ? path : '/',
			query ? uCoz.build.query(query) : '',
			hash ? '#' + hash : ''
		];
		
		var url = '';
		
		for( var i = 0; i < pieces.length; i++ ) {
			var piece = pieces[i];
			if( !piece ) {
				continue;
			};
			url += piece;
		};
		
		return url;
	};
	
	
	uCoz.URL = URL; uCoz.URL.dependencies = ['parse', 'build'];
	
	return uCoz;
}).call(this, this.uCoz || {});
