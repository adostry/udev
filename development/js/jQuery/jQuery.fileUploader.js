jQuery.widget('custom.fileUploader', {
    options: {
        allowedTypes: null,
        maxAttachmentsCount: null,
        linkAllowed: null,
        selector: {
            addInput: '.fu-add-hidden-input',
            addButton: '.fu-add-button',
            addLink: '.fu-add-link',
            addLinkContainer: '.fu-add-link-container',
            removeInput: '.fu-remove-hidden-input',
            urlInput: '.fu-url-input',
            urlButton: '.fu-url-button',
            linkInput: '.fu-link-hidden-input',
            deleteButton: '.fu-delete',
            imageContainer: '.fu-image-container',
            image: '.fu-image',
            list: '.fu-list'
        },
        dataAttr: {
            allowedTypes: 'data-allowed-types',
            maxAttachmentsCount: 'data-max-attachments-count',
            linkAllowed: 'data-link-allowed',
            inputPrefix: 'data-input-prefix'
        },
        modifier: {
            video: 'video',
            text: 'text',
            inactive: 'inactive',
            hidden: 'hidden',
            clone: 'clone',
            cloneNew: 'clone-new',
            cloneOld: 'clone-old',
            emptyContainer: 'full-width'
        },
        suffix: {
            remove: '_remove',
            link: '_link'
        },
        perl: {
            true: '1',
            false: '0'
        },
        typesFiles: {
            image: ['jpg', 'jpeg', 'png', 'gif'],
            video: ['mp4', 'avi'],
            text: ['txt', 'text', 'doc']
        },
        anyFiles: 'any'
    },
    _create: function () {
        var _widgetElement = this.element;
        var _options = this.options;
        var _this = this;
        var selector = _options.selector;
        var dataAttr = _options.dataAttr;
        var modifier = _options.modifier;
        var suffix = _options.suffix;
        var perl = _options.perl;

        var defaultAllowedTypes = 'jpg,jpeg';
        var defaultMaxAttachmentsCount = '3';
        var defaultLinkAllowed = '1';


        // Проверяем тип закинутого объекта
        _options.validateDroppedObject = function (dataTransfer) {
            if (dataTransfer.types[0] === 'Files') {
                return 'file';
            } else if ((dataTransfer.types[0] === 'text/plain')) {
                return 'url';
            } else {
                return false;
            }
        };

        // Проверяем формат закинутой ссылки
        _options.validateDroppedUrl = function (url) {
            function sendErrorNotification() {
                var input = _widgetElement.find(selector.urlInput);
                var last = _widgetElement.find(selector.addLinkContainer).children().last();
                var errorMessage = uCoz.sign.get('video_oembed_bad_link', 'Ссылка является неправильной');
                var descriptionError = $('<p>' + errorMessage + '</p>');

                descriptionError.addClass('u-form-error-description');
                last.is('p') || descriptionError.insertAfter(last);
                input.addClass('u-form-error');
            }

            function hideNotification() {
                var input = _widgetElement.find(selector.urlInput);
                var descriptionError = _widgetElement.find('.u-form-error-description');

                descriptionError.remove();
                input.removeClass('u-form-error');
            }

            var isValid;
            if (_options.allowedTypes === _options.anyFiles) {
                isValid = true;
                return isValid;
            }

            var name = url.substr(url.lastIndexOf('/'), url.length);
            isValid = Boolean(_options.validateNameByFormat(name));

            if (isValid) {
                hideNotification();
            } else {
                sendErrorNotification();
            }
            return isValid;
        };

        // Проверяем имя файла на правильность формата
        _options.validateNameByFormat = function (name) {
            if (_options.allowedTypes === _options.anyFiles) {
                return _options.anyFiles;
            }
            var regExpFormats = new RegExp('^.*\.(' + _options.allowedTypes.join('|') + ')$');
            var execFormats = regExpFormats.exec(name);
            var format = execFormats && execFormats.pop();
            format && _options.getTypeFile(format);
            return format ? format : false;
        };

        // Получить список поддерживаемых форматов в  виде массива строк верхнем и нежнем регистре
        _options.getUpDownCaseAllowedTypes = function (str) {
            //хак для текстовых файлов, проверяется в data64
            var formats = str.replace('txt', 'text,txt').replace(' ', '').split(',');
            var result = [];
            $.each(formats, function (key, value) {
                result.push(value.toUpperCase());
                result.push(value.toLowerCase());
            });
            return result;
        };

        // Проверяем формат закинутого файла
        _options.validateDroppedFiles = function (file, name) {
            var isValidName;
            if (_options.allowedTypes === _options.anyFiles) {
                isValidName = true;
                return isValidName;
            }

            isValidName = Boolean(_options.validateNameByFormat(name));

            if (isValidName) {
                var strFormatFile = file.substr(0, file.indexOf(';'));
                var isValidFile = _options.allowedTypes.some(function (e) {
                    return (strFormatFile.indexOf(e) > 0) && _options.getTypeFile(e);
                });
            }

            if (!isValidFile) {
                _options.createWrongElement();
            } else {
                _options.removeWrongElement();
            }

            return isValidFile;
        };

        // Получить тип файла
        _options.getTypeFile = function (format) {
            $.each(_options.typesFiles, function (keyP, valueP) {
                $.each(valueP, function (key, value) {
                    if (value == format) {
                        _options.currentTypeFile = keyP;
                    }
                });
            });
            return true;
        };

        // Создать визуализацию ошибки
        _options.createWrongElement = function(){
            _widgetElement.prepend('<div class="fu-wrong-element"><span></span><div></div><p>Недопустимый формат</p></div>');
            _widgetElement.find('.fu-add-button.full-width').removeClass('full-width');
        };
        // Удалить визуализацию ошибки
        _options.removeWrongElement = function(){
            _widgetElement.find(selector.list).find('li').not('.clone-new, .clone-old').length || _widgetElement.find('.fu-add-button').addClass('full-width');
            _widgetElement.find('.fu-wrong-element').remove();
        };

        _options.allowedTypes = _options.allowedTypes || _widgetElement.attr(dataAttr.allowedTypes) || defaultAllowedTypes;
        _options.allowedTypes = ((_options.allowedTypes === _options.anyFiles) && _options.allowedTypes) || _options.getUpDownCaseAllowedTypes(_options.allowedTypes);

        _options.maxAttachmentsCount = _options.maxAttachmentsCount || _widgetElement.attr(dataAttr.maxAttachmentsCount) || defaultMaxAttachmentsCount;
        _options.maxAttachmentsCount = Number(_options.maxAttachmentsCount);

        _options.linkAllowed = _options.linkAllowed || _widgetElement.attr(dataAttr.linkAllowed) || defaultLinkAllowed;
        _options.linkAllowed = Boolean(_widgetElement.attr(dataAttr.linkAllowed) == perl.true);

        _options.inputPrefix = _widgetElement.attr(dataAttr.inputPrefix);
        _options.currentTypeFile = false;

        _options.html5IsSupport = (!!window.FileReader && !!('draggable' in document.createElement('span')));


// Если лимит ужн достигнут то скрываем управляющие элементы
        if (_widgetElement.find(selector.image).length - 1 > Number(_options.maxAttachmentsCount)) {
            _widgetElement.find(selector.addButton).hide();
            _widgetElement.find(selector.addLink).hide();
        } else {
            _widgetElement.find(selector.addButton).show();
            _widgetElement.find(selector.addLink).show();
        }
        if (!_options.linkAllowed) {
            _widgetElement.find(selector.addLink).hide();
        }
        _widgetElement.find(selector.addLinkContainer).hide();

        _widgetElement.on('click', '.fu-wrong-element>span', function(){
            _options.removeWrongElement();
        });
// Перехватываем клик для "добавить файл", потому что инпут скрыт
        _widgetElement.find(selector.addButton).on('click', function () {
            _widgetElement.find('.' + modifier.cloneNew + ' ' + selector.addInput).trigger('click');
        });
// Нажал на кнопку добавить файл
        _widgetElement.find('.' + modifier.cloneNew + ' ' + selector.addInput).on('click', function (event) {
            !_options.html5IsSupport && _this.createNewBlock();
        });
// Нажал на кнопку удалить файл
        _widgetElement.find(selector.deleteButton).on('click', function (event) {
            var $element = $(event.target).closest('li');
            _widgetElement.find(selector.removeInput).each(function (index, element) {
                if (element == $element.find(selector.removeInput).get(0)) {
                    var removeInput = $(element).clone();
                    removeInput.attr('value', perl.true).attr('checked', 'checked').prop('checked', true);
                    _widgetElement.append(removeInput);
                    $(element).remove();
                }
            });
            $element.remove();
            // Элемент удалили, значит лимит файлов убран, возвращаем видимость "добавляющих" элементов
            if (!_options.linkAllowed) {
                _widgetElement.find(selector.addButton).show();
            } else {
                _widgetElement.find(selector.addButton).show();
                //$mainContainer.find(selector.addLinkContainer).show();
                _widgetElement.find(selector.addLink).show();
            }

            if (_widgetElement.find('li:not(.' + modifier.cloneNew + ', .' + modifier.cloneOld + ')').length === 0) {
                _widgetElement.find(selector.addButton).addClass(modifier.emptyContainer);
            }
        });
// Что-то загрузилось в инпут
        _options.html5IsSupport && _widgetElement.find(selector.addInput).change(function (event) {
            var input = this;
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                var file = input.files[0];
                reader.onload = function (e) {
                    _options.validateDroppedFiles(e.target.result, file.name) && _this.createNewBlock({
                        url: e.target.result
                        //,
                        //name: file.name
                    });
                };
                reader.readAsDataURL(input.files[0]);
            }
        });
// Нажал на кнопку добавить по ссылке
        _widgetElement.find(selector.urlButton).on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();

            var urlInput = _widgetElement.find(selector.urlInput);
            var url = urlInput.get(0).value;
            urlInput.val('');
            _options.validateDroppedUrl(url)
            && _widgetElement.find(selector.addLinkContainer).toggle()
            && _widgetElement.find(selector.addLink).toggle()
            && _this.createNewBlock({url: url, isLink: true});
        });
