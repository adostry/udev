// TODO: REFACTOR THIS FUCKING SHITCODE!!!!!1111

var uPanel = {
	_default: {
		isortable: false,
		keyDown: 10,
		navtrue: true,
		maxFileSize: 1000000,
		scrollHead: false,
		maxScroll: 0,
		fieldAddstate: false,
		devMode: true, // установить false для отключения боковой панели
		devMode_width: 280
	},


	init: function(selector) {
		//инициализация js после готовности документа

		selector = selector || 'body';

		window.console && console.info && console.info('uPanel.init', selector);

		var container = $(selector);

		if( !uPanel._initializedGlobally ) {
			window.console && console.info && console.info('uPanel.init', 'global');
			uPanel._initializedGlobally = true;
			$(window)
				.on('scroll', uPanel.scroll.scrolled)
				.on('resize', uPanel.resize)
			;
		};

		container.find('body').scrollToTop();
		container.find('.radio-view').uViewBtn();
		container.find('.main-sets__fields li span').draggable();
		container.find('.u-form_checkIOS>div').ucheckbox();
		container.find('.main-el_check').ucheck();
		container.find('.scroll-top-panel_wrap').uPanelTop();
		container.find('select:not([multiple])').selecter();
        container.find('select[multiple]').SumoSelect();

		container.find('.u-filter_list' ).sortable({
			containment: 'parent',
			handle:'.u-item_drag',
			helper:'clone',
			opacity:0.55,
			update: function(event, ui) {
				container.find('.u-filter_list input[type="hidden"][name$="_order"]').each(function(index) {
					$(this).val(++index);
				});
			}
		});

		container.find('.number-counter_field').each(function() {
			uPanel.spin(this);
		});

		container.find('.sett-slide-count').each(function() {
			uPanel.slide_count.init(this);
			container.find(container.find(this).parents().get(1)).find(".sett-slide-value").each(function() {
				container.find(this).on("keyup", function() {uPanel.slide_count.keyup(this)}).on("focusout", function() {uPanel.slide_count.focusout(this)});
			});
		});

		container.find('.u-info-curspace').each(function() {
			uPanel.informs.curSpace(this);
		});

		container.find('input[type="number"]').each(function() {
			$(this).attr('type', 'tel');
		});

		// TODO: move this dirty hack into appropriate place!!!
		container.find('.u-form_checkIOS>div').click(function(event) {
			// event.preventDefault && event.preventDefault();

			var elem = $(this);

			if( elem.is('.disabled') ) {
				return;
			};

			var input = elem.find('input');

			if( input.attr('checked') ) {
				input.prop('checked', false).removeAttr('checked').trigger('change');
			} else {
				input.prop('checked', true).attr('checked', 'checked').trigger('change');
			};

		});

		uPanel.scroll.side_size();
		uPanel.handleContainer(selector);

	},


	handleContainer: function(selector) {
		selector = selector || 'body';
		var container = $(selector);

		// popup for activating new module entry field:
		container.find('.dynamic-fields').each(function() {
			var elem = $(this);

			var addButton = elem.children('.u-btn-add');
			var popupContainer = elem.children('.u-popup_window');

			var leftMargin = addButton.outerWidth();
			var topMargin = popupContainer.outerHeight();

			addButton.click(function(event) {
				event.preventDefault && event.preventDefault();

				$(this).next('.u-popup_window').show();

				return false;
			});

		});

	},


	informs: {

		curSpace: function(elem) {
			elem = $(elem);

			var used = elem.find('.used').text();
			var full = elem.find('.full').text();
			var rule = elem.parent().width();

			elem.animate({
				width: rule * (used / full)
			}, 1000);

			uPanel.informs.curSize = elem.attr('data-size');

			setInterval(function() {
				uPanel.informs.curSpaceUpd(elem, uPanel.informs.curSize);
			}, 1000);

		},

		// TODO: refactor
		curSpaceUpd: function(elem, size){
			uPanel.informs.curSize = parseFloat(size) + 3;
			$('#current-full-space').html(uPanel.informs.curSpaceBytes(uPanel.informs.curSize));
		},

		// TODO: refactor
		curSpaceBytes: function(amount){
			var bytes = Math.floor(amount).toString().split('');
			var str = '';
			for(var i=bytes.length-1; i>=0; i--){
				str += bytes.splice(0,1);
				if(i%3 == 0 && i != 0) str += ' ';
			};
			return str;
		}

	},


	slide_count: {
		init: function(element){
            var $element = $(element);
            var $setSlideValue = $element.closest('.slide_counter').find(".sett-slide-value");
			var sliderMaximum = parseFloat($setSlideValue.attr("data-max")) || 100;
			var sliderMinimum = parseFloat($setSlideValue.attr("data-min")) || 0;

            $element.slider({
		     	range: "min",
		     	orientation: "horizontal",
		     	animate: true,
		    	min: sliderMinimum,
		    	max: sliderMaximum,
		    	value: parseFloat($setSlideValue.val()),
		    	slide: function( event, ui ) {
                    $setSlideValue.val(ui.value).trigger('change');
		      	}

	    	});
		},

        keyup: function (element) {
            var $element = $(element);
            var sliderMaximum = parseFloat($element.attr("data-max")) || 100;
            var sliderMinimum = parseFloat($element.attr("data-min")) || 0;
            var sliderCurrent = parseFloat($element.val()) || 0;
            var sliderResult;

            if ((sliderCurrent >= sliderMinimum) && (sliderCurrent <= sliderMaximum)) {
                sliderResult = sliderCurrent;
            } else if (((sliderCurrent >= 0)) && (sliderCurrent <= sliderMaximum)) {
                sliderResult = sliderCurrent;
            } else {
                sliderResult = sliderMaximum;
                $element.val(sliderMaximum);
            }

            $element.closest('.slide_counter').find(".sett-slide-count").slider("value", sliderResult);
            $element.on("change keyup input click", function (event) {
                var $element = $(event.target);
                $element.val($element.val().replace(/[^0-9]/g, ''));
            });
        },

	    focusout: function(element){
			var $element = $(element);
			var sliderCurrent = parseFloat($element.val()) || 0;
			var sliderDefault = parseFloat($element.attr('value'));
			var sliderMinimum = parseFloat($element.attr("data-min")) || 0;

            if (sliderCurrent < sliderMinimum) {
                $element.closest('.slide_counter').find(".sett-slide-count").slider("value", sliderDefault);
				$element.val(sliderDefault);
			}
	    }

	},


	// TODO: refactor
	scroll: {
		scrolled: function() {
			var scrollSize = $(window).scrollTop();
			if(scrollSize>233){
				$(".u-block-content-tab").addClass("fixed");
				var ifFixed = setInterval(function() {
					if($(".u-block-content-tab").hasClass("fixed")){
						$(".u-block-content-tab").addClass("anim");
						clearInterval(ifFixed);
					}
				}, 10);
				if(scrollSize>380){
					$(".u-block-content-tab").addClass("show");
				}
				uPanel.scroll.side_size();
			}
			if(scrollSize<=380){
				$(".u-block-content-tab").removeClass("show");
				if(scrollSize<=233){
					$(".u-block-content-tab").removeClass("anim").removeClass("fixed").removeAttr("style");
				}
			}
			if($(window).scrollTop() == $(document).height() - $(window).height()){
				if($(".u-block-activity").length>0){uPanel.wall.load();}
			};
			//var sidebarH = $(".u-side").height() + $(".u-head").height() + 140;
			//Дописать модуль скрытия сайдбара и разворачивания контента
			/*if(page == "main"){
				if ($(window).scrollTop() >= sidebarH){
					$(".u-side").addClass("hide");
					$(".u-content").addClass("wide");
				};
				if ($(window).scrollTop() < sidebarH){
					$(".u-side").removeClass("hide");
					$(".u-content").removeClass("wide");
				};
			}*/
		},
		widths: function() {
			$("#u-scroll").each(function() {
				var fullW = $("#u-body").width();
				var mainW = $(".u-main").width();
				var scrollW = (fullW - mainW) / 2;
				$(this).width(scrollW);
			});
		},
		to_top: function(func){
			var speed = ($(window).scrollTop())/2;
			$("body").animate({
				scrollTop: 0
			}, speed, function() {
				if(typeof func !== "undefined"){
					func();
				}
			});
		},
		side_size: function() {
			if($(window).scrollTop()>220){
				var tabsPosition = $(".u-content").offset();
				$(".u-block-content-tab").css("left", tabsPosition.left);
			}
		}
	},


	// TODO: review, refactor or remove, if not needed anymore
	resize: function() {
		uPanel.scroll.widths();
		uPanel.scroll.side_size();
		if($("#u-modal").hasClass("open")){
			uPanel.modal.heights();
			uPanel.modal.position();
			setSlider($("#modal-sroll-content"));
		};
	},


	// TODO: review, refactor or remove, if not needed anymore
	modal: {
		open: function (uwindow, size){
			//Переписать под создание контента с эффектами открытия
			if(!$("#u-modal").hasClass("open")){
				$("#u-modal-content").removeAttr("class").addClass(uwindow);
				if(size == 'large'){
					uPanel.modal.heights();
				}
				$("body").addClass("modal-open");
				$("#u-modal").removeClass("first").css("visibility", "visible").addClass("open").each(function() {
					setSlider($("#modal-sroll-content"));
				});
				uPanel.modal.position();
			}
		},
		create: function() {
			//Создание контента (Загрузка контента с чего-либо)
		},
		close: function() {
			if($("#u-modal").hasClass("open")){
				$("#u-modal").removeClass("open").delay(500).queue(function(next){
		        	$(this).css("visibility", "hidden");
		        	next();
		      	});
				$("body").removeClass("modal-open");
			}
		},
		position: function() {
			if($("html").hasClass("no-csstransforms")){
				var modalInner = $("#u-modal-inner");
				var modalInnerH = modalInner.height() / 2;
				var modalInnerW = modalInner.width() / 2;
				$("#u-modal-inner").css({
					marginTop: -modalInnerH,
					marginLeft: -modalInnerW
				});
			};
		},
		heights: function() {
			var modalH = $(window).height() - 260;
			var modalCont = $("#u-modal #ucoz-manage-act").height();
			if(modalH < modalCont){
				$("#modal-sroll-content").height(modalH);
			} else if(modalH >= modalCont){
				$("#modal-sroll-content").height(modalCont);
				$("#u-modal-content.adding-panel").find(".modal-mask").css({opacity:0});
			};
			if(modalH < 220){
				$("#modal-sroll-content").height(220);
			}
		}
	},


	// TODO: review, refactor or remove, if not needed anymore
	tabs: {
		action: function(element){
			var contTab = $(element).attr("data-tab");
			if(!$(element).parent().hasClass("active")){
				var contTabs = $(element).parents().get(4);
				$(contTabs).find("li").removeClass("active");
				$(element).parent().addClass("active");
				var contTabius = $(contTabs).next();
				contTabius.find(".content-tab.active").removeClass("active").fadeOut(300, function() {
					var currentTab = $(contTabs).find("li.active a").attr("data-tab");
					contTabius.find(".content-tab[data-tab='"+currentTab+"']").addClass("active").fadeIn(300, function() {
						contTabius.find(".content-tab.active").each(function() {
							if(!$(element).attr("data-tab")==currentTab){
								$(element).hide().removeClass("active");
								contTabius.find(".content-tab[data-tab='"+currentTab+"']").show().addClass("active");
							}
						});
					});
				});
				uPanel.scroll.to_top();//scrollMeTo(newTab);
			}
		}
	},


	// TODO: refactor
	spin: function(el){
		var spin = $(el);
		var numbMin = $(el).attr("data-min");
		var numbMax = $(el).attr("data-max");

		spin.bind("change keyup input click", function() {
			if (this.value.match(/[^0-9]/g)) {
				this.value = this.value.replace(/[^0-9]/g, '');
				}
			});

		spin.spinner({
			min: numbMin,
	      	max: numbMax,
	      	mouseWheel: false
		}).unmousewheel().on("focusin", function() {
			$(this).parent().addClass("focus");
		}).on("focusout", function() {
			if(spin.val()===""){
				spin.spinner("value", spin.attr("aria-valuemin"));
			} else {
				if(parseFloat(spin.val())>parseFloat(spin.attr("aria-valuemax"))){
					spin.spinner("value", spin.attr("aria-valuemax"));
				}
			}
			 if(parseFloat(spin.val())>parseFloat(spin.attr("aria-valuemax"))){
     spin.spinner("value", spin.attr("aria-valuemax"));
    }


 if(parseFloat(spin.val())<parseFloat(spin.attr("aria-valuemin"))){
     spin.spinner("value", spin.attr("aria-valuemin"));
    }
			$(this).parent().removeClass("focus");
		});

	},


	// TODO: remove or rewrite
	files: {
		init: function(el){
			uPanel.files.loader = $("#u-fm-load");

			if (typeof(window.FileReader) == 'undefined') {
	    		uPanel.files.loader.find("span").text('Не поддерживается браузером!');
	    		uPanel.files.loader.addClass('error');
			}

			$(el).on({
			    dragover: function () {
			        $(this).addClass('hover');
			        return false;
			    },
			    dragend: function () {
			        $(this).removeClass('hover');
			        return false;
			    },
			    drop: function (e) {
			        event.preventDefault();
				    $(this).removeClass('hover');
				    $(this).addClass('drop');
				    var file = event.dataTransfer.files[0];
				    if (file.size > uPanel._default.maxFileSize) {
				        $(this).find("span").text('Файл слишком большой!');
				        $(this).addClass('error');
				        return false;
				    }
				    var xhr = new XMLHttpRequest();
				    xhr.upload.addEventListener('progress', uPanel.files.progress, false);
				    xhr.onreadystatechange = uPanel.files.state;
				    xhr.open('POST', '/upload.php');
				    xhr.setRequestHeader('X-FILE-NAME', file.name);
				    xhr.send(file);
			    },
			    click: function() {
			    	var fileselect = document.getElementById("u-fm-load-cl");
					fileselect.click();
			    }
			});
		},
		progress: function(event){
			var percent = parseInt(event.loaded / event.total * 100);
	    	uPanel.files.loader.find("span").text('Загрузка: ' + percent + '%');
		},
		state: function(event){
			if (event.target.readyState == 4) {
		        if (event.target.status == 200) {
		            uPanel.files.loader.find("span").text('Загрузка успешно завершена!');
		        } else {
		            uPanel.files.loader.find("span").text('Произошла ошибка!');
		            uPanel.files.loader.addClass('error');
		        }
		    }
		}
	},


	// TODO: refactor or rewrite
	manage: {
		lock: function(el){
			if($(el).hasClass("locked")){
				$(el).removeClass("locked").addClass("unlocked");
				$(".elem-manage-nav").removeClass("locked").addClass("unlocked");
				$("#elem-manage-g").find("li").each(function() {
					$(this).jrumble({
						speed: 80,
						x: 0,
						y: 0,
						rotation: 1
					});
					$(this).trigger("startRumble");
					$("#block-add").trigger("stopRumble");
				}).hover(function() {
					$(this).trigger("stopRumble");
				}).mouseleave(function() {
					$(this).trigger("startRumble");
					$("#block-add").trigger("stopRumble");
				});
				uPanel._default.isortable = true;
			} else if($(el).hasClass("unlocked")){
				$(el).removeClass("unlocked").addClass("locked");
				$(".elem-manage-nav").removeClass("unlocked").addClass("locked");
				$("#elem-manage-g").find("li").each(function() {
					$(this).trigger("stopRumble");
				}).mouseleave(function() {
					$(this).trigger("stopRumble");
				});
				uPanel._default.isortable = false;
			};
			if(uPanel._default.isortable == true){
				$("#elem-manage-g").find("li").removeClass("disabled");
			} else {
				$("#elem-manage-g").find("li").addClass("disabled");
			}
		},
		deletes: function(el){
			var deleted = $($(el).parents().get(1));
			deleted.fadeOut(function() {
				$("#no-active-manage").append(deleted.fadeIn(function() {
					uPanel.manage.clones();
				}));
				uPanel.manage.heights();
			});
		},
		clones: function() {
			$("#elem-manage-clone li").remove();
			$("#elem-manage-g li").each(function() {
		        var item = $(this);
		        var item_clone = item.clone();
		        item.data("clone", item_clone);
		        var position = item.position();
		        item_clone.css("left", position.left);
		        item_clone.css("top", position.top);
		        item_clone.css("position", "absolute");
		        item_clone.css("visibility", "hidden");
		        $("#elem-manage-clone").append(item_clone);
			});
		},
		heights: function() {
			$("#elem-manage-clone").height($("#elem-manage-g").height());
		},
		modal_btns: {
			init: function(el){
				$(el).on("click", function() {
					var actButton = $("#elem-manage-g").find("#block-add");
					var parentID = $(this).closest("li").attr("id");
					var addButton = $("#no-active-manage").find("#" + parentID);
					var removeButton = $("#elem-manage-g").find("#" + parentID);
					if($(this).hasClass("add")){
						addButton.fadeOut(function() {
							$("#elem-manage-g").append(addButton.fadeIn(function() {
								uPanel.manage.clones();
							}));
							$("#elem-manage-g").append(actButton);
							uPanel.manage.heights();
							if(uPanel._default.isortable){
								$(this).trigger("startRumble");
							}else{
								$(this).trigger("stopRumble").mouseleave(function() {
									$(this).trigger("stopRumble");
								});
							};
						});
						$(this).html("Добавлено").removeClass("add").addClass("added");
					} else if($(this).hasClass("cancel")){
						removeButton.fadeOut(function() {
							$("#no-active-manage").append(removeButton.fadeIn(function() {
								uPanel.manage.clones();
							}));
							uPanel.manage.heights();
							if(uPanel._default.isortable){
								$(this).trigger("startRumble");
							}else{
								$(this).trigger("stopRumble").mouseleave(function() {
									$(this).trigger("stopRumble");
								});
							};
						});
						$(this).html("Добавить").removeClass("added").removeClass("cancel").addClass("add");
					}
				}).on("mouseenter", function() {
					if($(this).hasClass("added")){
						$(this).addClass("cancel").html("Отменить");
					}
				}).on("mouseleave", function() {
					if($(this).hasClass("added")){
						$(this).removeClass("cancel").html("Добавлено");
					}
				});
			}
		},
		sortable: {
			init: function(el){
				$(el).sortable({
			    	cursor:'move',
			    	connectWith: "#no-active-manage",
					placeholder: "elem-manage-old",
					items: "li:not(.elem-manage-ndrag)",
					cancel:".disabled",
					tolerance: "pointer",
					revert: 50,
					create: function(e,ui){
						$("#elem-manage-g").find("li").addClass("disabled");
						uPanel.manage.sortable.list();
						$("#elem-manage-clone li").css("visibility", "hidden");
						$("#elem-manage-clone").find(".title").css("color", "transparent");
						uPanel.manage.heights();
					},
			        start: function(e, ui){
			            $(ui.placeholder).html("<div class=" + "inner" + "></div>");
			            $("#elem-manage-clone li").css("visibility", "visible");
			            $("#elem-place-manage").css("display", "block");
			            ui.helper.addClass("exclude-me");
			        	$("#elem-manage-g li:not(.exclude-me, .elem-manage-old, #block-add)").css("visibility", "hidden");
			        	ui.helper.data("clone").hide();
			        	$("#elem-manage-clone").find(".title").css("color", "#33383d");
			        	var placeholderp = $(".elem-manage-old").offset();
			        	$("#hidden-placeholder").offset({ top: placeholderp.top, left: placeholderp.left });
			        },
			        stop: function(e, ui){
			        	$("#elem-manage-g li.exclude-me").each(function() {
			                var item = $(this);
			                var clone = item.data("clone");
			                var position = item.position();
			                clone.css("left", position.left);
			                clone.css("top", position.top);
			                clone.show();
			                item.removeClass("exclude-me");
			            });
			            $("#elem-manage-g li").css("visibility", "visible");
			            $("#elem-manage-clone li").css("visibility", "hidden");
			            $("#elem-place-manage").css("display", "none");
			            $("#elem-manage-clone").find(".title").css("color", "transparent");
			        },
			        change: function(e, ui){
			            $("#elem-manage-g li:not(.exclude-me, .elem-manage-old)").each(function() {
			                var item = $(this);
			                var clone = item.data("clone");
			                clone.stop(true, false);
			                var position = item.position();
			                clone.animate({
			                    left: position.left,
			                    top:position.top}, 500);
			            });
			            uPanel.manage.heights();
			            var placeholderp = $(".elem-manage-old").offset();
			        	$("#hidden-placeholder").offset({ top: placeholderp.top, left: placeholderp.left });
			        }
			    }).disableSelection();
				$("#no-active-manage").sortable({
					connectWith: "#elem-manage-g"
				});
			},
			list: function() {
				$("#elem-manage-g li").each(function() {
			        var item = $(this);
			        var item_clone = item.clone();
			        item.data("clone", item_clone);
			        var position = item.position();
			        item_clone.css("left", position.left);
			        item_clone.css("top", position.top);
			        $("#elem-manage-clone").append(item_clone);
			    });
			}
		}
	},


	// TODO: remove
	wall: {
		load: function() {
			var wallClone = $("#elem-activity-wrap #elem-acivity-item").slice(0,4).clone(true);
			if(wallClone.hasClass("approve")){
				wallClone.removeClass("approve").children(".e-act-apply").css("display", "block");
			};
			$("#elem-activity-wrap").append(wallClone.fadeIn());
		}
	}


};


