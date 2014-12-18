jQuery.fn.moduleFilters = function (options) {
    //options = options || {};
    //console.log(options);

    var $mainContainer = $(this.selector);

    var selector = {
        draggableElement: '.mf-draggable-element',
        removeFilter: '.mf-remove-filter',
        restoreFilter: '.mf-restore-filter',
        restoreValue: '.mf-restore-value',
        removeValue: '.mf-remove-value',
        addFilter: '.mf-add-filter',
        addValue: '.mf-add-value',
        listFilters: '.mf-list-filters',
        listValues: '.mf-list-values',
        sortableList: '.mf-list-values',
        filter: '.mf-filter',
        value: '.mf-value',
        inputOrderValue: '.mf-value-order',
        inputNameValue: '.mf-value-name',
        filterInputNameValue: '.mf-filter-name'
    };

    var modifier = {
        inactive: 'inactive',
        clone: 'clone'
    };

    var dataAttr = {
        filterId: 'data-filter-id',
        filterActive: 'data-filter-active',
        maxValueId: 'data-max-value-id'
    };

    var pTrue = '1';
    var pFalse = '0';


    // Нажал на крестик "удалить" у фильтра
    $mainContainer.find(selector.removeFilter).bind('click', function (event) {
        var idRemovedFilter = $(event.target).parents(selector.filter).eq(0).attr(dataAttr.filterId);
        var $filter = $mainContainer.find('div[' + dataAttr.filterId + '="' + idRemovedFilter + '"]');
        var $name = $filter.find(selector.filterInputNameValue);
        var $restoreLink = $mainContainer.find('p[' + dataAttr.filterId + '="' + idRemovedFilter + '"]');
        $filter.attr(dataAttr.filterActive, pFalse);
        $name.data('prev-value', $name.val()).val('');
        $filter.addClass(modifier.inactive);
        $restoreLink.removeClass(modifier.inactive);

        var showRestoreLink = false;
        showRestoreLink = $name.data('prev-value') != '';
        $filter.find("li:not(." + modifier.clone + ") " +selector.inputNameValue).each(function (index, input) {
            var $input = $(input);
            if (!showRestoreLink) {
                $input.data('prev-value', '');
                $input.val('');
                $input.closest('li').remove();
            }

        });
        if (!showRestoreLink) {
            $restoreLink.addClass(modifier.inactive);
        }
        refreshAddFilter();
    });

    // Нажал на "вернуть" у фильтра
    $mainContainer.find(selector.restoreFilter).bind('click', function (event) {
        var idRestoredFilter = $(event.target).attr(dataAttr.filterId);
        var $filter = $mainContainer.find('div[' + dataAttr.filterId + '="' + idRestoredFilter + '"]');
        var $name = $filter.find(selector.filterInputNameValue);
        var $restoreLink = $(event.target);
        $name.val($name.data('prev-value') || '');
        $filter.attr(dataAttr.filterActive, pTrue);
        $filter.removeClass(modifier.inactive);
    });

    // Нажал на крестик "удаление" у значения фильтра
    $mainContainer.find(selector.removeValue).bind('click', function (event) {
        var $filter = $(event.target).closest(selector.value);
        var $name = $filter.find(selector.inputNameValue);
        var $restoreLink = $filter.next();

        $name.data('prev-value', $name.val()).val('');
        $filter.addClass(modifier.inactive);
        $name.data('prev-value') || $restoreLink.addClass(modifier.inactive);
        $name.data('prev-value') && $restoreLink.removeClass(modifier.inactive);
    });

    // Нажал на "вернуть" у значения фильтра
    $mainContainer.find(selector.restoreValue).bind('click', function (event) {
        var $filter = $(event.target).closest('li').find('.' + modifier.inactive);
        var $name = $filter.find(selector.inputNameValue);
        var $restoreLink = $(event.target);

        $name.val($name.data('prev-value') || '');
        $restoreLink.addClass(modifier.inactive);
        $filter.removeClass(modifier.inactive);
    });

    // Нажал на "добавить" значение
    $mainContainer.find(selector.addValue).bind('click', function (event) {
        var $element = $(event.target);
        var $clone = $element.parent().find(selector.listValues + ' .' + modifier.clone).clone(true);
        var idValue = $element.closest('[' + dataAttr.maxValueId + ']').attr(dataAttr.maxValueId);
        $element.closest('[' + dataAttr.maxValueId + ']').attr(dataAttr.maxValueId, ++idValue);
        var orderInputs = $element.parent().find('input[name*="_order"]');
        var oldAttrName = $clone.find('input[name*="_name"]').attr('name');
        var oldAttrOrder = $clone.find('input[name*="_order"]').attr('name');
        var maxOrder = 0;
        orderInputs.each(function (index, element) {
            var value = $(element).attr('value');
            maxOrder = (Number(value) > Number(maxOrder)) ? value : maxOrder;
        });
        $clone.find('input[name*="_order"]').attr('value', ++maxOrder);
        $clone.find('input[name*="_order"]').attr('name', oldAttrOrder.replace('{VALUE_ID}', idValue)).removeAttr('disabled');
        $clone.find('input[name*="_name"]').attr('name', oldAttrName.replace('{VALUE_ID}', idValue)).removeAttr('disabled');
        // ~ $element.parent().find(selector.listValues + ' li:not(.' + modifier.clone + '):last').after($clone);
        $element.parent().find(selector.listValues + ' li:last').after($clone);
        $clone.removeClass(modifier.clone);
    });

    // Нажал на "добавить" фильтр
    $mainContainer.find(selector.addFilter).bind('click', function (event) {
        var inactiveFilters = $mainContainer.find(selector.filter + '.' + modifier.inactive + '[' + dataAttr.filterActive + '="' + pFalse + '"]');
        var inactiveFilter = inactiveFilters[0];
        if (inactiveFilter) {
            var $inactiveFilter = $(inactiveFilter);
            $inactiveFilter.attr(dataAttr.filterActive, pTrue);
            $inactiveFilter.removeClass(modifier.inactive);
            if (inactiveFilters.length == 1) {
                $(event.target).addClass(modifier.inactive);
            }
        }
    });

    // Перетащили одно из значений фильтра
    function updatePositionFilterValue(event, ui) {
        var $item = $(ui.item);
        var $setOrderInputs = $item.closest(selector.listValues).find('li');
        var arrayOrders = [];
        $setOrderInputs.each(function (index, element) {
            arrayOrders.push($(element).find('input[name*="_order"]').attr('value'));
        });
        arrayOrders.sort();
        $setOrderInputs.each(function (index, element) {
            $(element).find('input[name*="_order"]').attr('value', arrayOrders.shift());
        });
    }


    $(selector.sortableList, $mainContainer).sortable({
        opacity: 0.55,
        containment: $(selector.listValues, $mainContainer),
        handle: selector.draggableElement,
        update: updatePositionFilterValue
    });

    function refreshAddFilter() {
        if ($mainContainer.find(selector.filter + '.' + modifier.inactive + '[' + dataAttr.filterActive + '="' + pFalse + '"]').length) {
            $(selector.addFilter, $mainContainer).removeClass(modifier.inactive);
        } else {
            $(selector.addFilter, $mainContainer).addClass(modifier.inactive);
        }
    }

    refreshAddFilter();

    return {
        save: function () {
            $mainContainer.find(selector.filter + "." + modifier.inactive + " + p:not(." + modifier.inactive + ")").addClass(modifier.inactive);
            $mainContainer.find(selector.filter + '.' + modifier.inactive).attr(dataAttr.filterActive, pFalse);
            $mainContainer.find(selector.filter + '.' + modifier.inactive + ' ' + selector.value).parent('li:not(.' + modifier.clone + ')').remove();
            $mainContainer.find(selector.value + '.' + modifier.inactive).parent().remove();
            refreshAddFilter();
        }
    }

};
