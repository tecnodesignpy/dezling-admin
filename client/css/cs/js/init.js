/** *************Init JS*********************
	
    TABLE OF CONTENTS
	---------------------------
	1.Ready function
	2.Load function
	3.Subscribe JS
	4.Full height function
	5.Resize function
	6.Beavis function
	7.click function
	8.Placehoder ie9
	9.Photoswipe init
 ** ***************************************/
 
 "use strict"; 

/*****Ready function start*****/
$(document).ready(function(){
  beavis();
  $('.la-anim-1').addClass('la-animate');
  $('body').niceScroll({cursorcolor:"#000"});
	
});
/*****Ready function end*****/

/*****Load function start*****/
$(window).load(function(){
	$(".preloader-it").delay(500).fadeOut("slow");
	setTimeout(function(){
		$(".ani-wrap .animated").addClass("slideInUp");
		$(".social-icons.animated").addClass("fadeInLeft");
	},300);
});
/*****Load function* end*****/

/***** Subscribe JS start *****/
$("#notifyMe").notifyMe(); 
/***** Subscribe JS end*****/

/***** Full height function start *****/
var setHeight = function () {
	var height = $(window).height();
	$('.full-height').css('min-height', (height));
};
/***** Full height function end *****/

/***** Resize function start *****/
$(window).on("resize", function () {
	setHeight();
	var width = $(window).width();
	if(width <= 1024) {
		$("#parallax_it").insertAfter($("header.logo"));
	}
	else 
		{
		$("#parallax_it").appendTo($(".side-left"));
	}
}).resize();
/***** Resize function end *****/

/***** Beavis function start *****/
function beavis(){
	/*parallaxify JS*/
	$.parallaxify({
		positionProperty: 'transform',
		responsive: true,
		motionType: 'natural',
		mouseMotionType: 'performance',
		motionAngleX: 70,
		motionAngleY: 70,
		alphaFilter: 0.5,
		adjustBasePosition: true,
		alphaPosition: 0.025,
	});
	
	/*click functions*/
	$(".notify-btn").on('click', function(){
		$(this).fadeOut('slow');
		setTimeout(function(){
			$('.notify-wrap').fadeIn('slow');
		},800);
	});
	$("#notify_close").on('click', function(){
		$('.notify-wrap').fadeOut('slow');
		setTimeout(function(){
			$('.notify-btn').fadeIn('slow');
		},800);	
	});
	
	var target = $('#splitlayout');
	$(".about div").on('click', function(){
		if ( target.hasClass('reset-layout') ) {
			target.removeClass('close-right');
			target.addClass('open-left');
			target.removeClass('close-left');
			$('.page-left .animated').addClass('fadeInLeft');
			target.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', 
			function() {
				target.removeClass('reset-layout')
			}); 
		 }
		else if ( target.hasClass('open-left') ) {
			target.removeClass('reset-layout');
			target.removeClass('open-left');
			target.addClass('close-left');
			$('.page-left .animated').removeClass('fadeInLeft');
			target.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', 
			function() {
				target.addClass('reset-layout')
			});
		}
		$('.side-left .call-to-action.about .goto-close').toggleClass('opacity-hide');
		$('.call-to-action .goto-next').toggleClass('opacity-hide');
	});
	
	$(".contact div").on('click', function(){
		
		if ( target.hasClass('reset-layout') ) {
			target.addClass('open-right');
			target.removeClass('close-right');
			target.removeClass('close-left');
			$('.page-right .animated').addClass('fadeInRight');
			target.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', 
			function() {
				target.removeClass('reset-layout')
			}); 
		 }
		else if ( target.hasClass('open-right') ) {
			target.removeClass('reset-layout');
			target.removeClass('open-right');
			target.addClass('close-right');
			$('.page-right .animated').removeClass('fadeInRight');
			target.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', 
			function() {
				target.addClass('reset-layout')
			});
		}
		$('.call-to-action .goto-next').toggleClass('opacity-hide');
		$('.side-right .call-to-action .goto-close').toggleClass('opacity-hide');
	});
}
/***** Beavis function end *****/

/***** Placehoder ie9 start*****/
$('input[type=text], textarea').placeholder();
/***** Placehoder ie9 end*****/	

