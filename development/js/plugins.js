/*NEXT PLUGIN*/
/*HAMMER - for touch devices*/

(function(window, undefined) {
		'use strict';

/**
 * Hammer
 * use this to create instances
 * @param	 {HTMLElement}	 element
 * @param	 {Object}				options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
		return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
		// add styles and attributes to the element to prevent the browser from doing
		// its native behavior. this doesnt prevent the scrolling, but cancels
		// the contextmenu, tap highlighting etc
		// set to false to disable this
		stop_browser_behavior: {
		// this also triggers onselectstart=false for IE
				userSelect: 'none',
		// this makes the element blocking in IE10 >, you could experiment with the value
		// see for more options this issue; https://github.com/EightMedia/hammer.js/issues/241
				touchAction: 'none',
		touchCallout: 'none',
				contentZooming: 'none',
				userDrag: 'none',
				tapHighlightColor: 'rgba(0,0,0,0)'
		}

		// more settings are defined per gesture at gestures.js
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// dont use mouseevents on mobile devices
Hammer.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
Hammer.NO_MOUSEEVENTS = Hammer.HAS_TOUCHEVENTS && navigator.userAgent.match(Hammer.MOBILE_REGEX);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// hammer document where the base events are added at
Hammer.DOCUMENT = document;

// plugins namespace
Hammer.plugins = {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
		if(Hammer.READY) {
				return;
		}

		// find what eventtypes we add listeners to
		Hammer.event.determineEventTypes();

		// Register all gestures inside Hammer.gestures
		for(var name in Hammer.gestures) {
				if(Hammer.gestures.hasOwnProperty(name)) {
						Hammer.detection.register(Hammer.gestures[name]);
				}
		}

		// Add touch events on the document
		Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
		Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

		// Hammer is ready...!
		Hammer.READY = true;
}

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param	 {HTMLElement}			 element
 * @param	 {Object}						[options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
		var self = this;

		// setup HammerJS window events and register all gestures
		// this also sets up the default options
		setup();

		this.element = element;

		// start/stop detection option
		this.enabled = true;

		// merge options
		this.options = Hammer.utils.extend(
				Hammer.utils.extend({}, Hammer.defaults),
				options || {});

		// add some css to the element to prevent the browser from doing its native behavoir
		if(this.options.stop_browser_behavior) {
				Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
		}

		// start detection on touchstart
		Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
				if(self.enabled) {
						Hammer.detection.startDetect(self, ev);
				}
		});

		// return instance
		return this;
};


Hammer.Instance.prototype = {
		/**
		 * bind events to the instance
		 * @param	 {String}			gesture
		 * @param	 {Function}		handler
		 * @returns {Hammer.Instance}
		 */
		on: function onEvent(gesture, handler){
				var gestures = gesture.split(' ');
				for(var t=0; t<gestures.length; t++) {
						this.element.addEventListener(gestures[t], handler, false);
				}
				return this;
		},


		/**
		 * unbind events to the instance
		 * @param	 {String}			gesture
		 * @param	 {Function}		handler
		 * @returns {Hammer.Instance}
		 */
		off: function offEvent(gesture, handler){
				var gestures = gesture.split(' ');
				for(var t=0; t<gestures.length; t++) {
						this.element.removeEventListener(gestures[t], handler, false);
				}
				return this;
		},


		/**
		 * trigger gesture event
		 * @param	 {String}			gesture
		 * @param	 {Object}			eventData
		 * @returns {Hammer.Instance}
		 */
		trigger: function triggerEvent(gesture, eventData){
				// create DOM event
				var event = Hammer.DOCUMENT.createEvent('Event');
		event.initEvent(gesture, true, true);
		event.gesture = eventData;

				// trigger on the target if it is in the instance element,
				// this is for event delegation tricks
				var element = this.element;
				if(Hammer.utils.hasParent(eventData.target, element)) {
						element = eventData.target;
				}

				element.dispatchEvent(event);
				return this;
		},


		/**
		 * enable of disable hammer.js detection
		 * @param	 {Boolean}	 state
		 * @returns {Hammer.Instance}
		 */
		enable: function enable(state) {
				this.enabled = state;
				return this;
		}
};

/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
		/**
		 * simple addEventListener
		 * @param	 {HTMLElement}	 element
		 * @param	 {String}				type
		 * @param	 {Function}			handler
		 */
		bindDom: function(element, type, handler) {
				var types = type.split(' ');
				for(var t=0; t<types.length; t++) {
						element.addEventListener(types[t], handler, false);
				}
		},


		/**
		 * touch events with mouse fallback
		 * @param	 {HTMLElement}	 element
		 * @param	 {String}				eventType				like Hammer.EVENT_MOVE
		 * @param	 {Function}			handler
		 */
		onTouch: function onTouch(element, eventType, handler) {
		var self = this;

				this.bindDom(element, Hammer.EVENT_TYPES[eventType], function bindDomOnTouch(ev) {
						var sourceEventType = ev.type.toLowerCase();

						// onmouseup, but when touchend has been fired we do nothing.
						// this is for touchdevices which also fire a mouseup on touchend
						if(sourceEventType.match(/mouse/) && touch_triggered) {
								return;
						}

						// mousebutton must be down or a touch event
						else if( sourceEventType.match(/touch/) ||	 // touch events are always on screen
								sourceEventType.match(/pointerdown/) || // pointerevents touch
								(sourceEventType.match(/mouse/) && ev.which === 1)	 // mouse is pressed
						){
								enable_detect = true;
						}

						// we are in a touch event, set the touch triggered bool to true,
						// this for the conflicts that may occur on ios and android
						if(sourceEventType.match(/touch|pointer/)) {
								touch_triggered = true;
						}

						// count the total touches on the screen
						var count_touches = 0;

						// when touch has been triggered in this detection session
						// and we are now handling a mouse event, we stop that to prevent conflicts
						if(enable_detect) {
								// update pointerevent
								if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
										count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
								}
								// touch
								else if(sourceEventType.match(/touch/)) {
										count_touches = ev.touches.length;
								}
								// mouse
								else if(!touch_triggered) {
										count_touches = sourceEventType.match(/up/) ? 0 : 1;
								}

								// if we are in a end event, but when we remove one touch and
								// we still have enough, set eventType to move
								if(count_touches > 0 && eventType == Hammer.EVENT_END) {
										eventType = Hammer.EVENT_MOVE;
								}
								// no touches, force the end event
								else if(!count_touches) {
										eventType = Hammer.EVENT_END;
								}

								// because touchend has no touches, and we often want to use these in our gestures,
								// we send the last move event as our eventData in touchend
								if(!count_touches && last_move_event !== null) {
										ev = last_move_event;
								}
								// store the last move event
								else {
										last_move_event = ev;
								}

								// trigger the handler
								handler.call(Hammer.detection, self.collectEventData(element, eventType, ev));

								// remove pointerevent from list
								if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
										count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
								}
						}

						//debug(sourceEventType +" "+ eventType);

						// on the end we reset everything
						if(!count_touches) {
								last_move_event = null;
								enable_detect = false;
								touch_triggered = false;
								Hammer.PointerEvent.reset();
						}
				});
		},


		/**
		 * we have different events for each device/browser
		 * determine what we need and set them in the Hammer.EVENT_TYPES constant
		 */
		determineEventTypes: function determineEventTypes() {
				// determine the eventtype we want to set
				var types;

				// pointerEvents magic
				if(Hammer.HAS_POINTEREVENTS) {
						types = Hammer.PointerEvent.getEvents();
				}
				// on Android, iOS, blackberry, windows mobile we dont want any mouseevents
				else if(Hammer.NO_MOUSEEVENTS) {
						types = [
								'touchstart',
								'touchmove',
								'touchend touchcancel'];
				}
				// for non pointer events browsers and mixed browsers,
				// like chrome on windows8 touch laptop
				else {
						types = [
								'touchstart mousedown',
								'touchmove mousemove',
								'touchend touchcancel mouseup'];
				}

				Hammer.EVENT_TYPES[Hammer.EVENT_START]	= types[0];
				Hammer.EVENT_TYPES[Hammer.EVENT_MOVE]	 = types[1];
				Hammer.EVENT_TYPES[Hammer.EVENT_END]		= types[2];
		},


		/**
		 * create touchlist depending on the event
		 * @param	 {Object}		ev
		 * @param	 {String}		eventType	 used by the fakemultitouch plugin
		 */
		getTouchList: function getTouchList(ev/*, eventType*/) {
				// get the fake pointerEvent touchlist
				if(Hammer.HAS_POINTEREVENTS) {
						return Hammer.PointerEvent.getTouchList();
				}
				// get the touchlist
				else if(ev.touches) {
						return ev.touches;
				}
				// make fake touchlist from mouse position
				else {
						return [{
								identifier: 1,
								pageX: ev.pageX,
								pageY: ev.pageY,
								target: ev.target
						}];
				}
		},


		/**
		 * collect event data for Hammer js
		 * @param	 {HTMLElement}	 element
		 * @param	 {String}				eventType				like Hammer.EVENT_MOVE
		 * @param	 {Object}				eventData
		 */
		collectEventData: function collectEventData(element, eventType, ev) {
				var touches = this.getTouchList(ev, eventType);

				// find out pointerType
				var pointerType = Hammer.POINTER_TOUCH;
				if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
						pointerType = Hammer.POINTER_MOUSE;
				}

				return {
						center			: Hammer.utils.getCenter(touches),
						timeStamp	 : new Date().getTime(),
						target			: ev.target,
						touches		 : touches,
						eventType	 : eventType,
						pointerType : pointerType,
						srcEvent		: ev,

						/**
						 * prevent the browser default actions
						 * mostly used to disable scrolling of the browser
						 */
						preventDefault: function() {
								if(this.srcEvent.preventManipulation) {
										this.srcEvent.preventManipulation();
								}

								if(this.srcEvent.preventDefault) {
										this.srcEvent.preventDefault();
								}
						},

						/**
						 * stop bubbling the event up to its parents
						 */
						stopPropagation: function() {
								this.srcEvent.stopPropagation();
						},

						/**
						 * immediately stop gesture detection
						 * might be useful after a swipe was detected
						 * @return {*}
						 */
						stopDetect: function() {
								return Hammer.detection.stopDetect();
						}
				};
		}
};

