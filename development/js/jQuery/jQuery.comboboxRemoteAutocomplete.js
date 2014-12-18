$.widget('custom.comboboxRemoteAutocomplete', {
	_create: function () {
		this.wrapper = $('<span>')
			.addClass('custom-combobox')
			.insertAfter(this.element);

		this.element.hide();
		this.element.parent().addClass('cra-container');
		this._createAutocomplete();
		this._createShowAllButton();
	},

	cache: {},

	_createAutocomplete: function () {
		var value = this.element.val() || '';

		this.input = $('<input>')
			.appendTo(this.wrapper)
			.val(value)
			.attr('title', '')
			.addClass('cra-input combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left')
			.autocomplete({
				delay: 500,
				minLength: 0,
				source: $.proxy(this, '_source'),
				appendTo: this.element.parent(),
				position: {
					my: 'center bottom',
					at: 'center top',
					of: this,
					collision: 'fit fit'
				}
			})
			.tooltip({
				tooltipClass: 'ui-state-highlight'
			});

		this._on(this.input, {
			autocompleteselect: function (event, ui) {
				// Ну что это за говно, епрст:
				// $('#combobox').attr('value', ui.item.value);
				this.element.val(ui.item.value);
				$('.cra-input').removeClass('cra-opened');
			},

			autocompletechange: '_removeIfInvalid'
		});
	},

	_createShowAllButton: function () {
		var input = this.input,
			wasOpen = false;
		// А это что за говно:
		// $('.combobox-input')
		input
			.tooltip()
			.appendTo(this.wrapper)
			.mousedown(function () {
				wasOpen = input.autocomplete('widget').is(':visible');
				//$('.cra-input').addClass('cra-opened');
			})
			.click(function () {
				input.focus();

				if (wasOpen) {
					return;
				}

				input.autocomplete('search', '');
			});
	},

	_source: function (request, response) {
		var cache = this.cache;
		var term = request.term;
		if (term in cache) {
			cache[term] .length || $('.cra-input').removeClass('cra-opened');
			cache[term] .length && $('.cra-input').addClass('cra-opened');
			response(cache[term]);
			return;
		}
		// думаю, с таким подходом данный виджет стоило бы назвать uSiteUserRAC, ну да пофик:
		$.ajax({
			url: window.location.origin + '/panel/api/users.json',
			dataType: 'json',
			data: {
				user_like: request.term
			},
			success: function (data) {
				var formattedResponse = Object(data)['entities'].map(function (e) {
					return {
						label: e['user'],
						value: e['user'],
						option: $('#combobox')
					};
				});
				cache[term] = formattedResponse;
				formattedResponse.length || $('.cra-input').removeClass('cra-opened');
				formattedResponse.length && $('.cra-input').addClass('cra-opened');
				response(formattedResponse);
			}
		})
	},

	_removeIfInvalid: function (event, ui) {

		// Selected an item, nothing to do
		if (ui.item) {
			return;
		}

		// Search for a match (case-insensitive)
		var value = this.input.val(),
			valueLowerCase = value.toLowerCase(),
			valid = false;
		this.element.children('option').each(function () {
			if ($(this).text().toLowerCase() === valueLowerCase) {
				this.selected = valid = true;
				return false;
			}
		});

		// Found a match, nothing to do
		if (valid) {
			return;
		}

		// Remove invalid value
		this.input
			.val('')
			//.attr('title', value + ' didn't match any item')
			.tooltip('open');
		this.element.val('');
		this._delay(function () {
			this.input.tooltip('close').attr('title', '');
		}, 2500);
		this.input.autocomplete('instance').term = '';
	},

	_destroy: function () {
		this.wrapper.remove();
		this.element.show();
	}
});
