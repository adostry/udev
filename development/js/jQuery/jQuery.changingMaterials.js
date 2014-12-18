jQuery.widget("custom.changingMaterials", {
    options: {
        removeRequested: new Function('ids', ''),
        editRequested: new Function('ids', ''),
        addRequested: new Function('')
    },
    _create: function () {
        var _this = this;
        var _widgetElement = this.element;

        var dataAttr = {
            name: 'id'
        };

        var selector = {
            table: '.cm-table',
            deleteButton: '.cm-delete-button',
            addButton: '.cm-add-button',
            editButton: '.cm-edit-button',
            ckeckbox: '.cm-marker',
            materialContainer: '.cm-material-container',
            checkAll: '.cm-check-all'
        };

        // Обработка выбора чекбокса для опредления активности неактивности кнопок
        _widgetElement.on('change', selector.table, function (event) {
            var count = 0;

            _widgetElement.find(selector.table + ' ' + selector.materialContainer).each(function (index, element) {
                if ($(element).find(selector.ckeckbox).prop('checked')) {
                    ++count;
                }
            });

            if (count === 0) {
                _widgetElement.find([selector.editButton, selector.deleteButton].join(', ')).prop('disabled', true);
            } else if (count === 1) {
                _widgetElement.find([selector.editButton, selector.deleteButton].join(', ')).prop('disabled', false);
            } else if (count > 1) {
                _widgetElement.find(selector.deleteButton).prop('disabled', false);
                _widgetElement.find(selector.editButton).prop('disabled', true);
            }
        });

        // Выделить если кликнуто на области материала
        _widgetElement.on('click', selector.materialContainer + ' td:first-child, ' + selector.materialContainer + ' td:last-child', function (event) {
            var $element = $(event.target);
            if ($element.closest('.u-form_check').length === 0) {
                var checkbox = $element.closest(selector.materialContainer).find(selector.ckeckbox);
                if (checkbox.prop('checked')) {
                    checkbox.prop('checked', false).trigger('change');
                } else {
                    checkbox.prop('checked', true).trigger('change');
                }
            }
        });

        // Удалить выделенные материала
        _widgetElement.on('click', selector.deleteButton, function () {
            var arrayRequest = [];

            _widgetElement.find(selector.table + ' ' + selector.materialContainer).each(function (index, element) {
                if ($(element).find(selector.ckeckbox).prop('checked')) {
                    arrayRequest.push(Number($(element).data('id')));
                }
            });
            if (arrayRequest.length > 0) {
                _this._trigger('remove', event, {ids: arrayRequest});
            }
        });

        // Редактировать выделенный материал
        _widgetElement.on('click', selector.editButton, function () {
            var arrayRequest = [];

            _widgetElement.find(selector.table + ' ' + selector.materialContainer).each(function (index, element) {
                if ($(element).find(selector.ckeckbox).prop('checked')) {
                    arrayRequest.push(Number($(element).data(dataAttr.name)));
                }
            });
            if (arrayRequest.length === 1) {
                _this._trigger('edit', event, {id: arrayRequest[0]});
            }
        });

        // Добавить материал
        _widgetElement.on('click', selector.addButton, function () {
            _this._trigger('add', event, {});
        });

        // Выделить(снять все выделения) всех материалов на странице
        _widgetElement.find(selector.checkAll).change(function (event) {
            var checkAllMarker = $('input' + selector.checkAll, _widgetElement);

            if (checkAllMarker.attr('checked')) {
                _widgetElement.find(selector.table + ' ' + selector.materialContainer).each(function (index, element) {
                    $(element).find(selector.ckeckbox).prop('checked', false).trigger('change');
                    $(element).closest('tr').removeClass('checked');
                });

                checkAllMarker.attr('checked', false);
            } else {
                _widgetElement.find(selector.table + ' ' + selector.materialContainer).each(function (index, element) {
                    $(element).find(selector.ckeckbox).prop('checked', true).trigger('change');
                    $(element).closest('tr').addClass('checked');
                });

                checkAllMarker.attr('checked', true);
                //todo: костыль, прямое обращение к дому
                _widgetElement.find('.main-el_check:gt(0)').addClass('checked');
            }
        });

        // Выделить(снять выделение)конкретного материала
        _widgetElement.find(selector.ckeckbox).change(function (event) {
            var $element = $(event.target);
            var container = $element.parent(selector.materialContainer);
            var checkAllMarker = $('input' + selector.checkAll, _widgetElement);

            if ($element.prop('checked')) {
                container.addClass('checked');
                $element.closest('tr').addClass('checked');
            } else {
                container.removeClass('checked');
                $element.closest('tr').removeClass('checked');
            }
            checkAllMarker.attr('checked', false);
        });
    }
});