// TODO: refactor or remove if not needed anymore
function setSlider($scrollpane){
	var handleImage = false;
	var scrollparent = $scrollpane.parent();
	var hidemask = $("#u-modal-content.adding").find(".modal-maskt");
	var hidebmask = $("#u-modal-content.adding").find(".modal-mask");
	$scrollpane.css('overflow','hidden');
	if ($scrollpane.find('.scroll-content').length==0) $scrollpane.children().wrapAll('<\div class="scroll-content"> /');
	var difference = $scrollpane.find('.scroll-content').height()-$scrollpane.height();
	$scrollpane.data('difference',difference);
	hidemask.css({opacity:0});
	if(difference<=0 && scrollparent.find('.slider-wrap').length>0)
	{
		scrollparent.find('.slider-wrap').remove();
		$scrollpane.find('.scroll-content').css({top:0});
		hidemask.css({opacity:0});
	}
	if(difference>0)
	{
		var proportion = difference / $scrollpane.find('.scroll-content').height();
		var handleHeight = Math.round((1-proportion)*$scrollpane.height());
		handleHeight -= handleHeight%2;
		var contentposition = $scrollpane.find('.scroll-content').position();
		var sliderInitial = 100*(1-Math.abs(contentposition.top)/difference);

		if(scrollparent.find('.slider-wrap').length==0)
		{
			scrollparent.append('<\div class="slider-wrap"><\div class="slider-vertical"><\/div><\/div>');
			sliderInitial = 100;
		}

		scrollparent.find('.slider-wrap').height($scrollpane.height());
		scrollparent.find('.slider-vertical').slider({
			orientation: 'vertical',
			min: 0,
			max: 100,
			range:'min',
			value: sliderInitial,
			slide: function(event, ui) {
				var topValue = -((100-ui.value)*difference/100);
				$scrollpane.find('.scroll-content').css({top:topValue});
				$('ui-slider-range').height(ui.value+'%');
			},
			change: function(event, ui) {
				var topValue = -((100-ui.value)*($scrollpane.find('.scroll-content').height()-$scrollpane.height())/100);
				$scrollpane.find('.scroll-content').css({top:topValue});
				$('ui-slider-range').height(ui.value+'%');
				var scrollHt = 0 - ($scrollpane.find('.scroll-content').height()-$scrollpane.height());
				if(topValue == 0){
					hidemask.css({opacity:0});
				};
				if(topValue != 0){
					hidemask.css({opacity:1});
					hidebmask.css({opacity:1});
				};
				if(topValue == scrollHt){
					hidebmask.css({opacity:0});
				};
		  }
		});
		scrollparent.find(".ui-slider-handle").css({height:handleHeight,'margin-bottom':-0.5*handleHeight});
		var origSliderHeight = $scrollpane.height();
		var sliderHeight = origSliderHeight - handleHeight ;
		var sliderMargin =  (origSliderHeight - sliderHeight)*0.5;
		scrollparent.find(".ui-slider").css({height:sliderHeight,'margin-top':sliderMargin});
		scrollparent.find(".ui-slider-range").css({bottom:-sliderMargin});
	}
	$(".ui-slider").click(function(event){
		event.stopPropagation();
	});
	$(".slider-wrap").click(function(event){
		var offsetTop = $(this).offset().top;
		var clickValue = (event.pageY-offsetTop)*100/$(this).height();
		$(this).find(".slider-vertical").slider("value", 100-clickValue);
	});
	var ModalsliderVal = scrollparent.find(".slider-vertical").slider("value");
	$(".scroll-content").hammer().on("drag", function(ev) {
        ev.gesture.preventDefault();

        var sliderVal = scrollparent.find(".slider-vertical").slider("value");
        var moveY = (ev.gesture.deltaY / 100) + ModalsliderVal;
        var pointer = ev.gesture.pointerType;
        if(pointer == "mouse"){
        	$(this).mousedown(function() {
        		$(this).css("cursor", "move");
        	}).mouseup(function() {
        		$(this).css("cursor", "default");
        	});
        };
        if(moveY > 100){moveY = 100;} else if(moveY < 0){moveY = 0;};
		sliderVal = moveY;
		scrollparent.find(".slider-vertical").slider("value", sliderVal);
		ModalsliderVal = moveY;
		keyDown = ModalsliderVal / 10;
		ev.preventDefault();
    });
    $(window).keydown(function(keyboard) {
    	if($("body").hasClass("modal-open")){
	    	if(keyboard.keyCode==38){
	    		keyDown++;
	    	}else if(keyboard.keyCode==40){
	    		keyDown--;
	    	};
	    	if(keyDown > 10){keyDown = 10;}else if(keyDown < 0){keyDown = 0};
	    	sliderVal = keyDown*10;
	    	ModalsliderVal = sliderVal;
			scrollparent.find(".slider-vertical").slider("value", sliderVal);
			keyboard.preventDefault();
    	}
    });
	if($.fn.mousewheel){
		$scrollpane.unmousewheel();
		$scrollpane.mousewheel(function(event, delta){
			var speed = Math.round(5000/$scrollpane.data('difference'));
			if (speed <1) speed = 1;
			if (speed >100) speed = 100;
			var sliderVal = scrollparent.find(".slider-vertical").slider("value");
			sliderVal += (delta*speed);
			scrollparent.find(".slider-vertical").slider("value", sliderVal);
			ModalsliderVal = sliderVal;
			keyDown = ModalsliderVal / 10;
			event.preventDefault();
		});
	}
};
