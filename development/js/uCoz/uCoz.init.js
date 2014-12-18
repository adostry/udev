this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	function isModule(target) {
		return target && ( typeof target === 'object' || typeof target === 'function' );
	};
	
	
	uCoz.init = function() {
		
		// looping through modules:
		for( var moduleName in uCoz ) {
			
			// module instance:
			var module = uCoz[moduleName];
			
			// not a module, ignoring:
			if( !isModule(module) ) {
				continue;
			};
			
			// handling module dependencies:
			if( module.dependencies && module.dependencies.length ) {
				
				// looping through dependencies:
				for( var i = 0; i < module.dependencies.length; i++ ) {
					var requiredModuleName = module.dependencies[i];
					var requiredModule = uCoz[requiredModuleName];
					if( !isModule(requiredModule) ) {
						throw new Error('uCoz.init: module uCoz.' + moduleName + ' depends on uCoz.' + requiredModuleName);
					};
				};
				
			};
			
		};
		
		return this;
	};
	
	
	return uCoz;
}).call(this, this.uCoz || {});