Hammer.PointerEvent = {
		/**
		 * holds all pointers
		 * @type {Object}
		 */
		pointers: {},

		/**
		 * get a list of pointers
		 * @returns {Array}		 touchlist
		 */
		getTouchList: function() {
				var self = this;
				var touchlist = [];

				// we can use forEach since pointerEvents only is in IE10
				Object.keys(self.pointers).sort().forEach(function(id) {
						touchlist.push(self.pointers[id]);
				});
				return touchlist;
		},

		/**
		 * update the position of a pointer
		 * @param	 {String}	 type						 Hammer.EVENT_END
		 * @param	 {Object}	 pointerEvent
		 */
		updatePointer: function(type, pointerEvent) {
				if(type == Hammer.EVENT_END) {
						this.pointers = {};
				}
				else {
						pointerEvent.identifier = pointerEvent.pointerId;
						this.pointers[pointerEvent.pointerId] = pointerEvent;
				}

				return Object.keys(this.pointers).length;
		},

		/**
		 * check if ev matches pointertype
		 * @param	 {String}				pointerType		 Hammer.POINTER_MOUSE
		 * @param	 {PointerEvent}	ev
		 */
		matchType: function(pointerType, ev) {
				if(!ev.pointerType) {
						return false;
				}

				var types = {};
				types[Hammer.POINTER_MOUSE] = (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE || ev.pointerType == Hammer.POINTER_MOUSE);
				types[Hammer.POINTER_TOUCH] = (ev.pointerType == ev.MSPOINTER_TYPE_TOUCH || ev.pointerType == Hammer.POINTER_TOUCH);
				types[Hammer.POINTER_PEN] = (ev.pointerType == ev.MSPOINTER_TYPE_PEN || ev.pointerType == Hammer.POINTER_PEN);
				return types[pointerType];
		},


		/**
		 * get events
		 */
		getEvents: function() {
				return [
						'pointerdown MSPointerDown',
						'pointermove MSPointerMove',
						'pointerup pointercancel MSPointerUp MSPointerCancel'
				];
		},

		/**
		 * reset the list
		 */
		reset: function() {
				this.pointers = {};
		}
};


Hammer.utils = {
		/**
		 * extend method,
		 * also used for cloning when dest is an empty object
		 * @param	 {Object}		dest
		 * @param	 {Object}		src
	 * @parm	{Boolean}	merge		do a merge
		 * @returns {Object}		dest
		 */
		extend: function extend(dest, src, merge) {
				for (var key in src) {
			if(dest[key] !== undefined && merge) {
				continue;
			}
						dest[key] = src[key];
				}
				return dest;
		},


		/**
		 * find if a node is in the given parent
		 * used for event delegation tricks
		 * @param	 {HTMLElement}	 node
		 * @param	 {HTMLElement}	 parent
		 * @returns {boolean}			 has_parent
		 */
		hasParent: function(node, parent) {
				while(node){
						if(node == parent) {
								return true;
						}
						node = node.parentNode;
				}
				return false;
		},


		/**
		 * get the center of all the touches
		 * @param	 {Array}		 touches
		 * @returns {Object}		center
		 */
		getCenter: function getCenter(touches) {
				var valuesX = [], valuesY = [];

				for(var t= 0,len=touches.length; t<len; t++) {
						valuesX.push(touches[t].pageX);
						valuesY.push(touches[t].pageY);
				}

				return {
						pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
						pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
				};
		},


		/**
		 * calculate the velocity between two points
		 * @param	 {Number}		delta_time
		 * @param	 {Number}		delta_x
		 * @param	 {Number}		delta_y
		 * @returns {Object}		velocity
		 */
		getVelocity: function getVelocity(delta_time, delta_x, delta_y) {
				return {
						x: Math.abs(delta_x / delta_time) || 0,
						y: Math.abs(delta_y / delta_time) || 0
				};
		},


		/**
		 * calculate the angle between two coordinates
		 * @param	 {Touch}		 touch1
		 * @param	 {Touch}		 touch2
		 * @returns {Number}		angle
		 */
		getAngle: function getAngle(touch1, touch2) {
				var y = touch2.pageY - touch1.pageY,
						x = touch2.pageX - touch1.pageX;
				return Math.atan2(y, x) * 180 / Math.PI;
		},


		/**
		 * angle to direction define
		 * @param	 {Touch}		 touch1
		 * @param	 {Touch}		 touch2
		 * @returns {String}		direction constant, like Hammer.DIRECTION_LEFT
		 */
		getDirection: function getDirection(touch1, touch2) {
				var x = Math.abs(touch1.pageX - touch2.pageX),
						y = Math.abs(touch1.pageY - touch2.pageY);

				if(x >= y) {
						return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
				}
				else {
						return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
				}
		},


		/**
		 * calculate the distance between two touches
		 * @param	 {Touch}		 touch1
		 * @param	 {Touch}		 touch2
		 * @returns {Number}		distance
		 */
		getDistance: function getDistance(touch1, touch2) {
				var x = touch2.pageX - touch1.pageX,
						y = touch2.pageY - touch1.pageY;
				return Math.sqrt((x*x) + (y*y));
		},


		/**
		 * calculate the scale factor between two touchLists (fingers)
		 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
		 * @param	 {Array}		 start
		 * @param	 {Array}		 end
		 * @returns {Number}		scale
		 */
		getScale: function getScale(start, end) {
				// need two fingers...
				if(start.length >= 2 && end.length >= 2) {
						return this.getDistance(end[0], end[1]) /
								this.getDistance(start[0], start[1]);
				}
				return 1;
		},


		/**
		 * calculate the rotation degrees between two touchLists (fingers)
		 * @param	 {Array}		 start
		 * @param	 {Array}		 end
		 * @returns {Number}		rotation
		 */
		getRotation: function getRotation(start, end) {
				// need two fingers
				if(start.length >= 2 && end.length >= 2) {
						return this.getAngle(end[1], end[0]) -
								this.getAngle(start[1], start[0]);
				}
				return 0;
		},


		/**
		 * boolean if the direction is vertical
		 * @param		{String}		direction
		 * @returns	{Boolean}	 is_vertical
		 */
		isVertical: function isVertical(direction) {
				return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
		},


		/**
		 * stop browser default behavior with css props
		 * @param	 {HtmlElement}	 element
		 * @param	 {Object}				css_props
		 */
		stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
				var prop,
						vendors = ['webkit','khtml','moz','ms','o',''];

				if(!css_props || !element.style) {
						return;
				}

				// with css properties for modern browsers
				for(var i = 0; i < vendors.length; i++) {
						for(var p in css_props) {
								if(css_props.hasOwnProperty(p)) {
										prop = p;

										// vender prefix at the property
										if(vendors[i]) {
												prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
										}

										// set the style
										element.style[prop] = css_props[p];
								}
						}
				}

				// also the disable onselectstart
				if(css_props.userSelect == 'none') {
						element.onselectstart = function() {
								return false;
						};
				}
		}
};

Hammer.detection = {
		// contains all registred Hammer.gestures in the correct order
		gestures: [],

		// data of the current Hammer.gesture detection session
		current: null,

		// the previous Hammer.gesture session data
		// is a full clone of the previous gesture.current object
		previous: null,

		// when this becomes true, no gestures are fired
		stopped: false,


		/**
		 * start Hammer.gesture detection
		 * @param	 {Hammer.Instance}	 inst
		 * @param	 {Object}						eventData
		 */
		startDetect: function startDetect(inst, eventData) {
				// already busy with a Hammer.gesture detection on an element
				if(this.current) {
						return;
				}

				this.stopped = false;

				this.current = {
						inst				: inst, // reference to HammerInstance we're working for
						startEvent	: Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
						lastEvent	 : false, // last eventData
						name				: '' // current gesture we're in/detected, can be 'tap', 'hold' etc
				};

				this.detect(eventData);
		},


		/**
		 * Hammer.gesture detection
		 * @param	 {Object}		eventData
		 * @param	 {Object}		eventData
		 */
		detect: function detect(eventData) {
				if(!this.current || this.stopped) {
						return;
				}

				// extend event data with calculations about scale, distance etc
				eventData = this.extendEventData(eventData);

				// instance options
				var inst_options = this.current.inst.options;

				// call Hammer.gesture handlers
				for(var g=0,len=this.gestures.length; g<len; g++) {
						var gesture = this.gestures[g];

						// only when the instance options have enabled this gesture
						if(!this.stopped && inst_options[gesture.name] !== false) {
								// if a handler returns false, we stop with the detection
								if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
										this.stopDetect();
										break;
								}
						}
				}

				// store as previous event event
				if(this.current) {
						this.current.lastEvent = eventData;
				}

				// endevent, but not the last touch, so dont stop
				if(eventData.eventType == Hammer.EVENT_END && !eventData.touches.length-1) {
						this.stopDetect();
				}

				return eventData;
		},


		/**
		 * clear the Hammer.gesture vars
		 * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
		 * to stop other Hammer.gestures from being fired
		 */
		stopDetect: function stopDetect() {
				// clone current data to the store as the previous gesture
				// used for the double tap gesture, since this is an other gesture detect session
				this.previous = Hammer.utils.extend({}, this.current);

				// reset the current
				this.current = null;

				// stopped!
				this.stopped = true;
		},


		/**
		 * extend eventData for Hammer.gestures
		 * @param	 {Object}	 ev
		 * @returns {Object}	 ev
		 */
		extendEventData: function extendEventData(ev) {
				var startEv = this.current.startEvent;

				// if the touches change, set the new touches over the startEvent touches
				// this because touchevents don't have all the touches on touchstart, or the
				// user must place his fingers at the EXACT same time on the screen, which is not realistic
				// but, sometimes it happens that both fingers are touching at the EXACT same time
				if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
						// extend 1 level deep to get the touchlist with the touch objects
						startEv.touches = [];
						for(var i=0,len=ev.touches.length; i<len; i++) {
								startEv.touches.push(Hammer.utils.extend({}, ev.touches[i]));
						}
				}

				var delta_time = ev.timeStamp - startEv.timeStamp,
						delta_x = ev.center.pageX - startEv.center.pageX,
						delta_y = ev.center.pageY - startEv.center.pageY,
						velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y);

				Hammer.utils.extend(ev, {
						deltaTime	 : delta_time,

						deltaX			: delta_x,
						deltaY			: delta_y,

						velocityX	 : velocity.x,
						velocityY	 : velocity.y,

						distance		: Hammer.utils.getDistance(startEv.center, ev.center),
						angle			 : Hammer.utils.getAngle(startEv.center, ev.center),
						direction	 : Hammer.utils.getDirection(startEv.center, ev.center),

						scale			 : Hammer.utils.getScale(startEv.touches, ev.touches),
						rotation		: Hammer.utils.getRotation(startEv.touches, ev.touches),

						startEvent	: startEv
				});

				return ev;
		},


		/**
		 * register new gesture
		 * @param	 {Object}		gesture object, see gestures.js for documentation
		 * @returns {Array}		 gestures
		 */
		register: function register(gesture) {
				// add an enable gesture options if there is no given
				var options = gesture.defaults || {};
				if(options[gesture.name] === undefined) {
						options[gesture.name] = true;
				}

				// extend Hammer default options with the Hammer.gesture options
				Hammer.utils.extend(Hammer.defaults, options, true);

				// set its index
				gesture.index = gesture.index || 1000;

				// add Hammer.gesture to the list
				this.gestures.push(gesture);

				// sort the list by index
				this.gestures.sort(function(a, b) {
						if (a.index < b.index) {
								return -1;
						}
						if (a.index > b.index) {
								return 1;
						}
						return 0;
				});

				return this.gestures;
		}
};


