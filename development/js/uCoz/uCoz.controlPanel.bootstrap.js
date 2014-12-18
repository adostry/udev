(function() {
	'use strict';
	
	var globalContext = this;
	
	
	if( !globalContext.uCoz ) {
		throw new Error('uCoz.controlPanel.bootstrap: launched, but globalContext has no uCoz object');
	};
	
	
	if( !globalContext.uCoz.controlPanel ) {
		throw new Error('uCoz.controlPanel.bootstrap: launched, globalContext has uCoz, but uCoz has no .controlPanel module');
	};
	
	
	if( !( globalContext.uCoz.controlPanel.handle && globalContext.uCoz.controlPanel.handle.all ) ) {
		throw new Error('uCoz.controlPanel.bootstrap: launched, globalContext has uCoz, uCoz has controlPanel, but controlPanel has no handle.all method');
	};
	
	
	uCoz.controlPanel.handle.all('body');
	
	
	globalContext.console && globalContext.console.info && globalContext.console.info('uCoz.controlPanel.bootstrap: done');
	
	
}).call(this);
