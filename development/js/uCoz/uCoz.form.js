this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	var transportIframeCounter = 0;
	
	
	function Form(jQueryForm) {
		this.internal = {
			form: $(jQueryForm),
			lastClickedButtonEvent: null
		};
		this.initListeners();
		return this;
	};
	
	
	Form.prototype.initListeners = function() {
		var self = this;
		self.internal.form.on('click', 'button', function(event) {
			event.timeStamp = Date.now(); // спасибо тебе, быдлофайрфокс!
			self.internal.lastClickedButtonEvent = event;
		});
		return self;
	};
	
	
	Form.prototype.getData = function() {
		var data = {};
		if( this.internal.lastClickedButtonEvent ) {
			var lastClickedThreshold = 100;
			var lastClickedAgo = Date.now() - this.internal.lastClickedButtonEvent.timeStamp;
			if( lastClickedAgo < lastClickedThreshold ) {
				var button = $(this.internal.lastClickedButtonEvent.target);
				var name = button.attr('name');
				var value = button.val();
				if( name ) {
					data[name] = value;
				};
			};
		};
		var inputs = this.internal.form.find('input, select, textarea').not(':disabled').not('[disabled]').not('[type="file"]');
		inputs.each(function() {
			var input = $(this);
			var name = input.attr('name') || 'undefined';
			var value;
			if( input.is('[type="checkbox"]') ) {
				value = input.prop('checked') ? 1 : 0;
			} else if( input.is('[type="radio"]') ) {
				if( data[name] ) {
					return;
				};
				value = inputs.filter('[type="radio"][name="' + name + '"]').filter(':checked').val();
			} else if( input.is('select[multiple]') ) {
				value = [];
				input.find('option').filter(':selected').each(function() {
					var option = $(this);
					value.push(option.val());
				});
			} else {
				value = input.val();
			};
			if( data[name] ) {
				if( typeof data[name] !== 'array' ) {
					data[name] = [data[name]];
				};
				data[name].push(value);
			} else {
				data[name] = value;
			};
		});
		return data;
	};
	
	
	Form.prototype.setData = function(data) {
		for( var name in data ) {
			var input = this.internal.form.find('[name="' + name + '"]');
			if( !input.length ) {
				if( true ) {
					$('<input/>').attr('type', 'hidden').attr('name', name).val(data[name]).appendTo(this.internal.form).trigger('change');
				};
			} else if( input.is('[type="checkbox"]') ) {
				if( data[name] && data[name] != 0 ) {
					input.prop('checked', true).attr('checked', 'checked');
				} else {
					input.prop('checked', false).removeAttr('checked');
				};
				input.trigger('change');
			} else if( input.is('select') ) {
				if( input.is('[multiple]') ) {
					var selected = data[name];
					if( typeof selected == 'string' || typeof selected == 'number' ) {
						selected = [selected];
					};
					var options = this.internal.form.find('select[name="' + name + '"] option').removeAttr('selected');
					var filter = selected.map(function(val) { return '[value="' + val + '"]'; }).join(', ');
					options.filter(filter).attr('selected', 'selected');
					options.trigger('change');
				} else {
					var options = this.internal.form.find('select[name="' + name + '"] option').removeAttr('selected');
					options.filter('[value="' + data[name] + '"]').attr('selected', 'selected');
					options.trigger('change');
				};
			} else if( input.is('[type="radio"]') ) {
				var inputs = this.internal.form.find('input[type="radio"][name="' + name + '"]').prop('checked', false);
				inputs.filter('[value="' + data[name] + '"]').prop('checked', true);
				inputs.trigger('change');
			} else {
				input.val(data[name]).trigger('change');
			};
		};
		return this;
	};
	
	
	Form.prototype.nonEmptyFileInputCount = function() {
		var nonEmptyFileInputCount = 0;
		this.internal.form.find('input[type="file"]').each(function() {
			if( $(this).val().length ) {
				nonEmptyFileInputCount++;
			};
		});
		return nonEmptyFileInputCount;
	};
	
	
	Form.prototype.data = function(data) {
		if( data ) {
			return this.setData(data);
		} else {
			return this.getData();
		};
	};
	
	
	Form.prototype.setEnctype = function(enctype) {
		this.internal.form.attr('enctype', enctype);
		return this;
	};
	
	
	Form.prototype.getEnctype = function() {
		var enctype = this.internal.form.attr('enctype') || 'application/x-www-form-urlencoded';
		return enctype;
	};
	
	
	Form.prototype.enctype = function(enctype) {
		if( enctype ) {
			return this.setEnctype(enctype);
		} else {
			return this.getEnctype();
		};
	};
	
	
	Form.prototype.setAction = function(action) {
		this.internal.form.attr('action', action);
		return this;
	};
	
	
	Form.prototype.getAction = function() {
		var action = this.internal.form.attr('action') || './';
		return action;
	};
	
	
	Form.prototype.action = function(action) {
		if( action ) {
			return this.setAction(action);
		} else {
			return this.getAction();
		};
	};
	
	
	Form.prototype.setMethod = function(method) {
		this.internal.form.attr('method', method);
		return this;
	};
	
	
	Form.prototype.getMethod = function() {
		var method = this.internal.form.attr('method') || 'POST';
		return method;
	};
	
	
	Form.prototype.method = function(method) {
		if( method ) {
			return this.setMethod();
		} else {
			return this.getMethod();
		};
	};
	
	
	Form.prototype.clear = function() {
		this.internal.form.find('input, textarea, select').each(function() {
			var elem = $(this);
			var type = elem.is('select') ? 'select' : elem.attr('type');
			switch(type) {
				case 'select':
					var options = elem.find('option').removeAttr('selected');
					options.eq(0).attr('selected', 'selected');
				break;
				case 'radio':
					elem.removeAttr('checked').prop('checked', false);
				break;
				default:
					elem.val('');
			};
		});
		return this;
	};
	
	
	Form.prototype.submit = function() {
		var action = this.action();
		var method = this.method();
		var enctype = this.enctype();
		var promise = new jQuery.Deferred();
		if( !/multipart/.test(enctype) && this.nonEmptyFileInputCount() ) {
			enctype = 'multipart/form-data';
		};
		if( /multipart/i.test(enctype) ) {
			var self = this;
			var iframeName = 'ucoz-form-transport-iframe-' + (transportIframeCounter++);
			var transportForm = $('<form/>').attr({
				target: iframeName,
				action: action,
				method: method,
				enctype: enctype
			});
			uCoz.form(transportForm).data(self.data());
			self.internal.form.find('input[type="file"]').each(function() {
				var fileInput = $(this);
				fileInput.data('parent', fileInput.parent());
				transportForm.append(fileInput);
			});
			var iframe = $('<iframe/>').attr('name', iframeName).css('display', 'none').appendTo('body').load(function(event) {
				transportForm.find('input[type="file"]').each(function() {
					var fileInput = $(this);
					var parent = fileInput.data('parent');
					if( !parent ) {
						return;
					};
					parent.append(fileInput);
				});
				var htmlData = this.contentWindow.document.documentElement.outerHTML;
				var jsonData = this.contentWindow.document.documentElement.innerText;
				var data;
				try {
					data = JSON.parse(jsonData);
				} catch(exception) {
					data = htmlData;
				};
				if( data.error ) {
					promise.reject(null, 'fail', data);
				} else {
					promise.resolve(data, 'success', null);
				};
				iframe.remove();
			});
			transportForm.submit();
		} else {
			$.ajax({
				url: action,
				method: method,
				contentType: enctype,
				data: this.data()
			}).done(function(data, textStatus, jqXHR) {
				promise.resolve(data, textStatus, jqXHR);
			}).fail(function(jqXHR, textStatus, errorThrown) {
				promise.reject(jqXHR, textStatus, errorThrown);
			});
		};
		return promise;
	};
	
	
	uCoz.form = function(jQueryForm, forceNewInstance) {
		if( forceNewInstance ) {
			return new Form(jQueryForm);
		};
		jQueryForm = $(jQueryForm);
		var instance = jQueryForm.data('uCoz.form');
		if( !instance ) {
			instance = new Form(jQueryForm);
			jQueryForm.data('uCoz.form', instance);
		};
		return instance;
	};
	
	
	return uCoz;
}).call(this, this.uCoz || {});


/*
	
	var form = uCoz.form('#form-id');
	
	form.setData({
		video_name: 'Тест',
		video_comms: true
	});
	
	form.submit().done(function(data) {
		console.info('form submitted successfully', data);
	}).fail(function() {
		console.error('something wrong...', arguments);
	});
	
*/