Hammer.gestures = Hammer.gestures || {};

/**
 * Custom gestures
 * ==============================
 *
 * Gesture object
 * --------------------
 * The object structure of a gesture:
 *
 * { name: 'mygesture',
 *	 index: 1337,
 *	 defaults: {
 *		 mygesture_option: true
 *	 }
 *	 handler: function(type, ev, inst) {
 *		 // trigger gesture event
 *		 inst.trigger(this.name, ev);
 *	 }
 * }

 * @param	 {String}		name
 * this should be the name of the gesture, lowercase
 * it is also being used to disable/enable the gesture per instance config.
 *
 * @param	 {Number}		[index=1000]
 * the index of the gesture, where it is going to be in the stack of gestures detection
 * like when you build an gesture that depends on the drag gesture, it is a good
 * idea to place it after the index of the drag gesture.
 *
 * @param	 {Object}		[defaults={}]
 * the default settings of the gesture. these are added to the instance settings,
 * and can be overruled per instance. you can also add the name of the gesture,
 * but this is also added by default (and set to true).
 *
 * @param	 {Function}	handler
 * this handles the gesture detection of your custom gesture and receives the
 * following arguments:
 *
 *			@param	{Object}		eventData
 *			event data containing the following properties:
 *					timeStamp	 {Number}				time the event occurred
 *					target			{HTMLElement}	 target element
 *					touches		 {Array}				 touches (fingers, pointers, mouse) on the screen
 *					pointerType {String}				kind of pointer that was used. matches Hammer.POINTER_MOUSE|TOUCH
 *					center			{Object}				center position of the touches. contains pageX and pageY
 *					deltaTime	 {Number}				the total time of the touches in the screen
 *					deltaX			{Number}				the delta on x axis we haved moved
 *					deltaY			{Number}				the delta on y axis we haved moved
 *					velocityX	 {Number}				the velocity on the x
 *					velocityY	 {Number}				the velocity on y
 *					angle			 {Number}				the angle we are moving
 *					direction	 {String}				the direction we are moving. matches Hammer.DIRECTION_UP|DOWN|LEFT|RIGHT
 *					distance		{Number}				the distance we haved moved
 *					scale			 {Number}				scaling of the touches, needs 2 touches
 *					rotation		{Number}				rotation of the touches, needs 2 touches *
 *					eventType	 {String}				matches Hammer.EVENT_START|MOVE|END
 *					srcEvent		{Object}				the source event, like TouchStart or MouseDown *
 *					startEvent	{Object}				contains the same properties as above,
 *																			but from the first touch. this is used to calculate
 *																			distances, deltaTime, scaling etc
 *
 *			@param	{Hammer.Instance}		inst
 *			the instance we are doing the detection for. you can get the options from
 *			the inst.options object and trigger the gesture event by calling inst.trigger
 *
 *
 * Handle gestures
 * --------------------
 * inside the handler you can get/set Hammer.detection.current. This is the current
 * detection session. It has the following properties
 *			@param	{String}		name
 *			contains the name of the gesture we have detected. it has not a real function,
 *			only to check in other gestures if something is detected.
 *			like in the drag gesture we set it to 'drag' and in the swipe gesture we can
 *			check if the current gesture is 'drag' by accessing Hammer.detection.current.name
 *
 *			@readonly
 *			@param	{Hammer.Instance}		inst
 *			the instance we do the detection for
 *
 *			@readonly
 *			@param	{Object}		startEvent
 *			contains the properties of the first gesture detection in this session.
 *			Used for calculations about timing, distance, etc.
 *
 *			@readonly
 *			@param	{Object}		lastEvent
 *			contains all the properties of the last gesture detect in this session.
 *
 * after the gesture detection session has been completed (user has released the screen)
 * the Hammer.detection.current object is copied into Hammer.detection.previous,
 * this is usefull for gestures like doubletap, where you need to know if the
 * previous gesture was a tap
 *
 * options that have been set by the instance can be received by calling inst.options
 *
 * You can trigger a gesture event by calling inst.trigger("mygesture", event).
 * The first param is the name of your gesture, the second the event argument
 *
 *
 * Register gestures
 * --------------------
 * When an gesture is added to the Hammer.gestures object, it is auto registered
 * at the setup of the first Hammer instance. You can also call Hammer.detection.register
 * manually and pass your gesture object as a param
 *
 */

/**
 * Hold
 * Touch stays at the same place for x time
 * @events	hold
 */
Hammer.gestures.Hold = {
		name: 'hold',
		index: 10,
		defaults: {
				hold_timeout	: 500,
				hold_threshold	: 1
		},
		timer: null,
		handler: function holdGesture(ev, inst) {
				switch(ev.eventType) {
						case Hammer.EVENT_START:
								// clear any running timers
								clearTimeout(this.timer);

								// set the gesture so we can check in the timeout if it still is
								Hammer.detection.current.name = this.name;

								// set timer and if after the timeout it still is hold,
								// we trigger the hold event
								this.timer = setTimeout(function() {
										if(Hammer.detection.current.name == 'hold') {
												inst.trigger('hold', ev);
										}
								}, inst.options.hold_timeout);
								break;

						// when you move or end we clear the timer
						case Hammer.EVENT_MOVE:
								if(ev.distance > inst.options.hold_threshold) {
										clearTimeout(this.timer);
								}
								break;

						case Hammer.EVENT_END:
								clearTimeout(this.timer);
								break;
				}
		}
};


/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events	tap, doubletap
 */
Hammer.gestures.Tap = {
		name: 'tap',
		index: 100,
		defaults: {
				tap_max_touchtime	: 250,
				tap_max_distance	: 10,
		tap_always			: true,
				doubletap_distance	: 20,
				doubletap_interval	: 300
		},
		handler: function tapGesture(ev, inst) {
				if(ev.eventType == Hammer.EVENT_END) {
						// previous gesture, for the double tap since these are two different gesture detections
						var prev = Hammer.detection.previous,
				did_doubletap = false;

						// when the touchtime is higher then the max touch time
						// or when the moving distance is too much
						if(ev.deltaTime > inst.options.tap_max_touchtime ||
								ev.distance > inst.options.tap_max_distance) {
								return;
						}

						// check if double tap
						if(prev && prev.name == 'tap' &&
								(ev.timeStamp - prev.lastEvent.timeStamp) < inst.options.doubletap_interval &&
								ev.distance < inst.options.doubletap_distance) {
				inst.trigger('doubletap', ev);
				did_doubletap = true;
						}

			// do a single tap
			if(!did_doubletap || inst.options.tap_always) {
				Hammer.detection.current.name = 'tap';
				inst.trigger(Hammer.detection.current.name, ev);
			}
				}
		}
};


/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events	swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
		name: 'swipe',
		index: 40,
		defaults: {
				// set 0 for unlimited, but this can conflict with transform
				swipe_max_touches	: 1,
				swipe_velocity		 : 0.7
		},
		handler: function swipeGesture(ev, inst) {
				if(ev.eventType == Hammer.EVENT_END) {
						// max touches
						if(inst.options.swipe_max_touches > 0 &&
								ev.touches.length > inst.options.swipe_max_touches) {
								return;
						}

						// when the distance we moved is too small we skip this gesture
						// or we can be already in dragging
						if(ev.velocityX > inst.options.swipe_velocity ||
								ev.velocityY > inst.options.swipe_velocity) {
								// trigger swipe events
								inst.trigger(this.name, ev);
								inst.trigger(this.name + ev.direction, ev);
						}
				}
		}
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events	drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
		name: 'drag',
		index: 50,
		defaults: {
				drag_min_distance : 10,
				// set 0 for unlimited, but this can conflict with transform
				drag_max_touches	: 1,
				// prevent default browser behavior when dragging occurs
				// be careful with it, it makes the element a blocking element
				// when you are using the drag gesture, it is a good practice to set this true
				drag_block_horizontal	 : false,
				drag_block_vertical		 : false,
				// drag_lock_to_axis keeps the drag gesture on the axis that it started on,
				// It disallows vertical directions if the initial direction was horizontal, and vice versa.
				drag_lock_to_axis			 : false,
				// drag lock only kicks in when distance > drag_lock_min_distance
				// This way, locking occurs only when the distance has become large enough to reliably determine the direction
				drag_lock_min_distance : 25
		},
		triggered: false,
		handler: function dragGesture(ev, inst) {
				// current gesture isnt drag, but dragged is true
				// this means an other gesture is busy. now call dragend
				if(Hammer.detection.current.name != this.name && this.triggered) {
						inst.trigger(this.name +'end', ev);
						this.triggered = false;
						return;
				}

				// max touches
				if(inst.options.drag_max_touches > 0 &&
						ev.touches.length > inst.options.drag_max_touches) {
						return;
				}

				switch(ev.eventType) {
						case Hammer.EVENT_START:
								this.triggered = false;
								break;

						case Hammer.EVENT_MOVE:
								// when the distance we moved is too small we skip this gesture
								// or we can be already in dragging
								if(ev.distance < inst.options.drag_min_distance &&
										Hammer.detection.current.name != this.name) {
										return;
								}

								// we are dragging!
								Hammer.detection.current.name = this.name;

								// lock drag to axis?
								if(Hammer.detection.current.lastEvent.drag_locked_to_axis || (inst.options.drag_lock_to_axis && inst.options.drag_lock_min_distance<=ev.distance)) {
										ev.drag_locked_to_axis = true;
								}
								var last_direction = Hammer.detection.current.lastEvent.direction;
								if(ev.drag_locked_to_axis && last_direction !== ev.direction) {
										// keep direction on the axis that the drag gesture started on
										if(Hammer.utils.isVertical(last_direction)) {
												ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
										}
										else {
												ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
										}
								}

								// first time, trigger dragstart event
								if(!this.triggered) {
										inst.trigger(this.name +'start', ev);
										this.triggered = true;
								}

								// trigger normal event
								inst.trigger(this.name, ev);

								// direction event, like dragdown
								inst.trigger(this.name + ev.direction, ev);

								// block the browser events
								if( (inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
										(inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
										ev.preventDefault();
								}
								break;

						case Hammer.EVENT_END:
								// trigger dragend
								if(this.triggered) {
										inst.trigger(this.name +'end', ev);
								}

								this.triggered = false;
								break;
				}
		}
};


/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events	transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
		name: 'transform',
		index: 45,
		defaults: {
				// factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
				transform_min_scale		 : 0.01,
				// rotation in degrees
				transform_min_rotation	: 1,
				// prevent default browser behavior when two touches are on the screen
				// but it makes the element a blocking element
				// when you are using the transform gesture, it is a good practice to set this true
				transform_always_block	: false
		},
		triggered: false,
		handler: function transformGesture(ev, inst) {
				// current gesture isnt drag, but dragged is true
				// this means an other gesture is busy. now call dragend
				if(Hammer.detection.current.name != this.name && this.triggered) {
						inst.trigger(this.name +'end', ev);
						this.triggered = false;
						return;
				}

				// atleast multitouch
				if(ev.touches.length < 2) {
						return;
				}

				// prevent default when two fingers are on the screen
				if(inst.options.transform_always_block) {
						ev.preventDefault();
				}

				switch(ev.eventType) {
						case Hammer.EVENT_START:
								this.triggered = false;
								break;

						case Hammer.EVENT_MOVE:
								var scale_threshold = Math.abs(1-ev.scale);
								var rotation_threshold = Math.abs(ev.rotation);

								// when the distance we moved is too small we skip this gesture
								// or we can be already in dragging
								if(scale_threshold < inst.options.transform_min_scale &&
										rotation_threshold < inst.options.transform_min_rotation) {
										return;
								}

								// we are transforming!
								Hammer.detection.current.name = this.name;

								// first time, trigger dragstart event
								if(!this.triggered) {
										inst.trigger(this.name +'start', ev);
										this.triggered = true;
								}

								inst.trigger(this.name, ev); // basic transform event

								// trigger rotate event
								if(rotation_threshold > inst.options.transform_min_rotation) {
										inst.trigger('rotate', ev);
								}

								// trigger pinch event
								if(scale_threshold > inst.options.transform_min_scale) {
										inst.trigger('pinch', ev);
										inst.trigger('pinch'+ ((ev.scale < 1) ? 'in' : 'out'), ev);
								}
								break;

						case Hammer.EVENT_END:
								// trigger dragend
								if(this.triggered) {
										inst.trigger(this.name +'end', ev);
								}

								this.triggered = false;
								break;
				}
		}
};


