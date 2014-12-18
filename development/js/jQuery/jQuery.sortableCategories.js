// SortableCategories 
// мои файлики(все остальное брал у тебя): 
// image/drag_icon.png
// style/readme.txt
// index.html
// vendor/css/sortable_categories.less
// vendor/css/style_with_sortable_categories.less
//
// подключается $('#pl1').sortableCategories(options);
// структура:
// контейнер(#pl1)
// ----.sc-add-button // кнопка добавления категории
// ----.sc-edit-button // кнопка редактирования
// ----.sc-delete-button // кнопка удаления
// ----.sc-table // собственно сама таблица в которой находятся категории
// --------.sc-check-all.sc-marker // чекбокс выбрать все/снять выделения со всех
// --------.sc-category-container // контейнер для одной категории
// ------------.sc-marker // чекбокс напротив каждой категории
// options = {
// tableSelector: '.sc-table',
// classDeleteButton: '.sc-delete-button',
// classAddButton: '.sc-add-button',
// classEditButton: '.sc-edit-button',
// classMarker: '.sc-marker',
// classCategoryContainer: '.sc-category-container',
// removeRequested: function (ids) {
//    удаление, тебе нужно это переопределить
// },
// reorderRequested: function (ids) {
//    сменапозиции, тебе нужно это переопределить
// },
// editRequested: function (ids) {
//    редактирование, тебе нужно это переопределить
// },
// addRequested: function (ids) {
//    добавление, тебе нужно это переопределить
// },
// parentChangeRequested: function (ids) {
//    смена родителя, тебе нужно это переопределить
// },
// checkAllCategories: function (mainContainer) {
//    выбраны все категории, думаю это понадобится одувашке когда будет верстать
// },
// uncheckAllCategories: function (mainContainer) {
//    снято выделение со всех категорий, думаю это понадобится одувашке когда будет верстать
// }
// }
// "Done"-события выполнения твоих функций вызываются так(пока что они пусты) 
// var pl1 = $('#pl1').sortableCategories(options)
// pl1.removeDone()
// pl1.reorderDone()
// pl1.editDone()
// pl1.addDone()
// pl1.parentChangeDone()

