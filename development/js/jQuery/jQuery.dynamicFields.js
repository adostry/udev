jQuery.widget('custom.dynamicFields', {
    options: {
        draggable: true
    },
    cloud: {
        selector: {
            activeFields: '.df-active-fields',
            deactiveFields: '.df-deactive-fields',
            placeholder: '.df-placeholder',
            activeField: '.df-active-field',
            deactiveField: '.df-deactive-field',
            container: '.df-container',
            edit: '.df-edit',
            done: '.df-done',
            name: '.df-name',
            deactivate: '.u-item_del',
            notNull: '.df-not-null',
            separator: '.df-separator',
            add: '.df-add',
            noneDraggable: '.df-none-draggable',
            showWhenEdit: '.df-show-when-edit',
            back: '.u-item_restore',
            backContainer: '.df-back-container',
            noDelete: '.no-delete',
            hiddenSeparator: '.df-hidden-separator',
            hiddenField: '.df-hidden-field'
        },
        dataAttr: {
            separator: 'separator',
            noDeactivate: 'nodeactivate',
            noRename: 'norename',
            value: 'value',
            id: 'id'
        },
        name: {
            field: 'field',
            name: 'name',
            notNull: 'not_null',
            active: 'active',
            order: 'order',
            separator: 'separator'
        },
        modifier: {
            clone: 'clone'
        }
    },
    _create: function () {
        var _widgetElement = this.element;
        var _options = this.options;
        var _cloud = this.cloud;

        _cloud.isDraggable = Boolean(!(!_options.draggable || _widgetElement.attr('data-draggable') === '0' || _widgetElement.attr('data-sortable') === '0'));

        // Селекторы для активной и неактивной менюшки
        var selector = _cloud.selector;
        var dataAttr = _cloud.dataAttr;
        var name = _cloud.name;
        var modifier = _cloud.modifier;

        // Получить главный элемент активного поля (li-по умолчанию) из ребенка
        function getParentActiveField(element) {
            return $($(element).closest(selector.activeField));
        }

        // Получить главный элемент неактивного поля (li-по умолчанию) из ребенка
        function getParentDeactiveField(element) {
            return $($(element).closest(selector.deactiveField));
        }

        // Пересчитать значения позиций для активных элементов
        function updateOrder() {
            var i = 0;
            var lastActive;
            var lastSeparator;
            var lastNotActive;
            var lastNotActiveSeparator;
            var $fields = _widgetElement.find(selector.activeField);
            $fields.each(function (index, element) {
                var $element = $(element);
                var isActive = $element.find('input[type=hidden][name*="_' + name.active + '"]').attr('value') === '1';
                var isNotActive = $element.find('input[type=hidden][name*="_' + name.active + '"]').attr('value') === '0';
                var isSeparator = $element.attr('data-' + dataAttr.id) === 's' && !$element.is(selector.hiddenSeparator);
                var isNotActiveSeparator = $element.attr('data-' + dataAttr.id) === 's' && $element.is(selector.hiddenSeparator);

                if (isActive) {
                    $element.find('input[type=hidden][name*="_' + name.order + '"]').val(i++);
                    $element.find('input[type=hidden][name*="_' + name.order + '"]').attr('value', i);
                    $element.find('input[type=hidden][name*="_' + name.separator + '"]').val('0');
                    $element.find('input[type=hidden][name*="_' + name.separator + '"]').attr('value', '0');
                    lastActive = $element;
                    lastSeparator = false;
                }
                if (isNotActive) {
                    $element.find('input[type=hidden][name*="_' + name.order + '"]').val(i++);
                    $element.find('input[type=hidden][name*="_' + name.order + '"]').attr('value', i);
                    $element.find('input[type=hidden][name*="_' + name.separator + '"]').val('0');
                    $element.find('input[type=hidden][name*="_' + name.separator + '"]').attr('value', '0');
                    lastNotActive = $element;
                    lastNotActiveSeparator = false;
                }
                if (isSeparator) {
                    if (index === 0) {
                        $element.remove();
                        return;
                    }
                    if (lastSeparator) {
                        $element.remove();
                    } else {
                        lastActive && lastActive.find('input[type=hidden][name*="_' + name.separator + '"]').val('1');
                        lastActive && lastActive.find('input[type=hidden][name*="_' + name.separator + '"]').attr('value', '1');
                        lastActive && $element.insertAfter(lastActive);
                        lastSeparator = true;
                    }
                }
                if (isNotActiveSeparator) {
                    if (index === 0) {
                        $element.remove();
                        return;
                    }
                    if (lastNotActiveSeparator) {
                        $element.remove();
                    } else {
                        lastNotActive && lastNotActive.find('input[type=hidden][name*="_' + name.separator + '"]').val('1');
                        lastNotActive && lastNotActive.find('input[type=hidden][name*="_' + name.separator + '"]').attr('value', '1');
                        lastNotActive && $element.insertAfter(lastNotActive);
                        lastNotActiveSeparator = true;
                    }
                }
            });


        }

        // Активировать сепаратор
        function activateSeparator() {
            var $prototypeSeparator = _widgetElement.find(selector.separator + '.' + modifier.clone);
            var $cloneSeparator = $prototypeSeparator.clone(true);
            $cloneSeparator.removeClass(modifier.clone);
            $cloneSeparator.attr('data-' + dataAttr.id, 's');
            $cloneSeparator.show();
            _widgetElement.find(selector.activeFields).append($cloneSeparator);
        }

        // Активировать неактивное поле
        function activateField(parentField) {
            var idField = $(parentField).data(dataAttr.id);
            var selectorActiveFieldId =
                selector.activeFields + ' ' + selector.activeField +
                '[data-' + dataAttr.id + '*="' + idField + '"]';
            if (idField == 's') {
                activateSeparator();
            } else {
                _widgetElement.find(selectorActiveFieldId + ' input[type=hidden][name*="_' + name.active + '"]').val(1);
                _widgetElement.find(selectorActiveFieldId).show();
                _widgetElement.find(selectorActiveFieldId).find(selector.container).show();
                _widgetElement.find(selectorActiveFieldId).find(selector.backContainer).hide();
                $(parentField).hide();
            }
            updateOrder();
        }

        // Обработчик нажатия на кнопку Деактивировать
        _widgetElement.on('click', [selector.activeFields, selector.activeField, selector.deactivate].join(' '), function (event) {
            var buttonDeactivate = $(event.target);
            var $parentField = getParentActiveField(buttonDeactivate);
            if ($parentField.is(selector.noDelete)) {
                return;
            }
            var idField = $($parentField).data(dataAttr.id);
            var selectorDeactiveFieldId =
                selector.deactiveFields + ' ' + selector.deactiveField +
                '[data-' + dataAttr.id + '*="' + idField + '"]';
            if (idField == 's') {
                $parentField.remove();
                updateOrder();
            } else {
                $parentField.find('input[type=hidden][name*="_' + name.active + '"]').val(0);
                $parentField.find(selector.container).hide();
                $parentField.find(selector.back).show();
                _widgetElement.find(selectorDeactiveFieldId).show();
                updateOrder();
            }
        });

        // Оработчик нажатия кнопки вернуть
        _widgetElement.on('click', [selector.activeFields, selector.activeField, selector.back].join(' '), function (event) {
            var buttonBack = $(event.target);
            var $parentField = getParentActiveField(buttonBack);
            var idField = $($parentField).data(dataAttr.id);
            var selectorDeactiveFieldId =
                selector.deactiveFields + ' ' + selector.deactiveField +
                '[data-' + dataAttr.id + '*="' + idField + '"]';
            $parentField.find('input[type=hidden][name*="_' + name.active + '"]').val(1);
            $parentField.find(selector.container).show();
            $parentField.find(selector.back).hide();
            $(selectorDeactiveFieldId).hide();
            updateOrder();

        });

        // Нажал на поле в списке неактивных
        _widgetElement.on('click', selector.deactiveFields + ' ' + selector.deactiveField, function (event) {
            var $parentField = getParentDeactiveField(event.target);
            activateField($parentField);
            $(this).parents('.u-popup_window').eq(0).hide();
        });

        // Отметил чекбокс "не равно пустое"
        _widgetElement.on('change', selector.activeFields + ' .df-not-null', function () {
            var checkbox = $(this);
            var checked = checkbox.prop('checked');
            var name = getParentActiveField(this).find('.df-name');
            if (checked) {
                name.addClass('required');
            } else {
                name.removeClass('required');
            }
        });

        if (_cloud.isDraggable) {
            _widgetElement.find(selector.activeFields, this).sortable({
                opacity: 0.55,
                containment: 'parent',
                handle: '.df-draggable',
                //helper: 'clone',
                update: updateOrder,
                cancel: selector.noneDraggable,
                tolerance: "pointer",
                cursor: 'move',
                revert: 100,
                delay: 100,
                placeholder: 'df-placeholder',
                scroll: true,
                dropOnEmpty: false
            }).disableSelection();
        }
        updateOrder();
    }
});