/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events	touch
 */
Hammer.gestures.Touch = {
		name: 'touch',
		index: -Infinity,
		defaults: {
				// call preventDefault at touchstart, and makes the element blocking by
				// disabling the scrolling of the page, but it improves gestures like
				// transforming and dragging.
				// be careful with using this, it can be very annoying for users to be stuck
				// on the page
				prevent_default: false,

				// disable mouse events, so only touch (or pen!) input triggers events
				prevent_mouseevents: false
		},
		handler: function touchGesture(ev, inst) {
				if(inst.options.prevent_mouseevents && ev.pointerType == Hammer.POINTER_MOUSE) {
						ev.stopDetect();
						return;
				}

				if(inst.options.prevent_default) {
						ev.preventDefault();
				}

				if(ev.eventType ==	Hammer.EVENT_START) {
						inst.trigger(this.name, ev);
				}
		}
};


/**
 * Release
 * Called as last, tells the user has released the screen
 * @events	release
 */
Hammer.gestures.Release = {
		name: 'release',
		index: Infinity,
		handler: function releaseGesture(ev, inst) {
				if(ev.eventType ==	Hammer.EVENT_END) {
						inst.trigger(this.name, ev);
				}
		}
};

// node export
if(typeof module === 'object' && typeof module.exports === 'object'){
		module.exports = Hammer;
}
// just window export
else {
		window.Hammer = Hammer;

		// requireJS module definition
		if(typeof window.define === 'function' && window.define.amd) {
				window.define('hammer', [], function() {
						return Hammer;
				});
		}
}
})(this);

(function($, undefined) {
		'use strict';

		// no jQuery or Zepto!
		if($ === undefined) {
				return;
		}

		/**
		 * bind dom events
		 * this overwrites addEventListener
		 * @param	 {HTMLElement}	 element
		 * @param	 {String}				eventTypes
		 * @param	 {Function}			handler
		 */
		Hammer.event.bindDom = function(element, eventTypes, handler) {
				$(element).on(eventTypes, function(ev) {
						var data = ev.originalEvent || ev;

						// IE pageX fix
						if(data.pageX === undefined) {
								data.pageX = ev.pageX;
								data.pageY = ev.pageY;
						}

						// IE target fix
						if(!data.target) {
								data.target = ev.target;
						}

						// IE button fix
						if(data.which === undefined) {
								data.which = data.button;
						}

						// IE preventDefault
						if(!data.preventDefault) {
								data.preventDefault = ev.preventDefault;
						}

						// IE stopPropagation
						if(!data.stopPropagation) {
								data.stopPropagation = ev.stopPropagation;
						}

						handler.call(this, data);
				});
		};

		/**
		 * the methods are called by the instance, but with the jquery plugin
		 * we use the jquery event methods instead.
		 * @this		{Hammer.Instance}
		 * @return	{jQuery}
		 */
		Hammer.Instance.prototype.on = function(types, handler) {
				return $(this.element).on(types, handler);
		};
		Hammer.Instance.prototype.off = function(types, handler) {
				return $(this.element).off(types, handler);
		};


		/**
		 * trigger events
		 * this is called by the gestures to trigger an event like 'tap'
		 * @this		{Hammer.Instance}
		 * @param	 {String}		gesture
		 * @param	 {Object}		eventData
		 * @return	{jQuery}
		 */
		Hammer.Instance.prototype.trigger = function(gesture, eventData){
				var el = $(this.element);
				if(el.has(eventData.target).length) {
						el = $(eventData.target);
				}

				return el.trigger({
						type: gesture,
						gesture: eventData
				});
		};


		/**
		 * jQuery plugin
		 * create instance of Hammer and watch for gestures,
		 * and when called again you can change the options
		 * @param	 {Object}		[options={}]
		 * @return	{jQuery}
		 */
		$.fn.hammer = function(options) {
				return this.each(function() {
						var el = $(this);
						var inst = el.data('hammer');
						// start new hammer instance
						if(!inst) {
								el.data('hammer', new Hammer(this, options || {}));
						}
						// change the options
						else if(inst && options) {
								Hammer.utils.extend(inst.options, options);
						}
				});
		};

})(window.jQuery || window.Zepto);

/*NEXT PLUGIN*/
/*Selecter*/

