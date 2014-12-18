this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	uCoz.controlPanel.handle.hacks = function(withinSelector) {
		
		globalContext.console && globalContext.console.info && globalContext.console.info('uCoz.controlPanel.handle.hacks');
		
		// костыли-костылюшки:
		setTimeout(function() {
			
			$('input[type="radio"]').each(function() {
				var elem = $(this);
				elem.parents('.u-block_line').eq(0).find('label').click(function(event) {
					var label = $(this);
					var target = label.attr('for');
					var radio = $('#' + target);
					var name = radio.attr('name');
					console.log('radio', name);
					$('input[type="radio"][name="' + name + '"]').removeAttr('checked').prop('checked', false).filter(radio).attr('checked', 'checked').prop('checked', true);
				});
			});
			
		}, 500);
		
		uPanel.init(withinSelector);
		
	};
	
	return uCoz;
}).call(this, this.uCoz || {});
