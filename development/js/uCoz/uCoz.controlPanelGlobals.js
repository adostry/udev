this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	var globals = {
		
	};
	
	var internal = {
		handled: false
	};
	
	
	var navigationStarted = uCoz.debounced(function() {
		uCoz.notify.success(
			uCoz.sign.get('loading', 'Загрузка'),
			uCoz.sign.get('please_wait', 'Подождите, пожалуйста...'),
			0
		);
	}, 300);
	
	
	var navigationFinished = function() {
		navigationStarted.cancel();
	};
	
	
	var handleAjaxInterceptors = function(within) {
		
		if( internal.handled ) {
			return globals;
		};
		
		function ajaxInterceptor(data, dataType) {
			if( this.dataTypes && this.dataTypes[0] == 'text' && this.dataTypes[1] == 'json' ) {
				try {
					var obj = JSON.parse(data);
					if( obj ) {
						if( obj.config ) {
							uCoz.controlPanel.setConfig(obj.config);
							delete obj.config;
						};
						if( obj.error ) {
							uCoz.notify.error(
								uCoz.sign.get('error', 'Ошибка'),
								obj.error.description || uCoz.sign.get('request_error', 'При обработке запроса произошла ошибка'),
								3000
							);
							// delete obj.error
						};
						if( obj.notify ) {
							var type = obj.notify.type || 'success';
							uCoz.notify[type](
								obj.notify.title || uCoz.sign.get('ok', 'OK'),
								obj.notify.message || uCoz.sign.get('request_ok', 'Запрос выполнен успешно'),
								typeof obj.notify.timeout !== 'undefined' ? obj.notify.timeout : 0
							);
							delete obj.notify;
						};
						if( obj.partials ) {
							uCoz.navigate.applyPartials('html', obj.partials);
							delete obj.partials;
						};
						if( obj.invoke ) {
							for( var i = 0; i < obj.invoke.length; i++ ) {
								var methodName = obj.invoke[i].shift();
								if( uCoz.controlPanelCallbacks[methodName] ) {
									uCoz.controlPanelCallbacks[methodName].apply(uCoz.controlPanel, obj.invoke[i])
								} else {
									uCoz.console.error('uCoz.controlPanelGlobals', 'handleAjaxInterceptors', 'ajaxInterceptor', 'obj.invoke', 'uCoz.controlPanelCallbacks has no method', methodName);
								};
							};
							delete obj.invoke;
						};
						if( obj.evaluate ) {
							uCoz.console.warn('uCoz.controlPanelGlobals', 'handleAjaxInterceptors', 'ajaxInterceptor', 'obj.evaluate', 'окстись, окаянный, eval это зло!');
							eval(obj.evaluate);
							delete obj.evaluate;
						};
						if( obj.navigate_to ) {
							uCoz.navigate.to(
								obj.navigate_to.reload ? location.href : obj.navigate_to
							);
							delete obj.navigate_to;
						};
						return JSON.stringify(obj); // пц
					};
				} catch(exception) {
					uCoz.console.error('uCoz.controlPanelGlobals', 'handleAjaxInterceptors', 'ajaxInterceptor', 'JSON.parse', exception);
				};
			};
			return data;
		};
		
		$.ajaxSetup({
			dataFilter: ajaxInterceptor
		});
		
		return globals;
	};
	
	
	var handleNavigation = function(within) {
		uCoz.console.info('uCoz.controlPanelGlobals', 'handleNavigation', within);
		
		uCoz.navigate.handle(within);
		
		if( internal.handled ) {
			return globals;
		};
		
		$(document)
			
			.bind('ucoz-navigate-to-started', function(event, data) {
				navigationStarted();
				$(':ui-dialog').dialog('destroy');
			})
			
			.bind('ucoz-navigate-to-finished', function(event, data) {
				navigationFinished();
				uCoz.controlPanel.handle.all(data.selectors);
				if( data.data && data.data.currentTarget ) {
					if( $(data.data.currentTarget).is('.u-pagination_link') ) {
						var table = $('.cm-table, .sc-table');
						if( table.length == 1 ) {
							var offsetTop = $('.u-head').height() + $(window).height() * 0.1;
							var scrollTop = table.offset().top - offsetTop;
							if( scrollTop > 0 ) {
								$('html, body').animate({
									scrollTop: scrollTop
								}, 'fast');
							};
						};
					} else if( $(data.data.currentTarget).is('#search')  ) {
						try {
							var search = $('#search');
							search.get(0).focus();
							search.val(search.val());
						} catch(exeption) {
							// not a problem
						};
					};
				};
			})
			
		;
		
		return globals;
	};
	
	
	globals.handle = function(within) {
		handleAjaxInterceptors(within);
		handleNavigation(within);
		internal.handled = true;
		return globals;
	};
	
	
	uCoz.controlPanelGlobals = globals; uCoz.controlPanelGlobals.dependencies = ['sign', 'notify', 'console', 'navigate', 'debounced', 'navigate', 'controlPanel', 'controlPanelCallbacks'];
	
	return uCoz;
}).call(this, this.uCoz || {});