jQuery.fn.sortableCategories = function (options) {
    var mainContainer = $(this.selector);
    // Переменные которые можно конфигурировать
    var options = options || {};

    var nameOrder = options.nameOrder || 'order';
    var nameCategory = options.nameCategory || 'category';

    var nameDataAttrId = options.nameDataAttrId || 'id';
    var nameDataAttrParentId = options.nameDataAttrParentId || 'parent-id';

    var classTable = options.classTable || '.sc-table';
    var classDeleteButton = options.classDeleteButton || '.sc-delete-button';
    var classAddButton = options.classAddButton || '.sc-add-button';
    var classEditButton = options.classEditButton || '.sc-edit-button';
    var classMarker = options.classMarker || '.sc-marker';
    var classCategoryContainer = options.classCategoryContainer || '.sc-category-container';
    var classCheckAll = options.classCheckAll || '.sc-check-all';
    var classActiveEditButton = options.classActiveEditButton || 'sc-active-edit-button';
    var classActiveDeleteButton = options.classActiveDeleteButton || 'sc-active-delete-button';

    var removeRequested = options.removeRequested || function (ids) {
            console.log('removeRequested', ids);
        };
    var reorderRequested = options.reorderRequested || function (ids) {
            console.log('reorderRequested', ids);
        };
    var editRequested = options.editRequested || function (ids) {
            console.log('editRequested', ids);
        };
    var addRequested = options.addRequested || function () {
            console.log('addRequested');
        };
    var parentChangeRequested = options.parentChangeRequested || function (ids) {
            console.log('parentChangeRequested', ids);
        };
    var checkAllCategories = options.checkAllCategories || function (mainContainer) {
            console.log('checkAllCategories', mainContainer);
            // ~ mainContainer.find('.main-el_check:gt(0)').addClass('checked');
        };
    var uncheckAllCategories = options.uncheckAllCategories || function (mainContainer) {
            console.log('uncheckAllCategories', mainContainer);
            // ~ mainContainer.find('.main-el_check:gt(0)').removeClass('checked');
        };

    // Обработчик смены отца
    var oldParent;

    function stopChangeParent(event, ui) {
        var item = $(ui.item);
        var newParent = item.closest('[data-' + nameDataAttrParentId + ']').data(nameDataAttrParentId);

        if (newParent != oldParent) {
            parentChangeRequested([item.data(nameDataAttrId), newParent]);
        }
    }

    function startChangeParent(event, ui) {
        ui.placeholder.html("<td colspan='6'></td>")
        oldParent = $(ui.item).closest('[data-' + nameDataAttrParentId + ']').data(nameDataAttrParentId);
    }

    // Обработка выбора чекбокса для опредления активности неактивности кнопок
    mainContainer.find(classTable).bind('click', function () {
        var count = 0;

        mainContainer.find(classTable + ' ' + classCategoryContainer).each(function (index, element) {
            if ($(element).find(classMarker).attr('checked')) {
                ++count;
            }
        })
        if (count === 0) {
            mainContainer.find(classEditButton).removeClass(classActiveEditButton);
            mainContainer.find(classDeleteButton).removeClass(classActiveDeleteButton);
        } else if (count === 1) {
            mainContainer.find(classEditButton).addClass(classActiveEditButton);
            mainContainer.find(classDeleteButton).addClass(classActiveDeleteButton);
        } else if (count > 1) {
            mainContainer.find(classDeleteButton).addClass(classActiveDeleteButton);
            mainContainer.find(classEditButton).removeClass(classActiveEditButton);
        }
    });

    // Пересчитать значения позиций для активных элементов
    function calculatePositions() {
        function getMinPosition() {
            var minValue = 0;

            mainContainer.find(classTable + ' ' + classCategoryContainer).each(function (index, element) {
                var currentValue = Number($(element).find('input[type=hidden][name*="_' + nameOrder + '"]').attr('value'));

                minValue = minValue || currentValue;
                if (currentValue < minValue) {
                    minValue = currentValue;
                }
            })
            return minValue;
        }

        var i = getMinPosition();
        var arrIds = [];

        mainContainer.find(classTable + ' ' + classCategoryContainer).each(function (index, element) {
            $(element).find('input[type=hidden][name*="_' + nameOrder + '"]').attr('value', i++);
            arrIds.push($(element).data(nameDataAttrId));
        })
        reorderRequested(arrIds);
    }

    // Удалить выделенные категории
    mainContainer.find(classDeleteButton).bind('click', function () {
        var arrayRequest = [];

        mainContainer.find(classTable + ' ' + classCategoryContainer).each(function (index, element) {
            if ($(element).find(classMarker).prop('checked')) {
                arrayRequest.push(Number($(element).data('id')));
                //TODO delete
            }
        })
        if (arrayRequest.length > 0) {
            removeRequested(arrayRequest);
        }
    });

    // Редактировать выделенную категорию
    mainContainer.find(classEditButton).bind('click', function () {
        var arrayRequest = [];

        mainContainer.find(classTable + ' ' + classCategoryContainer).each(function (index, element) {
            if ($(element).find(classMarker).prop('checked')) {
                arrayRequest.push(Number($(element).data(nameDataAttrId)));
            }
        })
        if (arrayRequest.length === 1) {
            editRequested(arrayRequest[0]);
        }
    });

    // Выделить(снять все выделения) категории
    mainContainer.find(classCheckAll).change(function (event) {
        var chackAllMarker = $(this); // $('input' + classCheckAll, mainContainer);

        if (!chackAllMarker.prop('checked')) {
            mainContainer.find(classTable + ' ' + classCategoryContainer).each(function (index, element) {
                $(element).find(classMarker).prop('checked', false).removeAttr('checked').trigger('change');
            });

            // ~ chackAllMarker.attr('checked', false);
            uncheckAllCategories(mainContainer);
        } else {
            mainContainer.find(classTable + ' ' + classCategoryContainer).each(function (index, element) {
                $(element).find(classMarker).prop('checked', true).trigger('change');
            });

            // ~ chackAllMarker.attr('checked', true);
            checkAllCategories(mainContainer);
        }
    });

    // Добавить категорию
    mainContainer.find(classAddButton).bind('click', function () {
        addRequested();
    });
    // Запуск
    mainContainer.find(classTable + ' tbody').sortable({
        update: calculatePositions,
        handle: '.sc-draggable',
        stop: stopChangeParent,
        start: startChangeParent,
        containment: "parent",
        tolerance: "pointer",
        cursor: 'move',
        revert: 100,
        delay: 100,
        placeholder: 'sc-placeholder',
        opacity: 0.8,
        scroll: true,
        dropOnEmpty: false,
        zIndex: 99999,
        helper: function (e, ui) {
            ui.children().each(function () {
                $(this).width($(this).width());
            });
            return ui;
        }

    }).disableSelection();

    mainContainer.find(classMarker).change(function (event) {
        var elem = $(this);
        if (elem.hasClass(classCheckAll)) {
            return;
        }
        if (elem.prop('checked')) {
            elem.parents(classCategoryContainer).eq(0).addClass('checked');
        } else {
            elem.parents(classCategoryContainer).eq(0).removeClass('checked');
        }
    });

    return {
        removeDone: function () {
            console.log('removeDone');
        },
        reorderDone: function () {
            console.log('reorderDone');
        },
        editDone: function () {
            console.log('editDone');
        },
        addDone: function () {
            console.log('addDone');
        },
        parentChangeDone: function () {
            console.log('parentChangeDone');
        }
    }
};