;(function ($, window) {
	"use strict";

	var guid = 0,
		userAgent = (window.navigator.userAgent||window.navigator.vendor||window.opera),
		isFirefox = /Firefox/i.test(userAgent),
		isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(userAgent),
		isFirefoxMobile = (isFirefox && isMobile),
		$body = null;

	/**
	 * @options
	 * @param callback [function] <$.noop> "Select item callback"
	 * @param cover [boolean] <false> "Cover handle with option set"
	 * @param customClass [string] <''> "Class applied to instance"
	 * @param label [string] <''> "Label displayed before selection"
	 * @param external [boolean] <false> "Open options as links in new window"
	 * @param links [boolean] <false> "Open options as links in same window"
	 * @param trim [int] <0> "Trim options to specified length; 0 to disable”
	 */
	var options = {
		callback: $.noop,
		cover: false,
		customClass: "",
		label: "",
		external: false,
		links: false,
		trim: 0
	};

	var pub = {

		/**
		 * @method
		 * @name defaults
		 * @description Sets default plugin options
		 * @param opts [object] <{}> "Options object"
		 * @example $.selecter("defaults", opts);
		 */
		defaults: function(opts) {
			options = $.extend(options, opts || {});
			return $(this);
		},

		/**
		 * @method
		 * @name disable
		 * @description Disables target instance or option
		 * @param option [string] <null> "Target option value"
		 * @example $(".target").selecter("disable", "1");
		 */
		disable: function(option) {
			return $(this).each(function(i, input) {
				var data = $(input).next(".selecter").data("selecter");

				if (data) {
					if (typeof option !== "undefined") {
						var index = data.$items.index( data.$items.filter("[data-value=" + option + "]") );

						data.$items.eq(index).addClass("disabled");
						data.$options.eq(index).prop("disabled", true);
					} else {
						if (data.$selecter.hasClass("open")) {
							data.$selecter.find(".selecter-selected").trigger("click.selecter");
						}

						data.$selecter.addClass("disabled");
						data.$select.prop("disabled", true);
					}
				}
			});
		},

		/**
		 * @method
		 * @name enable
		 * @description Enables target instance or option
		 * @param option [string] <null> "Target option value"
		 * @example $(".target").selecter("enable", "1");
		 */
		enable: function(option) {
			return $(this).each(function(i, input) {
				var data = $(input).next(".selecter").data("selecter");

				if (data) {
					if (typeof option !== "undefined") {
						var index = data.$items.index( data.$items.filter("[data-value=" + option + "]") );
						data.$items.eq(index).removeClass("disabled");
						data.$options.eq(index).prop("disabled", false);
					} else {
						data.$selecter.removeClass("disabled");
						data.$select.prop("disabled", false);
					}
				}
			});
		},

		/**
		 * @method
		 * @name destroy
		 * @description Removes instance of plugin
		 * @example $(".target").selecter("destroy");
		 */
		destroy: function() {
			return $(this).each(function(i, input) {
				var data = $(input).next(".selecter").data("selecter");

				if (data) {
					if (data.$selecter.hasClass("open")) {
						data.$selecter.find(".selecter-selected").trigger("click.selecter");
					}

					// Scroller support
					if ($.fn.scroller !== undefined) {
						data.$selecter.find(".selecter-options").scroller("destroy");
					}

					data.$select[0].tabIndex = data.tabIndex;

					data.$select.off(".selecter")
								.removeClass("selecter-element")
								.show();

					data.$selecter.off(".selecter")
									.remove();
				}
			});
		},

		/**
		* @method
		* @name refresh
		* @description Updates instance base on target options
		* @example $(".target").selecter("refresh");
		*/
		refresh: function() {
			return $(this).each(function(i, input) {
				var data = $(input).next(".selecter").data("selecter");

				if (data) {
					var index = data.index;

					data.$allOptions = data.$select.find("option, optgroup");
					data.$options = data.$allOptions.filter("option");
					data.index = -1;

					index = data.$options.index(data.$options.filter(":selected"));

					_buildOptions(data);

					if (!data.multiple) {
						_update(index, data);
					}
				}
			});
		}
	};

	/**
	 * @method private
	 * @name _init
	 * @description Initializes plugin
	 * @param opts [object] "Initialization options"
	 */
	function _init(opts) {
		// Local options
		opts = $.extend({}, options, opts || {});

		// Check for Body
		if ($body === null) {
			$body = $("body");
		}

		// Apply to each element
		var $items = $(this);
		for (var i = 0, count = $items.length; i < count; i++) {
			_build($items.eq(i), opts);
		}
		return $items;
	}

	/**
	 * @method private
	 * @name _build
	 * @description Builds each instance
	 * @param $select [jQuery object] "Target jQuery object"
	 * @param opts [object] <{}> "Options object"
	 */
	function _build($select, opts) {
		if (!$select.hasClass("selecter-element")) {
			// EXTEND OPTIONS
			opts = $.extend({}, opts, $select.data("selecter-options"));

			if (opts.external) {
				opts.links = true;
			}

			// Build options array
			var $allOptions = $select.find("option, optgroup"),
				$options = $allOptions.filter("option"),
				$originalOption = $options.filter(":selected"),
				originalIndex = ($originalOption.length > 0) ? $options.index($originalOption) : 1,
				wrapperTag = (opts.links) ? "nav" : "div";

			if (opts.label !== "") {
				originalIndex = -1;
			}

			// Swap tab index, no more interacting with the actual select!
			opts.tabIndex = $select[0].tabIndex;
			$select[0].tabIndex = -1;

			opts.multiple = $select.prop("multiple");
			opts.disabled = $select.is(":disabled");

			// Build HTML
			var html = '<' + wrapperTag + ' class="selecter ' + opts.customClass;
			// Special case classes
			if (isMobile) {
				html += ' mobile';
			} else if (opts.cover) {
				html += ' cover';
			}
			if (opts.multiple) {
				html += ' multiple';
			} else {
				html += ' closed';
			}
			if (opts.disabled) {
				html += ' disabled';
			}
			html += '" tabindex="' + opts.tabIndex + '">';
			if (!opts.multiple) {
				html += '<span class="selecter-selected' + ((opts.label !== "") ? ' placeholder' : '') + '">';
				html += $('<span></span>').text( _trim(((opts.label !== "") ? opts.label : $originalOption.text()), opts.trim) ).html();
				html += '</span>';
			}
			html += '<div class="selecter-options">';
			html += '</div>';
			html += '</' + wrapperTag + '>';

			// Modify DOM
			$select.addClass("selecter-element")
					 .after(html);

			// Store plugin data
			var $selecter = $select.next(".selecter"),
				data = $.extend({
					$select: $select,
					$allOptions: $allOptions,
					$options: $options,
					$selecter: $selecter,
					$selected: $selecter.find(".selecter-selected"),
					$itemsWrapper: $selecter.find(".selecter-options"),
					index: -1,
					guid: guid++
				}, opts);

			_buildOptions(data);

			if (!data.multiple) {
				_update(originalIndex, data);
			}

			// Scroller support
			if ($.fn.scroller !== undefined) {
				data.$itemsWrapper.scroller();
			}

			// Bind click events
			data.$selecter.on("touchstart.selecter click.selecter", ".selecter-selected", data, _onClick)
							.on("click.selecter", ".selecter-item", data, _onSelect)
							.on("close.selecter", data, _onClose)
							.data("selecter", data);

			// Bind Blur/focus events
			//if ((!data.links && !isMobile) || isMobile) {
				data.$select.on("change.selecter", data, _onChange);

				if (!isMobile) {
					data.$selecter.on("focus.selecter", data, _onFocus)
									.on("blur.selecter", data, _onBlur);

					// handle clicks to associated labels - not on mobile
					data.$select.on("focus.selecter", data, function(e) {
						e.data.$selecter.trigger("focus");
					});
				}

			//} else {
				// Disable browser focus/blur for jump links
				//data.$select.hide();
			//}
		}
	}

	/**
	 * @method private
	 * @name _buildOptions
	 * @description Builds instance's option set
	 * @param data [object] "Instance data"
	 */
	function _buildOptions(data) {
		var html = '',
			itemTag = (data.links) ? "a" : "span",
			j = 0;

		for (var i = 0, count = data.$allOptions.length; i < count; i++) {
			var $op = data.$allOptions.eq(i);

			// Option group
			if ($op[0].tagName === "OPTGROUP") {
				html += '<span class="selecter-group';
				// Disabled groups
				if ($op.is(":disabled")) {
					html += ' disabled';
				}
				html += '">' + $op.attr("label") + '</span>';
			} else {
				var opVal = $op.val();

				if (!$op.attr("value")) {
					$op.attr("value", opVal);
				}

				html += '<' + itemTag + ' class="selecter-item';
				// Default selected value - now handles multi's thanks to @kuilkoff
				if ($op.is(':selected') && data.label === "") {
					html += ' selected';
				}
				// Disabled options
				if ($op.is(":disabled")) {
					html += ' disabled';
				}
				html += '" ';
				if (data.links) {
					html += 'href="' + opVal + '"';
				} else {
					html += 'data-value="' + opVal + '"';
				}
				html += '>' + $("<span></span>").text( _trim($op.text(), data.trim) ).html() + '</' + itemTag + '>';
				j++;
			}
		}

		data.$itemsWrapper.html(html);
		data.$items = data.$selecter.find(".selecter-item");
	}

	/**
	 * @method private
	 * @name _onClick
	 * @description Handles click to selected item
	 * @param e [object] "Event data"
	 */
	function _onClick(e) {
		e.preventDefault();
		e.stopPropagation();

		var data = e.data;

		if (!data.$select.is(":disabled")) {
			$(".selecter").not(data.$selecter).trigger("close.selecter", [data]);

			// Handle mobile, but not Firefox
			if (isMobile && !isFirefoxMobile) {
				var el = data.$select[0];
				if (window.document.createEvent) { // All
					var evt = window.document.createEvent("MouseEvents");
					evt.initMouseEvent("mousedown", false, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					el.dispatchEvent(evt);
				} else if (el.fireEvent) { // IE
					el.fireEvent("onmousedown");
				}
			} else {
				// Delegate intent
				if (data.$selecter.hasClass("closed")) {
					_onOpen(e);
				} else if (data.$selecter.hasClass("open")) {
					_onClose(e);
				}
			}
		}
	}

	/**
	 * @method private
	 * @name _onOpen
	 * @description Opens option set
	 * @param e [object] "Event data"
	 */
	function _onOpen(e) {
		e.preventDefault();
		e.stopPropagation();

		var data = e.data;

		// Make sure it's not alerady open
		if (!data.$selecter.hasClass("open")) {
			var offset = data.$selecter.offset(),
				bodyHeight = $body.outerHeight(),
				optionsHeight = data.$itemsWrapper.outerHeight(true),
				selectedOffset = (data.index >= 0) ? data.$items.eq(data.index).position() : { left: 0, top: 0 };

			// Calculate bottom of document
			if (offset.top + optionsHeight > bodyHeight) {
				data.$selecter.addClass("bottom");
			}

			data.$itemsWrapper.show();

			// Bind Events
			data.$selecter.removeClass("closed")
							.addClass("open");
			$body.on("click.selecter-" + data.guid, ":not(.selecter-options)", data, _onCloseHelper);

			_scrollOptions(data);
		}
	}

	/**
	 * @method private
	 * @name _onCloseHelper
	 * @description Determines if event target is outside instance before closing
	 * @param e [object] "Event data"
	 */
	function _onCloseHelper(e) {
		e.preventDefault();
		e.stopPropagation();

		if ($(e.currentTarget).parents(".selecter").length === 0) {
			_onClose(e);
		}
	}

	/**
	 * @method private
	 * @name _onClose
	 * @description Closes option set
	 * @param e [object] "Event data"
	 */
	function _onClose(e) {
		e.preventDefault();
		e.stopPropagation();

		var data = e.data;

		// Make sure it's actually open
		if (data.$selecter.hasClass("open")) {
			data.$itemsWrapper.hide();
			data.$selecter.removeClass("open bottom")
							.addClass("closed");

			$body.off(".selecter-" + data.guid);
		}
	}

	/**
	 * @method private
	 * @name _onSelect
	 * @description Handles option select
	 * @param e [object] "Event data"
	 */
	function _onSelect(e) {
		e.preventDefault();
		e.stopPropagation();

		var $target = $(this),
			data = e.data;

		if (!data.$select.is(":disabled")) {
			if (data.$itemsWrapper.is(":visible")) {
				// Update
				var index = data.$items.index($target);

				if (index !== data.index) {
					_update(index, data);
					_handleChange(data);
				}
			}

			if (!data.multiple) {
				// Clean up
				_onClose(e);
			}
		}
	}

	/**
	 * @method private
	 * @name _onChange
	 * @description Handles external changes
	 * @param e [object] "Event data"
	 */
	function _onChange(e, internal) {
		var $target = $(this),
			data = e.data;

		if (!internal && !data.multiple) {
			var index = data.$options.index(data.$options.filter("[value='" + _escape($target.val()) + "']"));
			_update(index, data);
			_handleChange(data);
		}
	}

	/**
	 * @method private
	 * @name _onFocus
	 * @description Handles instance focus
	 * @param e [object] "Event data"
	 */
	function _onFocus(e) {
		e.preventDefault();
		e.stopPropagation();

		var data = e.data;

		if (!data.$select.is(":disabled") && !data.multiple) {
			data.$selecter.addClass("focus")
							.on("keydown.selecter" + data.guid, data, _onKeypress);

			$(".selecter").not(data.$selecter)
							.trigger("close.selecter", [ data ]);
		}
	}

	/**
	 * @method private
	 * @name _onBlur
	 * @description Handles instance focus
	 * @param e [object] "Event data"
	 */
	function _onBlur(e, internal, two) {
		e.preventDefault();
		e.stopPropagation();

		var data = e.data;

		data.$selecter.removeClass("focus")
						.off("keydown.selecter" + data.guid + " keyup.selecter" + data.guid);

		$(".selecter").not(data.$selecter)
						.trigger("close.selecter", [ data ]);
	}

	/**
	 * @method private
	 * @name _onKeypress
	 * @description Handles instance keypress, once focused
	 * @param e [object] "Event data"
	 */
	function _onKeypress(e) {
		var data = e.data;

		if (e.keyCode === 13) {
			if (data.$selecter.hasClass("open")) {
				_onClose(e);
				_update(data.index, data);
			}
			_handleChange(data);
		} else if (e.keyCode !== 9 && (!e.metaKey && !e.altKey && !e.ctrlKey && !e.shiftKey)) {
			// Ignore modifiers & tabs
			e.preventDefault();
			e.stopPropagation();

			var total = data.$items.length - 1,
				index = (data.index < 0) ? 0 : data.index;

			// Firefox left/right support thanks to Kylemade
			if ($.inArray(e.keyCode, (isFirefox) ? [38, 40, 37, 39] : [38, 40]) > -1) {
				// Increment / decrement using the arrow keys
				index = index + ((e.keyCode === 38 || (isFirefox && e.keyCode === 37)) ? -1 : 1);

				if (index < 0) {
					index = 0;
				}
				if (index > total) {
					index = total;
				}
			} else {
				var input = String.fromCharCode(e.keyCode).toUpperCase(),
					letter,
					i;

				// Search for input from original index
				for (i = data.index + 1; i <= total; i++) {
					letter = data.$options.eq(i).text().charAt(0).toUpperCase();
					if (letter === input) {
						index = i;
						break;
					}
				}

				// If not, start from the beginning
				if (index < 0 || index === data.index) {
					for (i = 0; i <= total; i++) {
						letter = data.$options.eq(i).text().charAt(0).toUpperCase();
						if (letter === input) {
							index = i;
							break;
						}
					}
				}
			}

			// Update
			if (index >= 0) {
				_update(index, data);
				_scrollOptions(data);
			}
		}
	}

	/**
	 * @method private
	 * @name _update
	 * @description Updates instance based on new target index
	 * @param index [int] "Selected option index"
	 * @param data [object] "instance data"
	 */
	function _update(index, data) {
		var $item = data.$items.eq(index),
			isSelected = $item.hasClass("selected"),
			isDisabled = $item.hasClass("disabled");

		// Check for disabled options
		if (!isDisabled) {
			if (index === -1 && data.label !== "") {
				data.$selected.html(data.label);
			} else if (!isSelected) {
				var newLabel = $item.html(),
					newValue = $item.data("value");

				// Modify DOM
				if (data.multiple) {
					data.$options.eq(index).prop("selected", true);
				} else {
					data.$selected.html(newLabel)
									.removeClass('placeholder');
					data.$items.filter(".selected")
								 .removeClass("selected");

					data.$select[0].selectedIndex = index;
					//console.log(data.$select[0].selectedIndex, data.$options);
					data.$options.prop('selected', false).removeAttr('selected').eq(index).prop('selected', true).attr('selected', 'selected');
				}

				$item.addClass("selected");
			} else if (data.multiple) {
				data.$options.eq(index).prop("selected", null);
				$item.removeClass("selected");
			}

			if (!data.multiple) {
				// Update index
				data.index = index;
			}
		}
	}

	/**
	 * @method private
	 * @name _scrollOptions
	 * @description Scrolls options wrapper to specific option
	 * @param data [object] "Instance data"
	 */
	function _scrollOptions(data) {
		var selectedOffset = (data.index >= 0) ? data.$items.eq(data.index).position() : { left: 0, top: 0 };

		if ($.fn.scroller !== undefined) {
			data.$itemsWrapper.scroller("scroll", (data.$itemsWrapper.find(".scroller-content").scrollTop() + selectedOffset.top), 0)
								.scroller("reset");
		} else {
			data.$itemsWrapper.scrollTop( data.$itemsWrapper.scrollTop() + selectedOffset.top );
		}
	}

	/**
	 * @method private
	 * @name _handleChange
	 * @description Handles change events
	 * @param data [object] "Instance data"
	 */
	function _handleChange(data) {
		if (data.links) {
			_launch(data);
		} else {
			data.callback.call(data.$selecter, data.$select.val(), data.index);
			data.$select.trigger("change", [ true ]);
		}
	}

	/**
	 * @method private
	 * @name _launch
	 * @description Launches link
	 * @param data [object] "Instance data"
	 */
	function _launch(data) {
		//var url = (isMobile) ? data.$select.val() : data.$options.filter(":selected").attr("href");
		var url = data.$select.val();

		if (data.external) {
			// Open link in a new tab/window
			window.open(url);
		} else {
			// Open link in same tab/window
			window.location.href = url;
		}
	}

	/**
	 * @method private
	 * @name _trim
	 * @description Trims text, if specified length is greater then 0
	 * @param length [int] "Length to trim at"
	 * @param text [string] "Text to trim"
	 * @return [string] "Trimmed string"
	 */
	function _trim(text, length) {
		if (length === 0) {
			return text;
		} else {
			if (text.length > length) {
				return text.substring(0, length) + "...";
			} else {
				return text;
			}
		}
	}

	/**
	 * @method private
	 * @name _escape
	 * @description Escapes text
	 * @param text [string] "Text to escape"
	 */
	function _escape(text) {
		return text.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
	}

	$.fn.selecter = function(method) {
		if (pub[method]) {
			return pub[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return _init.apply(this, arguments);
		}
		return this;
	};

	$.selecter = function(method) {
		if (method === "defaults") {
			pub.defaults.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	};
})(jQuery, window);

/*NEXT PLUGIN*/
/*Modernizr */

;window.Modernizr=function(a,b,c){function I(){e.input=function(a){for(var b=0,c=a.length;b<c;b++)t[a[b]]=a[b]in l;return t}("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")),e.inputtypes=function(a){for(var d=0,e,f,h,i=a.length;d<i;d++)l.setAttribute("type",f=a[d]),e=l.type!=="text",e&&(l.value=m,l.style.cssText="position:absolute;visibility:hidden;",/^range$/.test(f)&&l.style.WebkitAppearance!==c?(g.appendChild(l),h=b.defaultView,e=h.getComputedStyle&&h.getComputedStyle(l,null).WebkitAppearance!=="textfield"&&l.offsetHeight!==0,g.removeChild(l)):/^(search|tel)$/.test(f)||(/^(url|email)$/.test(f)?e=l.checkValidity&&l.checkValidity()===!1:/^color$/.test(f)?(g.appendChild(l),g.offsetWidth,e=l.value!=m,g.removeChild(l)):e=l.value!=m)),s[a[d]]=!!e;return s}("search tel url email datetime date month week time datetime-local number range color".split(" "))}function G(a,b){var c=a.charAt(0).toUpperCase()+a.substr(1),d=(a+" "+p.join(c+" ")+c).split(" ");return F(d,b)}function F(a,b){for(var d in a)if(k[a[d]]!==c)return b=="pfx"?a[d]:!0;return!1}function E(a,b){return!!~(""+a).indexOf(b)}function D(a,b){return typeof a===b}function C(a,b){return B(o.join(a+";")+(b||""))}function B(a){k.cssText=a}var d="2.0.6",e={},f=!0,g=b.documentElement,h=b.head||b.getElementsByTagName("head")[0],i="modernizr",j=b.createElement(i),k=j.style,l=b.createElement("input"),m=":)",n=Object.prototype.toString,o=" -webkit- -moz- -o- -ms- -khtml- ".split(" "),p="Webkit Moz O ms Khtml".split(" "),q={svg:"http://www.w3.org/2000/svg"},r={},s={},t={},u=[],v=function(a,c,d,e){var f,h,j,k=b.createElement("div");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:i+(d+1),k.appendChild(j);f=["&shy;","<style>",a,"</style>"].join(""),k.id=i,k.innerHTML+=f,g.appendChild(k),h=c(k,a),k.parentNode.removeChild(k);return!!h},w=function(b){if(a.matchMedia)return matchMedia(b).matches;var c;v("@media "+b+" { #"+i+" { position: absolute; } }",function(b){c=(a.getComputedStyle?getComputedStyle(b,null):b.currentStyle).position=="absolute"});return c},x=function(){function d(d,e){e=e||b.createElement(a[d]||"div"),d="on"+d;var f=d in e;f||(e.setAttribute||(e=b.createElement("div")),e.setAttribute&&e.removeAttribute&&(e.setAttribute(d,""),f=D(e[d],"function"),D(e[d],c)||(e[d]=c),e.removeAttribute(d))),e=null;return f}var a={select:"input",change:"input",submit:"form",reset:"form",error:"img",load:"img",abort:"img"};return d}(),y,z={}.hasOwnProperty,A;!D(z,c)&&!D(z.call,c)?A=function(a,b){return z.call(a,b)}:A=function(a,b){return b in a&&D(a.constructor.prototype[b],c)};var H=function(c,d){var f=c.join(""),g=d.length;v(f,function(c,d){var f=b.styleSheets[b.styleSheets.length-1],h=f.cssRules&&f.cssRules[0]?f.cssRules[0].cssText:f.cssText||"",i=c.childNodes,j={};while(g--)j[i[g].id]=i[g];e.touch="ontouchstart"in a||j.touch.offsetTop===9,e.csstransforms3d=j.csstransforms3d.offsetLeft===9,e.generatedcontent=j.generatedcontent.offsetHeight>=1,e.fontface=/src/i.test(h)&&h.indexOf(d.split(" ")[0])===0},g,d)}(['@font-face {font-family:"font";src:url("https://")}',["@media (",o.join("touch-enabled),("),i,")","{#touch{top:9px;position:absolute}}"].join(""),["@media (",o.join("transform-3d),("),i,")","{#csstransforms3d{left:9px;position:absolute}}"].join(""),['#generatedcontent:after{content:"',m,'";visibility:hidden}'].join("")],["fontface","touch","csstransforms3d","generatedcontent"]);r.flexbox=function(){function c(a,b,c,d){a.style.cssText=o.join(b+":"+c+";")+(d||"")}function a(a,b,c,d){b+=":",a.style.cssText=(b+o.join(c+";"+b)).slice(0,-b.length)+(d||"")}var d=b.createElement("div"),e=b.createElement("div");a(d,"display","box","width:42px;padding:0;"),c(e,"box-flex","1","width:10px;"),d.appendChild(e),g.appendChild(d);var f=e.offsetWidth===42;d.removeChild(e),g.removeChild(d);return f},r.canvas=function(){var a=b.createElement("canvas");return!!a.getContext&&!!a.getContext("2d")},r.canvastext=function(){return!!e.canvas&&!!D(b.createElement("canvas").getContext("2d").fillText,"function")},r.webgl=function(){return!!a.WebGLRenderingContext},r.touch=function(){return e.touch},r.geolocation=function(){return!!navigator.geolocation},r.postmessage=function(){return!!a.postMessage},r.websqldatabase=function(){var b=!!a.openDatabase;return b},r.indexedDB=function(){for(var b=-1,c=p.length;++b<c;)if(a[p[b].toLowerCase()+"IndexedDB"])return!0;return!!a.indexedDB},r.hashchange=function(){return x("hashchange",a)&&(b.documentMode===c||b.documentMode>7)},r.history=function(){return!!a.history&&!!history.pushState},r.draganddrop=function(){return x("dragstart")&&x("drop")},r.websockets=function(){for(var b=-1,c=p.length;++b<c;)if(a[p[b]+"WebSocket"])return!0;return"WebSocket"in a},r.rgba=function(){B("background-color:rgba(150,255,150,.5)");return E(k.backgroundColor,"rgba")},r.hsla=function(){B("background-color:hsla(120,40%,100%,.5)");return E(k.backgroundColor,"rgba")||E(k.backgroundColor,"hsla")},r.multiplebgs=function(){B("background:url(https://),url(https://),red url(https://)");return/(url\s*\(.*?){3}/.test(k.background)},r.backgroundsize=function(){return G("backgroundSize")},r.borderimage=function(){return G("borderImage")},r.borderradius=function(){return G("borderRadius")},r.boxshadow=function(){return G("boxShadow")},r.textshadow=function(){return b.createElement("div").style.textShadow===""},r.opacity=function(){C("opacity:.55");return/^0.55$/.test(k.opacity)},r.cssanimations=function(){return G("animationName")},r.csscolumns=function(){return G("columnCount")},r.cssgradients=function(){var a="background-image:",b="gradient(linear,left top,right bottom,from(#9f9),to(white));",c="linear-gradient(left top,#9f9, white);";B((a+o.join(b+a)+o.join(c+a)).slice(0,-a.length));return E(k.backgroundImage,"gradient")},r.cssreflections=function(){return G("boxReflect")},r.csstransforms=function(){return!!F(["transformProperty","WebkitTransform","MozTransform","OTransform","msTransform"])},r.csstransforms3d=function(){var a=!!F(["perspectiveProperty","WebkitPerspective","MozPerspective","OPerspective","msPerspective"]);a&&"webkitPerspective"in g.style&&(a=e.csstransforms3d);return a},r.csstransitions=function(){return G("transitionProperty")},r.fontface=function(){return e.fontface},r.generatedcontent=function(){return e.generatedcontent},r.video=function(){var a=b.createElement("video"),c=!1;try{if(c=!!a.canPlayType){c=new Boolean(c),c.ogg=a.canPlayType('video/ogg; codecs="theora"');var d='video/mp4; codecs="avc1.42E01E';c.h264=a.canPlayType(d+'"')||a.canPlayType(d+', mp4a.40.2"'),c.webm=a.canPlayType('video/webm; codecs="vp8, vorbis"')}}catch(e){}return c},r.audio=function(){var a=b.createElement("audio"),c=!1;try{if(c=!!a.canPlayType)c=new Boolean(c),c.ogg=a.canPlayType('audio/ogg; codecs="vorbis"'),c.mp3=a.canPlayType("audio/mpeg;"),c.wav=a.canPlayType('audio/wav; codecs="1"'),c.m4a=a.canPlayType("audio/x-m4a;")||a.canPlayType("audio/aac;")}catch(d){}return c},r.localstorage=function(){try{return!!localStorage.getItem}catch(a){return!1}},r.sessionstorage=function(){try{return!!sessionStorage.getItem}catch(a){return!1}},r.webworkers=function(){return!!a.Worker},r.applicationcache=function(){return!!a.applicationCache},r.svg=function(){return!!b.createElementNS&&!!b.createElementNS(q.svg,"svg").createSVGRect},r.inlinesvg=function(){var a=b.createElement("div");a.innerHTML="<svg/>";return(a.firstChild&&a.firstChild.namespaceURI)==q.svg},r.smil=function(){return!!b.createElementNS&&/SVG/.test(n.call(b.createElementNS(q.svg,"animate")))},r.svgclippaths=function(){return!!b.createElementNS&&/SVG/.test(n.call(b.createElementNS(q.svg,"clipPath")))};for(var J in r)A(r,J)&&(y=J.toLowerCase(),e[y]=r[J](),u.push((e[y]?"":"no-")+y));e.input||I(),e.addTest=function(a,b){if(typeof a=="object")for(var d in a)A(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return;b=typeof b=="boolean"?b:!!b(),g.className+=" "+(b?"":"no-")+a,e[a]=b}return e},B(""),j=l=null,a.attachEvent&&function(){var a=b.createElement("div");a.innerHTML="<elem></elem>";return a.childNodes.length!==1}()&&function(a,b){function s(a){var b=-1;while(++b<g)a.createElement(f[b])}a.iepp=a.iepp||{};var d=a.iepp,e=d.html5elements||"abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",f=e.split("|"),g=f.length,h=new RegExp("(^|\\s)("+e+")","gi"),i=new RegExp("<(/*)("+e+")","gi"),j=/^\s*[\{\}]\s*$/,k=new RegExp("(^|[^\\n]*?\\s)("+e+")([^\\n]*)({[\\n\\w\\W]*?})","gi"),l=b.createDocumentFragment(),m=b.documentElement,n=m.firstChild,o=b.createElement("body"),p=b.createElement("style"),q=/print|all/,r;d.getCSS=function(a,b){if(a+""===c)return"";var e=-1,f=a.length,g,h=[];while(++e<f){g=a[e];if(g.disabled)continue;b=g.media||b,q.test(b)&&h.push(d.getCSS(g.imports,b),g.cssText),b="all"}return h.join("")},d.parseCSS=function(a){var b=[],c;while((c=k.exec(a))!=null)b.push(((j.exec(c[1])?"\n":c[1])+c[2]+c[3]).replace(h,"$1.iepp_$2")+c[4]);return b.join("\n")},d.writeHTML=function(){var a=-1;r=r||b.body;while(++a<g){var c=b.getElementsByTagName(f[a]),d=c.length,e=-1;while(++e<d)c[e].className.indexOf("iepp_")<0&&(c[e].className+=" iepp_"+f[a])}l.appendChild(r),m.appendChild(o),o.className=r.className,o.id=r.id,o.innerHTML=r.innerHTML.replace(i,"<$1font")},d._beforePrint=function(){p.styleSheet.cssText=d.parseCSS(d.getCSS(b.styleSheets,"all")),d.writeHTML()},d.restoreHTML=function(){o.innerHTML="",m.removeChild(o),m.appendChild(r)},d._afterPrint=function(){d.restoreHTML(),p.styleSheet.cssText=""},s(b),s(l);d.disablePP||(n.insertBefore(p,n.firstChild),p.media="print",p.className="iepp-printshim",a.attachEvent("onbeforeprint",d._beforePrint),a.attachEvent("onafterprint",d._afterPrint))}(a,b),e._version=d,e._prefixes=o,e._domPrefixes=p,e.mq=w,e.hasEvent=x,e.testProp=function(a){return F([a])},e.testAllProps=G,e.testStyles=v,e.prefixed=function(a){return G(a,"pfx")},g.className=g.className.replace(/\bno-js\b/,"")+(f?" js "+u.join(" "):"");return e}(this,this.document),function(a,b){function u(){r(!0)}a.respond={},respond.update=function(){},respond.mediaQueriesSupported=b;if(!b){var c=a.document,d=c.documentElement,e=[],f=[],g=[],h={},i=30,j=c.getElementsByTagName("head")[0]||d,k=j.getElementsByTagName("link"),l=[],m=function(){var b=k,c=b.length,d=0,e,f,g,i;for(;d<c;d++)e=b[d],f=e.href,g=e.media,i=e.rel&&e.rel.toLowerCase()==="stylesheet",!!f&&i&&!h[f]&&(!/^([a-zA-Z]+?:(\/\/)?(www\.)?)/.test(f)||f.replace(RegExp.$1,"").split("/")[0]===a.location.host?l.push({href:f,media:g}):h[f]=!0);n()},n=function(){if(l.length){var a=l.shift();s(a.href,function(b){o(b,a.href,a.media),h[a.href]=!0,n()})}},o=function(a,b,c){var d=a.match(/@media[^\{]+\{([^\{\}]+\{[^\}\{]+\})+/gi),g=d&&d.length||0,b=b.substring(0,b.lastIndexOf("/")),h=function(a){return a.replace(/(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,"$1"+b+"$2$3")},i=!g&&c,j=0,k,l,m,n,o;b.length&&(b+="/"),i&&(g=1);for(;j<g;j++){k=0,i?(l=c,f.push(h(a))):(l=d[j].match(/@media ([^\{]+)\{([\S\s]+?)$/)&&RegExp.$1,f.push(RegExp.$2&&h(RegExp.$2))),n=l.split(","),o=n.length;for(;k<o;k++)m=n[k],e.push({media:m.match(/(only\s+)?([a-zA-Z]+)(\sand)?/)&&RegExp.$2,rules:f.length-1,minw:m.match(/\(min\-width:[\s]*([\s]*[0-9]+)px[\s]*\)/)&&parseFloat(RegExp.$1),maxw:m.match(/\(max\-width:[\s]*([\s]*[0-9]+)px[\s]*\)/)&&parseFloat(RegExp.$1)})}r()},p,q,r=function(a){var b="clientWidth",h=d[b],l=c.compatMode==="CSS1Compat"&&h||c.body[b]||h,m={},n=c.createDocumentFragment(),o=k[k.length-1],s=(new Date).getTime();if(a&&p&&s-p<i)clearTimeout(q),q=setTimeout(r,i);else{p=s;for(var t in e){var u=e[t];if(!u.minw&&!u.maxw||(!u.minw||u.minw&&l>=u.minw)&&(!u.maxw||u.maxw&&l<=u.maxw))m[u.media]||(m[u.media]=[]),m[u.media].push(f[u.rules])}for(var t in g)g[t]&&g[t].parentNode===j&&j.removeChild(g[t]);for(var t in m){var v=c.createElement("style"),w=m[t].join("\n");v.type="text/css",v.media=t,v.styleSheet?v.styleSheet.cssText=w:v.appendChild(c.createTextNode(w)),n.appendChild(v),g.push(v)}j.insertBefore(n,o.nextSibling)}},s=function(a,b){var c=t();if(!!c){c.open("GET",a,!0),c.onreadystatechange=function(){c.readyState==4&&(c.status==200||c.status==304)&&b(c.responseText)};if(c.readyState==4)return;c.send()}},t=function(){var a=!1,b=[function(){return new ActiveXObject("Microsoft.XMLHTTP")},function(){return new XMLHttpRequest}],c=b.length;while(c--){try{a=b[c]()}catch(d){continue}break}return function(){return a}}();m(),respond.update=m,a.addEventListener?a.addEventListener("resize",u,!1):a.attachEvent&&a.attachEvent("onresize",u)}}(this,Modernizr.mq("only all")),function(a,b,c){function k(a){return!a||a=="loaded"||a=="complete"}function j(){var a=1,b=-1;while(p.length- ++b)if(p[b].s&&!(a=p[b].r))break;a&&g()}function i(a){var c=b.createElement("script"),d;c.src=a.s,c.onreadystatechange=c.onload=function(){!d&&k(c.readyState)&&(d=1,j(),c.onload=c.onreadystatechange=null)},m(function(){d||(d=1,j())},H.errorTimeout),a.e?c.onload():n.parentNode.insertBefore(c,n)}function h(a){var c=b.createElement("link"),d;c.href=a.s,c.rel="stylesheet",c.type="text/css";if(!a.e&&(w||r)){var e=function(a){m(function(){if(!d)try{a.sheet.cssRules.length?(d=1,j()):e(a)}catch(b){b.code==1e3||b.message=="security"||b.message=="denied"?(d=1,m(function(){j()},0)):e(a)}},0)};e(c)}else c.onload=function(){d||(d=1,m(function(){j()},0))},a.e&&c.onload();m(function(){d||(d=1,j())},H.errorTimeout),!a.e&&n.parentNode.insertBefore(c,n)}function g(){var a=p.shift();q=1,a?a.t?m(function(){a.t=="c"?h(a):i(a)},0):(a(),j()):q=0}function f(a,c,d,e,f,h){function i(){!o&&k(l.readyState)&&(r.r=o=1,!q&&j(),l.onload=l.onreadystatechange=null,m(function(){u.removeChild(l)},0))}var l=b.createElement(a),o=0,r={t:d,s:c,e:h};l.src=l.data=c,!s&&(l.style.display="none"),l.width=l.height="0",a!="object"&&(l.type=d),l.onload=l.onreadystatechange=i,a=="img"?l.onerror=i:a=="script"&&(l.onerror=function(){r.e=r.r=1,g()}),p.splice(e,0,r),u.insertBefore(l,s?null:n),m(function(){o||(u.removeChild(l),r.r=r.e=o=1,j())},H.errorTimeout)}function e(a,b,c){var d=b=="c"?z:y;q=0,b=b||"j",C(a)?f(d,a,b,this.i++,l,c):(p.splice(this.i++,0,a),p.length==1&&g());return this}function d(){var a=H;a.loader={load:e,i:0};return a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=r&&!s,u=s?l:n.parentNode,v=a.opera&&o.call(a.opera)=="[object Opera]",w="webkitAppearance"in l.style,x=w&&"async"in b.createElement("script"),y=r?"object":v||x?"img":"script",z=w?"img":y,A=Array.isArray||function(a){return o.call(a)=="[object Array]"},B=function(a){return Object(a)===a},C=function(a){return typeof a=="string"},D=function(a){return o.call(a)=="[object Function]"},E=[],F={},G,H;H=function(a){function f(a){var b=a.split("!"),c=E.length,d=b.pop(),e=b.length,f={url:d,origUrl:d,prefixes:b},g,h;for(h=0;h<e;h++)g=F[b[h]],g&&(f=g(f));for(h=0;h<c;h++)f=E[h](f);return f}function e(a,b,e,g,h){var i=f(a),j=i.autoCallback;if(!i.bypass){b&&(b=D(b)?b:b[a]||b[g]||b[a.split("/").pop().split("?")[0]]);if(i.instead)return i.instead(a,b,e,g,h);e.load(i.url,i.forceCSS||!i.forceJS&&/css$/.test(i.url)?"c":c,i.noexec),(D(b)||D(j))&&e.load(function(){d(),b&&b(i.origUrl,h,g),j&&j(i.origUrl,h,g)})}}function b(a,b){function c(a){if(C(a))e(a,h,b,0,d);else if(B(a))for(i in a)a.hasOwnProperty(i)&&e(a[i],h,b,i,d)}var d=!!a.test,f=d?a.yep:a.nope,g=a.load||a.both,h=a.callback,i;c(f),c(g),a.complete&&b.load(a.complete)}var g,h,i=this.yepnope.loader;if(C(a))e(a,0,i,0);else if(A(a))for(g=0;g<a.length;g++)h=a[g],C(h)?e(h,0,i,0):A(h)?H(h):B(h)&&b(h,i);else B(a)&&b(a,i)},H.addPrefix=function(a,b){F[a]=b},H.addFilter=function(a){E.push(a)},H.errorTimeout=1e4,b.readyState==null&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",G=function(){b.removeEventListener("DOMContentLoaded",G,0),b.readyState="complete"},0)),a.yepnope=d()}(this,this.document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))};

/*NEXT PLUGIN*/
/* Mouse wheel plugin */

(function (factory) {
		if ( typeof define === 'function' && define.amd ) {
				// AMD. Register as an anonymous module.
				define(['jquery'], factory);
		} else if (typeof exports === 'object') {
				// Node/CommonJS style for Browserify
				module.exports = factory;
		} else {
				// Browser globals
				factory(jQuery);
		}
}(function ($) {

		var toFix	= ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
				toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
										['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
				slice	= Array.prototype.slice,
				nullLowestDeltaTimeout, lowestDelta;

		if ( $.event.fixHooks ) {
				for ( var i = toFix.length; i; ) {
						$.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
				}
		}

		var special = $.event.special.mousewheel = {
				version: '3.1.9',

				setup: function() {
						if ( this.addEventListener ) {
								for ( var i = toBind.length; i; ) {
										this.addEventListener( toBind[--i], handler, false );
								}
						} else {
								this.onmousewheel = handler;
						}
						// Store the line height and page height for this particular element
						$.data(this, 'mousewheel-line-height', special.getLineHeight(this));
						$.data(this, 'mousewheel-page-height', special.getPageHeight(this));
				},

				teardown: function() {
						if ( this.removeEventListener ) {
								for ( var i = toBind.length; i; ) {
										this.removeEventListener( toBind[--i], handler, false );
								}
						} else {
								this.onmousewheel = null;
						}
				},

				getLineHeight: function(elem) {
						return parseInt($(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']().css('fontSize'), 10);
				},

				getPageHeight: function(elem) {
						return $(elem).height();
				},

				settings: {
						adjustOldDeltas: true
				}
		};

		$.fn.extend({
				mousewheel: function(fn) {
						return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
				},

				unmousewheel: function(fn) {
						return this.unbind('mousewheel', fn);
				}
		});


		function handler(event) {
				var orgEvent	 = event || window.event,
						args			 = slice.call(arguments, 1),
						delta			= 0,
						deltaX		 = 0,
						deltaY		 = 0,
						absDelta	 = 0;
				event = $.event.fix(orgEvent);
				event.type = 'mousewheel';

				// Old school scrollwheel delta
				if ( 'detail'			in orgEvent ) { deltaY = orgEvent.detail * -1;			}
				if ( 'wheelDelta'	in orgEvent ) { deltaY = orgEvent.wheelDelta;			 }
				if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;			}
				if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

				// Firefox < 17 horizontal scrolling related to DOMMouseScroll event
				if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
						deltaX = deltaY * -1;
						deltaY = 0;
				}

				// Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
				delta = deltaY === 0 ? deltaX : deltaY;

				// New school wheel delta (wheel event)
				if ( 'deltaY' in orgEvent ) {
						deltaY = orgEvent.deltaY * -1;
						delta	= deltaY;
				}
				if ( 'deltaX' in orgEvent ) {
						deltaX = orgEvent.deltaX;
						if ( deltaY === 0 ) { delta	= deltaX * -1; }
				}

				// No change actually happened, no reason to go any further
				if ( deltaY === 0 && deltaX === 0 ) { return; }

				// Need to convert lines and pages to pixels if we aren't already in pixels
				// There are three delta modes:
				//	 * deltaMode 0 is by pixels, nothing to do
				//	 * deltaMode 1 is by lines
				//	 * deltaMode 2 is by pages
				if ( orgEvent.deltaMode === 1 ) {
						var lineHeight = $.data(this, 'mousewheel-line-height');
						delta	*= lineHeight;
						deltaY *= lineHeight;
						deltaX *= lineHeight;
				} else if ( orgEvent.deltaMode === 2 ) {
						var pageHeight = $.data(this, 'mousewheel-page-height');
						delta	*= pageHeight;
						deltaY *= pageHeight;
						deltaX *= pageHeight;
				}

				// Store lowest absolute delta to normalize the delta values
				absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

				if ( !lowestDelta || absDelta < lowestDelta ) {
						lowestDelta = absDelta;

						// Adjust older deltas if necessary
						if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
								lowestDelta /= 40;
						}
				}

				// Adjust older deltas if necessary
				if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
						// Divide all the things by 40!
						delta	/= 40;
						deltaX /= 40;
						deltaY /= 40;
				}

				// Get a whole, normalized value for the deltas
				delta	= Math[ delta	>= 1 ? 'floor' : 'ceil' ](delta	/ lowestDelta);
				deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
				deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

				// Add information to the event object
				event.deltaX = deltaX;
				event.deltaY = deltaY;
				event.deltaFactor = lowestDelta;
				// Go ahead and set deltaMode to 0 since we converted to pixels
				// Although this is a little odd since we overwrite the deltaX/Y
				// properties with normalized deltas.
				event.deltaMode = 0;

				// Add event and delta to the front of the arguments
				args.unshift(event, delta, deltaX, deltaY);

				// Clearout lowestDelta after sometime to better
				// handle multiple device types that give different
				// a different lowestDelta
				// Ex: trackpad = 3 and mouse wheel = 120
				if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
				nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

				return ($.event.dispatch || $.event.handle).apply(this, args);
		}

		function nullLowestDelta() {
				lowestDelta = null;
		}

		function shouldAdjustOldDeltas(orgEvent, absDelta) {
				// If this is an older event and the delta is divisable by 120,
				// then we are assuming that the browser is treating this as an
				// older mouse wheel event and that we should divide the deltas
				// by 40 to try and get a more usable deltaFactor.
				// Side note, this actually impacts the reported scroll distance
				// in older browsers and can cause scrolling to be slower than native.
				// Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
				return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
		}

}));
