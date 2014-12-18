window.uCoz = (function(uCoz) {
	
	var dom = {
		element: $('#u-alert'),
		status: null,
		title: null,
		text: null
	};
	
	
	if( !dom.element.length ) {
		dom.element = $(''
			+ '<div id="u-alert" class="u-alert">'
				+ '<div class="u-alert_wrap">'
					+ '<span class="u-alert_status"></span>'
					+ '<h3></h3>'
					+ '<p></p>'
				+ '</div>'
			+ '</div>'
		).appendTo('body');
	};
	
	
	$(window).scroll(function() {
		var top = $(document).scrollTop();
		if( top < 59 ) {
			dom.element.css({top: '70px', position: 'absolute'});
		} else {
			dom.element.css({top: '10px', position: 'fixed'});
		};
	});
	
	
	dom.status = dom.element.find('span.u-alert_status');
	dom.title = dom.element.find('h3');
	dom.text = dom.element.find('p');
	
	
	uCoz.notify = {};
	
	
	uCoz.notify.show = function(className, title, text, timeout) {
		dom.status.removeClass('success').removeClass('error').addClass(className);
		dom.title.text(title || '');
		dom.text.text(text || '');
		dom.element.fadeIn('slow');
		timeout && dom.element.delay(timeout).fadeOut('slow');
		return this;
	};
	
	
	uCoz.notify.success = function(title, text, timeout) {
		return this.show('success', title, text, timeout);
	};
	
	
	uCoz.notify.error = function(title, text, timeout) {
		return this.show('error', title, text, timeout);
	};
	
	
	uCoz.notify.hide = function(speed) {
		if( speed ) {
			dom.element.fadeOut(speed);
		} else {
			dom.element.hide();
		};
		return this;
	};
	
	
	return uCoz;
})(window.uCoz || {});
