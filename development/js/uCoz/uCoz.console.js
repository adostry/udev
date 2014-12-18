this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	var uConsole = {
		internal: {
			muted: false
		}
	};
	
	
	uConsole.setMuted = function(muted) {
		this.internal.muted = muted ? true : false;
		return this;
	};
	
	
	uConsole.getMuted = function() {
		return this.internal.muted;
	};
	
	
	uConsole.log = function() {
		if( this.getMuted() ) {
			return this;
		};
		globalContext.console && globalContext.console.log && globalContext.console.log.apply(globalContext.console, arguments);
		return this;
	};
	
	
	uConsole.info = function() {
		if( this.getMuted() ) {
			return this;
		};
		globalContext.console && globalContext.console.info && globalContext.console.info.apply(globalContext.console, arguments);
		return this;
	};
	
	
	uConsole.warn = function() {
		if( this.getMuted() ) {
			return this;
		};
		globalContext.console && globalContext.console.warn && globalContext.console.warn.apply(globalContext.console, arguments);
		return this;
	};
	
	
	uConsole.error = function() {
		if( this.getMuted() ) {
			return this;
		};
		globalContext.console && globalContext.console.error && globalContext.console.error.apply(globalContext.console, arguments);
		return this;
	};
	
	
	uConsole.dir = function() {
		if( this.getMuted() ) {
			return this;
		};
		globalContext.console && globalContext.console.dir && globalContext.console.dir.apply(globalContext.console, arguments);
		return this;
	};
	
	
	uCoz.console = uConsole; uConsole.dependencies = [];
	
	return uCoz;
}).call(this, this.uCoz || {});
