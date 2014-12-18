this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	var location = globalContext.location || {};
	var history  = globalContext.history  || {};
	
	
	var navigate = {
		internal: {}
	};
	
	
	// overrideable:
	navigate.selector = function(key) {
		return '[data-ucoz-navigate-to-target="' + key + '"]';
	};
	
	
	navigate.force = function(url) {
		url = url && url.toString ? url.toString() : '';
		if( url ) {
			location.replace(url);
		} else {
			location.reload();
		};
		return this;
	};
	
	
	navigate.local = function(url, data) {
		url = uCoz.URL.instance(url);
		return !url.host() || ( url.host() === location.hostname && url.port() == location.port );
	};
	
	
	navigate.to = function(url, eventData) {
		if( !history.pushState ) {
			return navigate.force(url);
		};
		
		if( !navigate.local(url) ) {
			return navigate.force(url);
		};
		
		url = uCoz.URL.instance(url);
		
		var ajaxURL = url.clone();
		ajaxURL.query().ajax = true;
		
		url = url.toString();
		ajaxURL = ajaxURL.toString();
		
		$(document).trigger('ucoz-navigate-to-started', { url: url, data: eventData });
		
		return $.get(ajaxURL).error(function() {
			globalContext.console && globalContext.console.error && globalContext.console.error('uCoz.navigate.to: failed to fetch ' + ajaxURL, arguments);
			navigate.force(url);
			return null;
		}).success(function(data) {
			
			if( typeof data !== 'object' ) {
				try {
					data = JSON.parse(data);
				} catch(exception) {
					globalContext.console && globalContext.console.error && globalContext.console.error('uCoz.navigate.to: JSON.parse failed for ' + ajaxURL, exception, arguments);
					navigate.force(url);
					return null;
				};
			};
			
			var affectedSelectors = navigate.applyPartials('body', data);
			
			if( affectedSelectors.error ) {
				globalContext.console && globalContext.console.error && globalContext.console.error('uCoz.navigate.applyPartials: failed while uCoz.navigate.to ' + ajaxURL, affectedSelectors.error);
				navigate.force(url);
				return;
			};
			
			history.pushState({ url: url }, '', url);
			
			affectedSelectors = affectedSelectors.join(', ');
			
			$(document).trigger('ucoz-navigate-to-finished', { selectors: affectedSelectors, data: eventData });
			
			globalContext.console && globalContext.console.info && globalContext.console.info('uCoz.navigate.to: ' + url + ' - OK');
			
			return data;
		});
		
	};
	
	
	navigate.handle = function(withinSelector) {
		
		// if onpopstate was not handled by this module yet:
		if( !navigate.internal.handled ) {
			// remember previous onpopstate handler:
			var onpopstate = globalContext.onpopstate;
			
			// set new onpopstate handler:
			globalContext.onpopstate = function(popstate) {
				onpopstate && onpopstate.call(this, popstate);
				navigate.to(popstate.state.url);
			};
			
			// remembed, that current module handled onpopstate:
			navigate.internal.handled = true;
		};
		
		// handle links within selector:
		var within = $(withinSelector || 'body');
		
		within.find('a').not('[target]').click(function(event) {
			
			// only left mouse button should be handled:
			if( event.button !== 0 ) {
				return;
			};
			
			// handle only pure URLs:
			if( !this.href || /^\s*(javascript|void|#)/.test(this.href) ) {
				return;
			};
			
			event.preventDefault && event.preventDefault();
			navigate.to(this.href, event);
			return false;
		});
		
		return navigate;
	};
	
	
	// var affectedSelectorsArray = uCoz.navigate.applyPartials();
	// if( affectedSelectorsArray.error ) throw affectedSelectorsArray.error;
	navigate.applyPartials = function(withinSelector, partials) {
		withinSelector = $(withinSelector || 'html');
		var affectedSelectors = [];
		for( var rawSelector in partials ) {
			var selector = navigate.selector(rawSelector);
			var html = partials[rawSelector];
			try {
				withinSelector.find(selector).html(html);
			} catch(exception) {
				affectedSelectors.error = exception;
				return affectedSelectors;
			};
			affectedSelectors.push(selector);
		};
		return affectedSelectors;
	};
	
	
	uCoz.navigate = navigate; uCoz.navigate.dependencies = ['URL'];
	
	return uCoz;
}).call(this, this.uCoz || {});