/***** Photoswipe init start*****/	
	var initPhotoSwipeFromDOM = function(gallerySelector) {

		// parse slide data (url, title, size ...) from DOM elements 
		// (children of gallerySelector)
		var parseThumbnailElements = function(el) {
			var thumbElements = el.childNodes,
				numNodes = thumbElements.length,
				items = [],
				figureEl,
				linkEl,
				size,
				item;

			for(var i = 0; i < numNodes; i++) {

				figureEl = thumbElements[i]; // <figure> element

				// include only element nodes 
				if(figureEl.nodeType !== 1) {
					continue;
				}

				linkEl = figureEl.children[0]; // <a> element

				size = linkEl.getAttribute('data-size').split('x');

				// create slide object
				item = {
					src: linkEl.getAttribute('href'),
					w: parseInt(size[0], 10),
					h: parseInt(size[1], 10)
				};



				if(figureEl.children.length > 1) {
					// <figcaption> content
					item.title = figureEl.children[1].innerHTML; 
				}

				if(linkEl.children.length > 0) {
					// <img> thumbnail element, retrieving thumbnail url
					item.msrc = linkEl.children[0].getAttribute('src');
				} 

				item.el = figureEl; // save link to element for getThumbBoundsFn
				items.push(item);
			}

			return items;
		};

		// find nearest parent element
		var closest = function closest(el, fn) {
			return el && ( fn(el) ? el : closest(el.parentNode, fn) );
		};

		// triggers when user clicks on thumbnail
		var onThumbnailsClick = function(e) {
			e = e || window.event;
			e.preventDefault ? e.preventDefault() : e.returnValue = false;

			var eTarget = e.target || e.srcElement;

			// find root element of slide
			var clickedListItem = closest(eTarget, function(el) {
				return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
			});

			if(!clickedListItem) {
				return;
			}

			// find index of clicked item by looping through all child nodes
			// alternatively, you may define index via data- attribute
			var clickedGallery = clickedListItem.parentNode,
				childNodes = clickedListItem.parentNode.childNodes,
				numChildNodes = childNodes.length,
				nodeIndex = 0,
				index;

			for (var i = 0; i < numChildNodes; i++) {
				if(childNodes[i].nodeType !== 1) { 
					continue; 
				}

				if(childNodes[i] === clickedListItem) {
					index = nodeIndex;
					break;
				}
				nodeIndex++;
			}



			if(index >= 0) {
				// open PhotoSwipe if valid index found
				openPhotoSwipe( index, clickedGallery );
			}
			return false;
		};

		// parse picture index and gallery index from URL (#&pid=1&gid=2)
		var photoswipeParseHash = function() {
			var hash = window.location.hash.substring(1),
			params = {};

			if(hash.length < 5) {
				return params;
			}

			var vars = hash.split('&');
			for (var i = 0; i < vars.length; i++) {
				if(!vars[i]) {
					continue;
				}
				var pair = vars[i].split('=');  
				if(pair.length < 2) {
					continue;
				}           
				params[pair[0]] = pair[1];
			}

			if(params.gid) {
				params.gid = parseInt(params.gid, 10);
			}

			return params;
		};

		var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
			var pswpElement = document.querySelectorAll('.pswp')[0],
				gallery,
				options,
				items;

			items = parseThumbnailElements(galleryElement);

			// define options (if needed)
			options = {

				// define gallery index (for URL)
				galleryUID: galleryElement.getAttribute('data-pswp-uid'),

				getThumbBoundsFn: function(index) {
					// See Options -> getThumbBoundsFn section of documentation for more info
					var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
						pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
						rect = thumbnail.getBoundingClientRect(); 

					return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
				}

			};

			// PhotoSwipe opened from URL
			if(fromURL) {
				if(options.galleryPIDs) {
					// parse real index when custom PIDs are used 
					// http://photoswipe.com/documentation/faq.html#custom-pid-in-url
					for(var j = 0; j < items.length; j++) {
						if(items[j].pid == index) {
							options.index = j;
							break;
						}
					}
				} else {
					// in URL indexes start from 1
					options.index = parseInt(index, 10) - 1;
				}
			} else {
				options.index = parseInt(index, 10);
			}

			// exit if index not found
			if( isNaN(options.index) ) {
				return;
			}

			if(disableAnimation) {
				options.showAnimationDuration = 0;
			}

			// Pass data to PhotoSwipe and initialize it
			gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
			gallery.init();
		};

		// loop through all gallery elements and bind events
		var galleryElements = document.querySelectorAll( gallerySelector );

		for(var i = 0, l = galleryElements.length; i < l; i++) {
			galleryElements[i].setAttribute('data-pswp-uid', i+1);
			galleryElements[i].onclick = onThumbnailsClick;
		}

		// Parse URL and open gallery if it contains #&pid=3&gid=1
		var hashData = photoswipeParseHash();
		if(hashData.pid && hashData.gid) {
			openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
		}
	};

	// execute above function
	initPhotoSwipeFromDOM('.project-gallery');
/***** Photoswipe init end*****/		
