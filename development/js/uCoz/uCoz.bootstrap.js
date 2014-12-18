(function() {
	'use strict';
	
	var globalContext = this;
	
	
	if( !globalContext.uCoz ) {
		throw new Error('uCoz.bootstrap: launched, but globalContext has no uCoz object');
	};
	
	
	if( !globalContext.uCoz.init ) {
		throw new Error('uCoz.bootstrap: launched, globalContext has uCoz, but uCoz has no .init method');
	};
	
	
	uCoz.init();
	
	
	globalContext.console && globalContext.console.info && globalContext.console.info('uCoz.bootstrap: done');
	
	
}).call(this);
