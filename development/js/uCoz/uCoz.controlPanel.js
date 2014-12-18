this.uCoz = (function(uCoz) {
	'use strict';

	var globalContext = this;


	var controlPanel = {
		internal: {
			config: {}
		},
		handle: {},
		video: {}
	};


	controlPanel.setConfig = function(config) {
		for( var key in config ) {
			controlPanel.internal.config[key] = config[key];
		};
		return controlPanel;
	};


	controlPanel.getConfig = function() {
		return controlPanel.internal.config;
	};


	controlPanel.loadStarted = uCoz.debounced(function() {
		window.uCoz.notify.success(uCoz.sign.get('loading', 'Загрузка'), uCoz.sign.get('please_wait', 'Подождите, пожалуйста...'));
	}, 300);


	controlPanel.video.oEmbed = function(url) {
		return uCoz.oEmbed.lookup(url).success(function(resp) {
			if( !resp || !resp.oembed || resp.oembed.error ) {
				return controlPanel.video.oEmbed.error(resp);
			};
			var videoData = uCoz.oEmbed.convertToVideoModuleData(resp);
			var form = $('form.u-form');
			uCoz.form(form).data(videoData);
			uCoz.notify.success(uCoz.sign.get('success', 'ОК'), uCoz.sign.get('video_oembed_fetch', 'Данные видео получены'), 1500);
			if( videoData.screenshots ) {
				form.find('.file-uploader').fileUploader().fileUploader('set', {
					index: 0,
					name: 'screenshot',
					url: videoData.screenshots,
					remote: true
				});
			};
		}).fail(function(jqXHR) {
			controlPanel.video.oEmbed.error(jqXHR.responseText);
		});
	};


	controlPanel.video.oEmbed.error = function videoOEmbedError(resp) {
		uCoz.notify.error(uCoz.sign.get('error', 'Ошибка'), uCoz.sign.get('video_oembed_failed', 'Не удалось получить данные видео'), 3000);
		globalContext.console && globalContext.console.error && globalContext.console.error('video_oembed_failed', resp);
	};


	controlPanel.video.showEntryModal = function() {
		var dialogSelectTypeForm = $('#video-pre-add');
		var form = $('.u-modal_form');
		var choice = '';
		var modalManager;
		var headerInputs = {
			url: '#wrapper-for-url',
			html: '#wrapper-for-embobject'
		};

		function lockSubmitButton(){
			$('.ui-dialog button.submit-for').prop('disabled', true);
		};

		function unblockSubmitButton(){
			$('.ui-dialog button.submit-for').prop('disabled', false);
		};

		function showAdditionalFields() {
			form.find('.u-block .u-block_line').not($.map(headerInputs,function(v,k){return k, v;}).join(', ')).show('slow');
		};

		function hideAdditionalFields() {
			form.find('.u-block .u-block_line').not($.map(headerInputs,function(v,k){return k, v;}).join(', ')).hide('slow');
		};

		function showHeaderField(choice){
			var uBlocksLine = form.find('.u-block .u-block_line').filter($.map(headerInputs,function(v,k){return k, v;}).join(', '));
			headerInputs[choice] && uBlocksLine.not(headerInputs[choice]).hide();
			headerInputs[choice] && uBlocksLine.filter(headerInputs[choice]).show();
		};

		var openUrlForm = uCoz.debounced(function() {
			function sendErrorNotification() {
				var urlBlock = $('#wrapper-for-url');
				var lastChild = urlBlock.children().last();
				var input = urlBlock.find('input[type="text"]');
				var errorMessage = uCoz.sign.get('video_oembed_bad_link', 'Видеосервис не поддерживается, либо ссылка является неправильной');
				var descriptionError = $('<p>' + errorMessage + '</p>');

				descriptionError.addClass('u-form-error-description');
				lastChild.is('p') || descriptionError.insertAfter(lastChild);
				input.addClass('u-form-error');
			}
			function hideNotification() {
				var urlBlock = $('#wrapper-for-url');
                var descriptionError = urlBlock.find('.u-form-error-description');
				var input = urlBlock.find('input[type="text"]');

                descriptionError.remove();
				input.removeClass('u-form-error');
			}

			var videoURL = (urlInput.val() || '').replace(/^\s+|\s+$/g, '');
			videoURL && /^https?:\/\//i.test(videoURL) && controlPanel.video.oEmbed(videoURL).success(function(data) {
				if (data && data.oembed && !data.oembed.error) {
					showAdditionalFields();
					modalManager.unlockTabs('all');
					unblockSubmitButton();
					hideNotification();
				} else {
					sendErrorNotification();
					hideAdditionalFields();
					modalManager.lockTabs('all');
					lockSubmitButton();
				}
			});
			!(videoURL && /^https?:\/\//i.test(videoURL)) && sendErrorNotification();
		}, 750);


		var openHtmlForm = uCoz.debounced(function() {
			if (!/^\s*$/.test(embobjectInput.val())){
				showAdditionalFields();
				modalManager.unlockTabs('all');
				unblockSubmitButton();
			} else {
				hideAdditionalFields();
				modalManager.lockTabs('all');
				lockSubmitButton();
			}
		}, 1);


		function choose(event) {
			event && event.preventDefault && event.preventDefault();
			dialogSelectTypeForm.dialog("isOpen") && dialogSelectTypeForm.dialog("close");
			choice = $(this).attr('data-choice');
			form.find('.u-block .u-block_line').hide();
			showHeaderField(choice);
			modalManager = controlPanel.video.showEntryModalFull(null, uCoz.sign.get('adding_entry', 'Добавление материала'), uCoz.sign.get('add', 'Добавить'));
			modalManager.lockTabs('all');
			lockSubmitButton();
		};

		if( !dialogSelectTypeForm.data('choiceHandled') ) {
			var urlInput = form.find('[name="url"]');
			var embobjectInput = form.find('[name="embobject"]');

			urlInput.on('input', openUrlForm);
			embobjectInput.on('input', openHtmlForm);
			dialogSelectTypeForm.on('click', 'button', choose);

			dialogSelectTypeForm.data('choiceHandled', true);
		};

        var optionPosition = {
            my: "right top",
            at: "right top+53",
            of: ".u-content",
            "collision": "fit fit"
        };
		dialogSelectTypeForm.dialog({
			dialogClass: 'dark-skin',
			width: 450,
			position: optionPosition
		});
        $(window).resize(function () {
            dialogSelectTypeForm.dialog("option", "position", optionPosition);
        });
		return null;
	};


	controlPanel.video.showEntryModalFull = function(dialogContainer, titleText, applyButtonText) {
		var modalManager = controlPanel.showModalForm(dialogContainer, titleText, applyButtonText);
		return modalManager;
	};


	controlPanel.showModalForm = function(dialogContainer, titleText, applyButtonText) {
		dialogContainer = $(dialogContainer || '.u-modal_form');
		var dialogOptions = {
			dialogClass: 'dark-skin',
			buttons: [
				{
					text: applyButtonText || uCoz.sign.get('apply', 'Применить'),
					class: 'u-form-btn prior submit-for',
					click: function (event) {
						event && event.preventDefault && event.preventDefault();
						var elem = $(this);
						window.uCoz.notify.success(uCoz.sign.get('loading', 'Загрузка'), uCoz.sign.get('please_wait', 'Подождите, пожалуйста...'));
						uCoz.form(elem.find('form')).submit().done(function() {
							elem.dialog('destroy');
							uCoz.navigate.to(location.href);
							window.uCoz.notify.success(uCoz.sign.get('loading', 'OK'), uCoz.sign.get('please_wait', 'Готово.'), 1000);
						}).fail(function(jqXHR, textStatus, errorThrown) {
							// TODO: обрабатывать ошибки валидации (400)
							var defaultErrorAction = false;
							try {
								var data = JSON.parse(jqXHR.responseText);
								if( data && data.error && data.error.description ) {
									uCoz.notify.error(uCoz.sign.get('error', 'Ошибка'), data.error.description, 3000);
								} else {
									defaultErrorAction = true;
								};
							} catch(exception) {
								defaultErrorAction = true;
							};
							if( defaultErrorAction ) {
								uCoz.notify.error(uCoz.sign.get('error', 'Ошибка'), uCoz.sign.get('request_error', 'Ошибка при выполнении запроса (' + jqXHR.status + ')'), 3000);
							};
						});
						$('.bottom-panel_wrap').fadeIn('fast');
						$('.scroll-top-panel').fadeIn('fast');
						return false;
					}
				},
				{
					text: uCoz.sign.get('close', 'Закрыть'),
					class: 'cm-edit-button u-form-btn',
					click: function () {
						$(this).dialog('destroy');
						//$('.bottom-panel_wrap').fadeIn('fast');
						//$('.scroll-top-panel').fadeIn('fast');
					}
				}
			]
		};
		if( titleText ) {
			dialogOptions.title = titleText;
		};
		var tabOptions = {
			activate: function(event, ui) {
				// ~ console.log(ui.newTab);
			}
		};
		var options = {
			tabSelector: '.tabs-in-dialog',
			dialogOptions: dialogOptions,
			tabOptions: tabOptions
		};
		var modalManager = dialogContainer.dialogTabs(options);
		// перезагрузка селектов, в табах, из-за AJAXa не работали
		dialogContainer.find('.tabs-in-dialog').find('select[multiple]').each(function(i, e){
			$(e).get(0).sumo.unload();
			$(e).SumoSelect();
		});
		// ужоснах:
		dialogContainer.find('#u-tab_main_fieldset').on('mousedown', function(event){
			$('.tabs-in-dialog').find('select[multiple]').each(function(index, element){
				$(event.target).closest(".SumoSelect").length == 0 && $(element).get(0).sumo.hideOpts();
			});
		});
		// вот дейтпиккер можно вобще в отдельный controlPanel.handle.datetimePicker() вынести:
		dialogContainer.find('.u-datetime_picker').datepicker({firstDay: 1, nextText: '>', prevText: '<'});
		dialogContainer.find('.u-user_picker').comboboxRemoteAutocomplete();
		// блокирование и разблокирование табов пример
		//modalManager.lockTabs('all');
		//modalManager.unlockTabs(['u-tab_details_fieldset', 'u-tab_options_fieldset']);
		return modalManager;
	};


	controlPanel.handle.entityForm = function(withinSelector) {
		var forms = $(withinSelector).find('form.entity-form');
		if( !forms.length ) {
			return controlPanel.handle;
		};
		return controlPanel.handle;
	};


	controlPanel.handle.settingsForm = function(withinSelector) {
		var forms = $(withinSelector).find('form.settings-form')

		if( !forms.length ) {
			$('.u-form-helpers').fadeOut('fast');
			return controlPanel.handle;
		};

		// primitive data-binding:
		forms.find('[data-text-target]').change(function(event) {
			var elem = $(this);
			var target = elem.attr('data-text-target');
			$(target).text(elem.val());
		});

		// separate submit button (outside form):
		$('.submit-for').not('[data-submit-for-handled]').click(function(event) {
			var target = $(this).attr('data-target');
			target = $(target);
			target.submit();
		}).attr('data-submit-for-handled', true);

		return controlPanel.handle;
	};


	controlPanel.handle.formSubmit = function(withinSelector) {
		var forms = $(withinSelector).find('form');

		// ~ forms.find('button[name]').not(':disabled').click(function(event) {
			// ~ event && event.preventDefault && event.preventDefault();
			// ~ var button = $(this);
			// ~ var form = button.parents('form').eq(0);
			// ~ var sameNameOtherButtons = form.find('[name=' + button.attr('name') + ']').not(button);
			// ~ sameNameOtherButtons.each(function() {
				// ~ var currentButton = $(this);
				// ~ currentButton.data('wasDisabled', currentButton.prop('disabled') ? true : false).prop('disabled', true);
			// ~ });
			// ~ var uForm = uCoz.form(form);
			// ~ uForm.submit().always(function() {
				// ~ sameNameOtherButtons.each(function() {
					// ~ var currentButton = $(this);
					// ~ currentButton.prop('disabled', currentButton.data('wasDisabled') ? true : false);
				// ~ });
			// ~ });
			// ~ return false;
		// ~ });

		// handle actual form submit:
		forms.each(function() {
			uCoz.form(this);
		});
		forms.submit(function(event) {
			event.preventDefault && event.preventDefault();

			uCoz.notify.success(uCoz.sign.get('storing', 'Сохранение...'), uCoz.sign.get('please_wait', 'Подождите, пожалуйста'));

			var form = uCoz.form(this);

			form.submit().done(function(data) {
				uCoz.notify.success(uCoz.sign.get('stored', 'Сохранено'), uCoz.sign.get('settings_updated', 'Настройки успешно обновлены'), 1500);
				var formData = form.data(data).data();
				for( var field in formData ) {
					$('#' + field).removeClass('u-form-error').parents('.u-block_line').find('.u-form-error-text').text('').hide();
				};
			}).fail(function(jqXHR) {
				uCoz.notify.error(uCoz.sign.get('error', 'Ошибка'), uCoz.sign.get('settings_error', 'Ошибка при сохранении настроек'), 1500);
				var error;
				try {
					error = JSON.parse(jqXHR.responseText);
					error = error.error;
				} catch(e) {
					return globalContext.console && globalContext.console.error && globalContext.console.error('Failed to parse JSON error', e, resp);
				};
				if( error && error.invalid ) {
					var fields = error.invalid;
					for( var field in fields ) {
						var validators = fields[field];
						var target = $('#' + field).addClass('u-form-error');
						var errorContainer = target.parents('.u-block_line').eq(0).find('.u-form-error-text');
						if( !errorContainer.length ) {
							errorContainer = $('<span/>').addClass('u-form-error-text').insertAfter(target);
						};
						errorContainer.show().text(validators.join(', '));
					};
				};
			});

			return false;
		});

		return controlPanel.handle;
	};


	controlPanel.handle.forms = function(withinSelector) {
		var forms = $(withinSelector).find('form');
		var formHelpers = $('.u-form-helpers');

		if( !forms.length ) {
			formHelpers.fadeOut('fast');
			return controlPanel.handle;
		};

		if( forms.filter('.settings-form').length ) {
			formHelpers.find('.submit-for').text(uCoz.sign.get('save', 'Сохранить'));
			controlPanel.handle.settingsForm(withinSelector);
		} else {
			formHelpers.find('.submit-for').text(uCoz.sign.get('add', 'Добавить')).click(function(event) {
				if( $(this).attr('data-ucoz-module') == 'video' && $('#video-pre-add').length ) {
					controlPanel.video.showEntryModal();
				} else {
					controlPanel.showModalForm();
				};
			});
			controlPanel.handle.entityForm(withinSelector);
		};

		formHelpers.fadeIn('fast');

		return controlPanel.handle;
	};


	controlPanel.handle.entryFields = function(withinSelector) {
		$(withinSelector).find('.dynamic-fields').dynamicFields();
		return controlPanel.handle;
	};


	controlPanel.handle.moduleCategories = function(withinSelector) {
		function categoriesMultiUpdateFor(field) {
			return function(ids) {
				var url = new uCoz.URL(globalContext.location.href);
				if( !/\.json$/.test(url.path()) ) {
					url.path( url.path() + '.json' );
				};
				var data = {};
				data[field] = ids.join(',');
				$.post(url.toString(), data).done(function() {
					url.path( url.path().replace(/\.json$/, '') );
					uCoz.navigate.to(url);
				}).fail(function() {
					uCoz.notify.error(
						uCoz.sign.get('error', 'Ошибка'),
						uCoz.sign.get('changes_failed', 'Не удалось применить изменения'),
						3000
					);
				});
			};
		};

		var options = {
			removeRequested: categoriesMultiUpdateFor('remove'),
			reorderRequested: categoriesMultiUpdateFor('reorder'),
			editRequested: function (id) {
				var categoryData = uCoz.form('.sc-category-container[data-id="' + id + '"]').data();
				uCoz.form('form.u-form').data(categoryData);
				controlPanel.showModalForm();
			}
		};
		var categoriesManager = $(withinSelector).find('.module-categories').sortableCategories(options);
		return controlPanel.handle;
	};


	controlPanel.handle.moduleEntries = function(withinSelector) {
		var entriesManager = $(withinSelector).find('.module-entries').changingMaterials();
		entriesManager.bind('changingmaterialsedit', function(event, params){
			var id = params.id;
			var json = $(withinSelector).find('.cm-material-container[data-id="' + id + '"] .cm-json').val();
			var entryData = JSON.parse(json);
			var form = $(withinSelector).find('form.u-form');
			uCoz.form(form).clear().data(entryData);
			form.find('.u-block .u-block_line').filter('#wrapper-for-url').hide();
			form.find('.u-block .u-block_line').not('#wrapper-for-url').show();
			$('.bottom-panel_wrap').fadeOut('fast');
			$('.scroll-top-panel').fadeOut('fast');
			if( entryData.entry_attachments && entryData.entry_attachments.length ) {
				var fileUploader = form.find('.file-uploader[data-field-name="file"]').fileUploader();
				fileUploader.fileUploader('clear');
				for( var i = 0; i < entryData.entry_attachments.length; i++ ) {
					var attachment = entryData.entry_attachments[i];
					attachment.index = i;
					// ~ attachment.preview = true;
					fileUploader.fileUploader('set', attachment);
				};
			};
			if( entryData.fname ) {
				var fileUploader = form.find('.file-uploader[data-field-name="fname"]').fileUploader();
				fileUploader.fileUploader('clear');
				entryData.fname.index = 0;
				fileUploader.fileUploader('set', entryData.fname);
			};
			if( entryData.screen ) {
				var fileUploader = form.find('.file-uploader[data-field-name="screen"]').fileUploader();
				fileUploader.fileUploader('clear');
				entryData.screen.index = 0;
				fileUploader.fileUploader('set', entryData.screen);
			};
			controlPanel.showModalForm();
		});
		entriesManager.bind('changingmaterialsremove', function(event, params){
			var ids = params.ids;
			console.info('removeRequested', ids);
			var url = new uCoz.URL(globalContext.location.href);
			if( !/\.json$/.test(url.path()) ) {
				url.path( url.path() + '.json' );
			};
			var data = {};
			data.remove = ids.join(',');
			$.post(url.toString(), data).done(function() {
				url.path( url.path().replace(/\.json$/, '') );
				uCoz.navigate.to(url);
			}).fail(function() {
				uCoz.notify.error(
					uCoz.sign.get('error', 'Ошибка'),
					uCoz.sign.get('remove_failed', 'Удаление не удалось'),
					3000
				);
			});
		});
		return controlPanel.handle;
	};


	controlPanel.handle.moduleFilters = function(withinSelector) {
		var options = {};
		var filtersContainer = $(withinSelector).find('.module-filters');
		var filtersManager = filtersContainer.moduleFilters(options);
		filtersContainer.parents('form.u-form').eq(0).submit(function(event) {
			filtersManager.save();
		});
		return controlPanel.handle;
	};


	controlPanel.handle.fileUploader = function(withinSelector) {
		$(withinSelector).find('.file-uploader').each(function() {
			$(this).fileUploader();
		});
		return controlPanel.handle;
	};


	controlPanel.handle.bottomPanel = function(withinSelector) {
		$('.bottom-panel_wrap').fadeOut('fast');
		var targetWrapper = $(withinSelector).find('.module-entries, .module-categories');
		if( !targetWrapper.length ) {
			return controlPanel.handle;
		};
		var checkboxes = targetWrapper.find('input[type="checkbox"]');
		checkboxes.change(function(event) {
			if( checkboxes.filter(':checked').length ) {
				$('.bottom-panel_wrap').fadeIn('fast');
			} else {
				$('.bottom-panel_wrap').fadeOut('fast');
			};
		});
		return controlPanel.handle;
	};


	controlPanel.handle.entitySearch = function(withinSelector) {
		var elem = $(withinSelector).find('#search');
		var search = uCoz.debounced(function(event) {
			var query = (elem.val() || '').trim();
			var url = new uCoz.URL(globalContext.location.href);
			if( query == (url.query().search || '') ) {
				return;
			};
			url.query().search = query;
			url.query().page = 1;
			uCoz.navigate.to(url.toString(), event);
			return;
		}, 750);
		elem.bind('input', search);
		return controlPanel.handle;
	};


	controlPanel.handle.entityCategory = function(withinSelector) {
		var elem = $(withinSelector).find('#category');
		var filterCategory = function(event) {
			var category = parseInt(elem.val() || '0');
			var url = new uCoz.URL(globalContext.location.href);
			if( category == (url.query().category || '') ) {
				return;
			};
			url.query().category = category;
			url.query().page = 1;
			uCoz.navigate.to(url.toString(), event);
			return;
		};
		elem.bind('change', filterCategory);
	};


	controlPanel.handle.all = function(withinSelector) {
		uCoz.controlPanelGlobals.handle(withinSelector);
		controlPanel.handle.forms(withinSelector);
		controlPanel.handle.formSubmit(withinSelector);
		// ~ controlPanel.handle.settingsForm(withinSelector);
		// ~ controlPanel.handle.entityForm(withinSelector);
		controlPanel.handle.entryFields(withinSelector);
		controlPanel.handle.moduleCategories(withinSelector);
		controlPanel.handle.moduleEntries(withinSelector);
		controlPanel.handle.moduleFilters(withinSelector);
		// ~ controlPanel.handle.videoOEmbed(withinSelector);
		controlPanel.handle.fileUploader(withinSelector);
		controlPanel.handle.bottomPanel(withinSelector);
		controlPanel.handle.entitySearch(withinSelector);
		controlPanel.handle.entityCategory(withinSelector);
		controlPanel.handle.hacks && controlPanel.handle.hacks();
		return controlPanel.handle;
	};


	uCoz.controlPanel = controlPanel; uCoz.controlPanel.dependencies = ['debounced', 'sign', 'navigate', 'notify', 'oEmbed', 'controlPanelGlobals'];

	return uCoz;
}).call(this, this.uCoz || {});