// Перетаскиваем dnd в контейнер
        _options.html5IsSupport && _widgetElement.on({
            drop: function (e) {
                e.stopPropagation();
                e.preventDefault();

                var dataTransfer = e.originalEvent.dataTransfer;
                var typeDroppedObj = _options.validateDroppedObject(dataTransfer);

                if (typeDroppedObj === 'file') {
                    var file = dataTransfer.files[0];
                    var reader = new FileReader();

                    reader.onload = function (e) {
                        _options.validateDroppedFiles(e.target.result, file.name) && _this.createNewBlock({
                            url: e.target.result,
                            name: file.name
                        });
                    };
                    reader.readAsDataURL(file);
                } else if (typeDroppedObj === 'url') {
                    var url = dataTransfer.getData('URL');

                    _options.validateDroppedUrl(url) && _this.createNewBlock({url: url});
                }
                return false;
            }
        });
// Обрабатываем результат перед отправкой формы
        _widgetElement.closest('form').submit(function () {
            _widgetElement.find(selector.list + ' ' + selector.cloneNew).remove();
            return true;
        });
// Нажал на кнопку вызова формы для добавить по ссылке
        _widgetElement.find(selector.addLink).on('click', function (event) {
            _widgetElement.find(selector.addLinkContainer).toggle();
            _widgetElement.find(selector.addLink).toggle();
        });

    },
    createNewBlock: function (obj) {
        var _widgetElement = this.element;
        var _options = this.options;
        var selector = _options.selector;
        var modifier = _options.modifier;
        var suffix = _options.suffix;

        var urlImage = obj.url,
            name = obj.name,
            isLink = obj.isLink,
            preview = obj.preview;
        // Модифицируем суфикс инпута
        function incrementSuffix(name) {
            var emptySlot = 'empty';
            var inputs = _widgetElement.find('li:not(.' + modifier.cloneNew + ', .' + modifier.cloneOld + ')').find('input');
            var arrIndexes = [];
            inputs.each(function (i, e) {
                arrIndexes.push(parseInt(/\d/.exec($(e).attr('name')), 10));
            });
            arrIndexes.sort(function (a, b) {
                return a > b
            });

            arrIndexes.some(function (e, i) {
                if (e !== i) {
                    emptySlot = i;
                    return true;
                }
            });
            if (inputs.length > 0 && emptySlot === 'empty') {
                emptySlot = inputs.length;
            } else if (emptySlot === 'empty') {
                emptySlot = 0;
            }

            var linkSuffixPresent = name.indexOf(suffix.link) > 0;
            var result = '';
            if (linkSuffixPresent) {
                result = _options.inputPrefix + emptySlot + suffix.link;
            } else {
                result = _options.inputPrefix + emptySlot;
            }
            return result;
        }

        if (_widgetElement.find(selector.image).length - 1 <= Number(_options.maxAttachmentsCount)) {
            var $origin = _widgetElement.find(selector.list + ' li.' + modifier.cloneNew);
            var $clone = $origin.clone(true);
            var $inputClone = $origin.find(selector.addInput);
            var $inputLinkClone = $origin.find(selector.linkInput);
            $inputClone.attr('name', incrementSuffix($inputClone.attr('name')));
            $inputLinkClone.attr('name', incrementSuffix($inputLinkClone.attr('name')));
            //$inputLinkClone.attr('value', urlImage);
            _widgetElement.find(selector.list).prepend($clone);
            $origin.removeClass(modifier.cloneNew);

            if (isLink) {
                $origin.find(selector.addInput).remove();
                $origin.find(selector.linkInput).attr('value', urlImage);
                preview && $origin.find('div.fu-image').replaceWith($('<img/>').attr('src', urlImage).addClass('fu-image'));
            } else {
                $origin.find(selector.linkInput).remove();
            }
            $clone.find(selector.linkInput).removeAttr('value');

            switch (_options.currentTypeFile) {
                case 'image':
                    urlImage && $origin.find(selector.image).css('background-image', 'url(' + urlImage + ')');
                    break;
                case 'video':
                    $origin.find(selector.image).addClass(modifier.video);
                    break;
                case 'text':
                    $origin.find(selector.image).addClass(modifier.text);
                    break;
            }

            name && $origin.find(selector.image).text(name);
        }

        // Если превышен лимит файлов скрываем "добавляющие" элементы
        if (_widgetElement.find(selector.image).length - 1 > Number(_options.maxAttachmentsCount)) {
            _widgetElement.find(selector.addButton).hide();
            _widgetElement.find(selector.addLinkContainer).hide();
            _widgetElement.find(selector.addLink).hide();
        }
        _widgetElement.find(selector.addButton).removeClass(modifier.emptyContainer);
    },
    set: function (obj) {
        var _widgetElement = this.element;
        var _options = this.options;
        var _this = this;
        var selector = _options.selector;
        var modifier = _options.modifier;
        var suffix = _options.suffix;

        var url = obj.url,
            name = obj.name,
            index = obj.index,
            remote = obj.remote;

        if (remote) {
            return _this.createNewBlock({url: url, isLink: true, preview: true});
        }

        // Модифицируем суфикс инпута
        function setSuffix(index) {
            return _options.inputPrefix + index + suffix.remove;
        }

        if (_widgetElement.find(selector.image).length - 1 <= Number(_options.maxAttachmentsCount)) {
            var $origin = _widgetElement.find(selector.list + ' li.' + modifier.cloneOld);
            var $clone = $origin.clone(true);
            var $image = $clone.find(selector.image);
            var $removeInput = $clone.find(selector.removeInput);
            $image.attr('src', url);
            $removeInput.attr('name', setSuffix(index));
            _widgetElement.find(selector.list).prepend($clone);
            $clone.removeClass(modifier.cloneOld);
            name && $origin.find(selector.image).text(name);
        }

        // Если превышен лимит файлов скрываем "добавляющие" элементы
        if (_widgetElement.find(selector.image).length - 1 > Number(_options.maxAttachmentsCount)) {
            _widgetElement.find(selector.addButton).hide();
            _widgetElement.find(selector.addLinkContainer).hide();
            _widgetElement.find(selector.addLink).hide();
        }
        _widgetElement.find(selector.addButton).removeClass(modifier.emptyContainer);
    },
    clear: function () {
        var _options = this.options;
        var _widgetElement = this.element;
        var selector = _options.selector;
        var modifier = _options.modifier;

        _widgetElement.find('li:not(.' + modifier.cloneNew + ', .' + modifier.cloneOld + ')').remove();
        _widgetElement.find('>input' + selector.removeInput).remove();
    }
});