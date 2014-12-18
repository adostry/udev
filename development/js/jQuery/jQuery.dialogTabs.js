jQuery.fn.dialogTabs = function (options) {
    options = options || {};
    var tabOptions = options.tabOptions;
    var dialogOptions = options.dialogOptions;
    var optionPosition = {
        my: "right top",
        at: "right top+53",
        of: ".u-content",
        "collision": "fit fit"
    };
    var defaultDialogOptions = {
        modal: true,
        width: 450,
        height: 'auto',
        draggable: false,
        resizable: false,
        position: optionPosition
    };

    var $dialog = $(this.selector);
    var selector = {
        tabs: options.tabSelector || '#tabs',
        anchorLinkInTabs: '>ul>li>a[href]'
    };

    $dialog.dialog($.extend(defaultDialogOptions, dialogOptions));
    var $tabs = $(selector.tabs).tabs(tabOptions);

    // Смещение модалки когда ресайзят окно
    $(window).resize(function () {
        $dialog.dialog("option", "position", optionPosition);
    });

    //TODO: be careful!! эта функция отключает анкорные ссылки
    $tabs.find(selector.anchorLinkInTabs).off().on('click', function (event) {
        $tabs.tabs({active: $('>div[id]', $tabs).index($($(event.target).attr('href')))});
        event.preventDefault();
    });
    $('.ui-dialog').off('mousedown');


    return {
        lockTabs: function (params) {
            if (!params) {
                return false;
            } else if (params == 'all') {
                $tabs.tabs("disable");
            } else if (typeof params === 'string') {
                $tabs.tabs('disable', '#' + params);
            } else if (typeof params.pop === 'function') {
                $.each(params, function (index, element) {
                    $tabs.tabs('disable', '#' + element);
                });
            }
            return true;
        },
        unlockTabs: function (params) {
            if (!params) {
                return false;
            } else if (params == 'all') {
                $tabs.tabs("enable");
            } else if (typeof params === 'string') {
                $tabs.tabs('enable', '#' + params);
            } else if (typeof params.pop === 'function') {
                $.each(params, function (index, element) {
                    $tabs.tabs('enable', '#' + element);
                });
            }
            return true;
        }
    }
};
