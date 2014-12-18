// отрефакторить эту срань когда-нибудь - это ж ппц, мля!

(function($){
	$.fn.scrollToTop = function() {
		if($(window).scrollTop()!==0) {
			$("body").append("<div id='u-scroll' onclick='uPanel.scroll.to_top();'><i><b>↑</b></i></div>");
			$("#u-scroll").fadeIn("fast");
		}
		$(window).scroll(function() {
			if ($(window).scrollTop()===0) {
				if($("#u-scroll").length > 0){
					$("#u-scroll").fadeOut("fast", function() {
						$(this).remove();
					});
				}
			} else {
				if(!$("#u-scroll").length > 0){
					$("body").append("<div id='u-scroll' onclick='uPanel.scroll.to_top();'><i><b>↑</b></i></div>");
				}
				$("#u-scroll").fadeIn("fast");
			}
		});
	};
	$.fn.ucheckbox = function() {
		return this.each(function(){
		
			$('.iPhoneCheckDisabled').parents('div').addClass('disabled');
			
			var inpParnt = $(this);
			var inpCheck = $(this).find("input");
			var inpState = false;
			var inpActin = inpParnt.attr("data-hide");
			var inpCheckState = function(){
				if(inpCheck.prop("checked")){
					inpState="on";
				} else {
					inpState="off";
				}
			};
			var inpCheckAct = function(){
				if( inpParnt.hasClass('disabled') ) {
					return;
				};
				if(inpState=="on"){
					inpParnt.addClass("checked");
					if(inpActin && inpActin!=="undefined"){
						$(inpActin).slideDown("slow");
					}
				} else {
					inpParnt.removeClass("checked");
					if(inpActin && inpActin!=="undefined"){
						$(inpActin).slideUp("slow");
					}
				}
			};
			
			inpCheckState();
			if(inpState=="on"){
				inpParnt.addClass("checked");
				if(inpActin && inpActin!=="undefined"){
					$(inpActin).show();
				}
			} else {
				inpParnt.removeClass("checked");
				if(inpActin && inpActin!=="undefined"){
					$(inpActin).hide();
				}
			}
			inpCheck.iphoneStyle({
				resizeContainer: false,
				resizeHandle: false,
						onChange: function(elem, value) { 
								if(value){
									inpState="on";
								} else {
									inpState="off";
								}
								inpCheckAct();
						}
					});
		});
	};
	$.fn.ucheck = function() {
		return this.each(function(){
			var check = $(this);
			var check_input = check.find("input");
			var check_flag = check_input.attr("checked");
			if(check_flag && check_flag!=="undefined"){
				check.addClass("checked");
			}
			check.on("click", function(){
				if(check_input.attr("type")=="checkbox"){
					if($(this).hasClass("checked")){
						$(this).removeClass("checked");
						check_input.attr('checked',false);
					} else {
						$(this).addClass("checked");
						check_input.attr('checked',true);
					}
				} else if(check_input.attr("type")=="radio"){
					if(!$(this).hasClass("checked")){
						var checkGroup = $($(this).parents().get(1));
						checkGroup.find("div.checked").removeClass("checked");
						checkGroup.find("input[checked]").attr('checked',false);
						$(this).addClass("checked");
						check_input.attr('checked',true);
					}
				}
			});
		});
	};
	$.fn.uPanelTop = function() {
	$(function(){
					$(window).scroll(function() {
						var top = $(document).scrollTop();
						if (top < 99) $(".scroll-top-panel_wrap").hide();
						else $(".scroll-top-panel_wrap").show();
					});
				});	
	};
	if(false) $.fn.draggable = function(){ // FIXME - может, это нужно, а я его взял и отрубил??? Максим В.
		function disableSelection(){
			return false;
		}
			$(this).mousedown(function(e){
			var drag = $(this);
			var drag_P = $(this).parent();
			var posParentTop = $(drag.parents().get(1)).offset().top;
			var posParentBottom = posParentTop + $(drag.parents().get(1)).height();
			var posOld = drag.offset().top;
			var posOldCorrection = e.pageY - posOld;
			drag_P.css({'z-index':12});
					drag.css({'z-index':12, 'position':'absolute'});
			var mouseMove = function(e){
				if(!drag_P.hasClass("edit")){
					drag_P.find(".field-ctrls").remove();
				} else {
					drag_P.find("input").blur();
				}
				var posNew = e.pageY - posOldCorrection;
				if (posNew < posParentTop){
					drag.offset({'top': posParentTop});
					if (drag_P.prev().length > 0 ) {
						drag_P.insertBefore(drag_P.prev().css({'top':-drag_P.height()}).animate({'top':0}, 100));
						uPanel.fields.mix(drag.parents().get(2));
					}
				} else if (posNew + drag_P.height() > posParentBottom){
					drag.offset({'top': posParentBottom - drag_P.height()});
					if (drag_P.next().length > 0 ) {
						drag_P.insertAfter(drag_P.next().css({'top':drag_P.height()}).animate({'top':0}, 100));
						uPanel.fields.mix(drag.parents().get(2));
									}
				} else {
					drag.offset({'top': posNew});
					if (posOld - posNew > drag_P.height() - 1){
						drag_P.insertBefore(drag_P.prev().css({'top':-drag_P.height()}).animate({'top':0}, 100));
						uPanel.fields.mix(drag.parents().get(2));
						drag.css({'top':0});
						posOld = drag.offset().top;
						posNew = e.pageY - posOldCorrection;
					} else if (posNew - posOld > drag_P.height() - 1){
						drag_P.insertAfter(drag_P.next().css({'top':drag_P.height()}).animate({'top':0}, 100));
						uPanel.fields.mix(drag.parents().get(2));
						drag.css({'top':0});
						posOld = drag.offset().top;
						posNew = e.pageY - posOldCorrection;
					}
				}
			};
			var mouseUp = function(){
				$(document).off('mousemove', mouseMove).off('mouseup', mouseUp);
				$(document).off('mousedown', disableSelection);
							drag.animate({'top':0}, 100, function(){
					drag_P.removeAttr("style");
					drag.removeAttr("style");
						});
						uPanel.fields.mix(drag.parents().get(2));
					};
			$(document).on('mousemove', mouseMove).on('mouseup', mouseUp).on('contextmenu', mouseUp);
			$(document).on('mousedown', disableSelection);
					$(window).on('blur', mouseUp);
			});
	};
	$.fn.dragPaste = function(){
		function disableSelection(){
			return false;
		}
			$(this).mousedown(function(e){
			var drag = $(this);
			var dragPos = drag.offset();
			var dragPosY = dragPos.top;
			var dragPosX = dragPos.left;
			var dragCorX = e.pageX - dragPosX;
			var dragCorY = e.pageY - dragPosY;
			var dragParent;
			var dragZone = $(drag.parents().get(3)).find(".main-sets__fields-wrap");
			var dragPar = $(drag.parents().get(1)).offset().left;
			var dropZonePos = dragZone.offset();
			var dropZoneX = dropZonePos.left;
			var dropZoneY = dropZonePos.top;
			var dropZaneH = dragZone.height()+dropZoneY;
			var inDropZone = false;
			var dragEl_h = drag.height();
			var dropZoneEls = [];
			var newDropPlace, dragNewEl;
			var startElements = function(){
				var dropElCount = $(dragZone[0]).children("li[class^='sets_field']").length;
				for(var i=0; i<dropElCount; i++) {
					var Elem = $($(dragZone[0]).children("li")[i]);
					var ElHeight = 47;
					var ElSeparat = 26;
					if(Elem.hasClass("out")){
						ElSeparat = 12;
					}
					if(Elem.hasClass("sets_field-separator")){
						ElHeight = 24;
						ElSeparat = 12;
					}
					if(i==dropElCount-1){
						ElSeparat = 0;
					}
					if(i!=0){
						var prevEl = i-1;
						var ElSumHeight = ElHeight + (ElSeparat/2) + ((dropZoneEls[prevEl][1])/2);
						var ElFromTop = dropZoneEls[prevEl][2]+dropZoneEls[prevEl][3];
					} else {
						var ElFromTop = 0;
						var ElSumHeight = ElHeight + (ElSeparat/2);
					}
					var ElToTop = ElFromTop + ElSumHeight;
					dropZoneEls[i] = [ElHeight, ElSeparat, ElSumHeight, ElFromTop, ElToTop];
				};
			};
			startElements();
			var mouseMove = function(e){
				if(!drag.parent().hasClass("dragable_el") && !drag.parent().hasClass("main-sets__fields-wrap")){
					if(drag.is(':last-child')){
						drag.wrap("<div class='dragable_el last'></div>");
						drag.addClass("draged");
					} else {
						drag.wrap("<div class='dragable_el'></div>");
						drag.addClass("draged");
					}
					dragParent = drag.parent();
					dragParent.height(dragEl_h);
				}
				var x_Drag = e.pageX - (dragPosX + dragCorX);
				var y_Drag = e.pageY - (dragPosY + dragCorY);
				if($(drag.parents().get(2)).hasClass("sets_fields-add")){
					drag.css({'top':y_Drag, 'left':x_Drag});
				};
				if(e.pageX<=dragPar && e.pageX>=dropZoneX && e.pageY>=dropZoneY && e.pageY<=dropZaneH){
					inDropZone = true;
				} else {
					inDropZone = false;
				}
				if(inDropZone){
					var NowDist = 0-(dropZoneY - e.pageY);
					var NowDistFrom = NowDist - dragCorY;
					var NowDistTo = NowDistFrom + dragEl_h;
					for(var i=0; i<dropZoneEls.length; i++){
						if(NowDistFrom>=dropZoneEls[i][3] && NowDistFrom+(dragEl_h/2)<=dropZoneEls[i][4]){
							if(newDropPlace!==i){
								newDropPlace = i;
								dragElementPaste(newDropPlace);
							}
							break;
						} else if(dropZoneEls[i][4]>=NowDistTo && NowDistTo-(dragEl_h/2)>=dropZoneEls[i][3]){
							if(newDropPlace!==i){
								newDropPlace = i;
								dragElementPaste(newDropPlace);
							}
							break;
						}
					};
				}
			};
			var dragElementPaste = function(el){
				if($($(dragZone[0]).children("li")[el]).prev().hasClass("new_field_place")){
					dragNewEl = $($(dragZone[0]).children("li")[el]).after("<li class='sets_field new_field_place' style='height:0px;'></li>").next();
				} else {
					dragNewEl = $($(dragZone[0]).children("li")[el]).before("<li class='sets_field new_field_place' style='height:0px;'></li>").prev();
				}
				$(dragZone[0]).find("li.new_field_place").each(function(){
					if($(this).index()!=el && $(this).index()!=el+1){
						$(this).animate({"height":0}, 100, function(){
							$(this).remove();
						});
						dragNewEl.animate({"height":73}, 100);
					}
				});
				//Здесь запуск пересмотра всех полей
				//uPanel.fields.mix($(dragZone[0]).parent());
			};
			var mouseUp = function(e){
				$(document).off('mousemove', mouseMove).off('mouseup', mouseUp);
				$(document).off('mousedown', disableSelection);
				if(!inDropZone){
								drag.animate({'top':0, 'left':0}, 100, function(){
						drag.removeClass("draged").css({'z-index':1});
						if(drag.parent().hasClass("dragable_el")){
							drag.unwrap();
						}
							});
					} else {
						var newElPositionY = e.pageY - dragNewEl.offset().top - dragCorY;
						var newElPositionX = e.pageX - dragNewEl.offset().left - dragCorX;
						dragParent.slideUp(100, function(){
							$(this).remove();
						});
						dragNewEl.append(drag).find("li").removeClass("draged").css({top:newElPositionY,left:newElPositionX}).animate({top:0,left:0}, 100, function(){
							$(this).removeAttr("style").unwrap();
						});
					}
					};
			$(document).on('mousemove', mouseMove).on('mouseup', mouseUp).on('contextmenu', mouseUp);
			$(document).on('mousedown', disableSelection);
					$(window).on('blur', mouseUp);
			});
	};
	$.fn.uViewBtn = function() {
		return this.each(function(){
			var checker = $(this).find("input");
			var checkState = checker.prop("checked");
			if(checkState && checkState!=="undefined"){
				$(this).addClass("checked");
				$(this).find('span').addClass("checked");
			}
			$(this).on("click", function(){
				if(!$(this).hasClass("checked")){
					$(this).parent().find(".checked").each(function(){
						$(this).removeClass("checked").find("input").prop("checked",false).trigger('change');
						$(this).find('span').removeClass("checked");
					});
					$(this).addClass("checked").find("input").prop("checked",true).trigger('change');
					$(this).find('span').addClass("checked");
				}
			});
		});
	};
	$.fn.jrumble = function(options){
		
		/*========================================================*/
		/* Options
		/*========================================================*/
		var defaults = {
			x: 2,
			y: 2,
			rotation: 1,
			speed: 15,
			opacity: false,
			opacityMin: .5
		},
		opt = $.extend(defaults, options);	
				
		return this.each(function(){
									
			/*========================================================*/
			/* Variables
			/*========================================================*/
			var $this = $(this),				
				x = opt.x*2,
				y = opt.y*2,
				rot = opt.rotation*2,
				speed = (opt.speed === 0) ? 1 : opt.speed,			
				opac = opt.opacity,
				opacm = opt.opacityMin,
				inline,
				interval;
			
			/*========================================================*/
			/* Rumble Function
			/*========================================================*/		
			var rumbler = function(){				
				var rx = Math.floor(Math.random() * (x+1)) -x/2,
					ry = Math.floor(Math.random() * (y+1)) -y/2,
					rrot = Math.floor(Math.random() * (rot+1)) -rot/2,
					ropac = opac ? Math.random() + opacm : 1;
					
				/*========================================================*/
				/* Ensure Movement From Original Position
				/*========================================================*/				
				rx = (rx === 0 && x !== 0) ? ((Math.random() < .5) ? 1 : -1) : rx;
				ry = (ry === 0 && y !== 0) ? ((Math.random() < .5) ? 1 : -1) : ry;	
				
				/*========================================================*/
				/* Check Inline
				/*========================================================*/
				if($this.css('display') === 'inline'){
					inline = true;
					$this.css('display', 'inline-block');
				}
				
				/*========================================================*/
				/* Rumble Element
				/*========================================================*/			
				$this.css({
					'position':'relative',
					'left':rx+'px',
					'top':ry+'px',
					'-ms-filter':'progid:DXImageTransform.Microsoft.Alpha(Opacity='+ropac*100+')',
					'filter':'alpha(opacity='+ropac*100+')',					
					'-moz-opacity':ropac,					
					'-khtml-opacity':ropac,					
					'opacity':ropac,
					'-webkit-transform':'rotate('+rrot+'deg)', 
					'-moz-transform':'rotate('+rrot+'deg)', 
					'-ms-transform':'rotate('+rrot+'deg)',
					'-o-transform':'rotate('+rrot+'deg)', 
					'transform':'rotate('+rrot+'deg)'
				});
			};
			
			/*========================================================*/
			/* Rumble CSS Reset
			/*========================================================*/
			var reset = {
				'left':0,
				'top':0,
				'-ms-filter':'progid:DXImageTransform.Microsoft.Alpha(Opacity=100)',
				'filter':'alpha(opacity=100)',					
				'-moz-opacity':1,					
				'-khtml-opacity':1,					
				'opacity':1,
				'-webkit-transform':'rotate(0deg)',
				'-moz-transform':'rotate(0deg)',
				'-ms-transform':'rotate(0deg)',
				'-o-transform':'rotate(0deg)',
				'transform':'rotate(0deg)'
			};
			
			/*========================================================*/
			/* Rumble Start/Stop Trigger
			/*========================================================*/
			$this.bind({
				'startRumble': function(e){
					e.stopPropagation();
					clearInterval(interval);
					interval = setInterval(rumbler, speed)
				},
				'stopRumble': function(e){
					e.stopPropagation();
					clearInterval(interval);
					if(inline){
						$this.css('display', 'inline');
					}
					$this.css(reset);
				}
			});		
			
		});// End return this.each
	};// End $.fn.jrumble
})(jQuery);
