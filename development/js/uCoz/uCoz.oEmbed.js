this.uCoz = (function(uCoz) {
	'use strict';
	
	var globalContext = this;
	
	
	var oEmbed = {
		internal: {
			resolverURL: '/panel/api/oembed.json'
		}
	};
	
	
	oEmbed.resolverURL = function(resolverURL) {
		if( !resolverURL ) {
			return this.internal.resolverURL;
		};
		this.internal.resolverURL = resolverURL;
		return this;
	};
	
	
	oEmbed.lookup = function(url) {
		var resolverURL = uCoz.URL.instance(this.resolverURL());
		resolverURL.query().url = url;
		return $.get(resolverURL.toString());
	};
	
	
	oEmbed.convertToVideoModuleData = function(resp) {
		var videoData = {};
		
		var duration;
		if( resp.oembed.provider == 'youtube' && resp.oembed.data.meta && resp.oembed.data.meta.duration ) {
			duration = /(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)/i.exec(resp.oembed.data.meta.duration);
			if( duration ) {
				duration = {
					hours   : parseInt(duration[1] || 0),
					minutes : parseInt(duration[2] || 0),
					seconds : parseInt(duration[3] || 0)
				};
			};
		} else if( resp.oembed.provider == 'vimeo' && resp.oembed.data.duration ) {
			duration = new Date(resp.oembed.data.duration * 1000);
			duration = {
				hours: duration.getUTCHours(),
				minutes: duration.getUTCMinutes(),
				seconds: duration.getUTCSeconds()
			};
		};
		
		videoData.brief = resp.oembed.data.description || ( resp.oembed.data.meta ? resp.oembed.data.meta.description : '' ) || resp.oembed.data.title || '';
		videoData.title = resp.oembed.data.title;
		videoData.year = '2014';
		videoData.genre = '';
		videoData.producer = '';
		videoData.acters = '';
		videoData.language = '';
		videoData.duration_hours   = duration && duration.hours   ? duration && duration.hours   : 0;
		videoData.duration_minutes = duration && duration.minutes ? duration && duration.minutes : 0;
		videoData.duration_seconds = duration && duration.seconds ? duration && duration.seconds : 0;
		videoData.screenshots = resp.oembed.data.thumbnail_url;
		videoData.vquality = '';
		videoData.screen = '';
		videoData.scrsize = '';
		videoData.aname = resp.oembed.data.author_name;
		videoData.aemail = '';
		videoData.asite = resp.oembed.data.author_url;
		videoData.embobject = resp.oembed.data.html;
		videoData.gwidth = resp.oembed.data.width;
		videoData.gheight = resp.oembed.data.height;
		videoData.hgu_title = '';
		videoData.meta_title = resp.oembed.data.title;
		videoData.meta_dscr = resp.oembed.data.title;
		
		return videoData;
	};
	
	
	uCoz.oEmbed = oEmbed; uCoz.oEmbed.dependencies = ['URL'];
	
	return uCoz;
}).call(this, this.uCoz || {});
