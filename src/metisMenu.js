(function ($) {
	'use strict';

	function transitionEnd() {
		var el = document.createElement('mm');

		var transEndEventNames = {
			WebkitTransition: 'webkitTransitionEnd',
			MozTransition: 'transitionend',
			OTransition: 'oTransitionEnd otransitionend',
			transition: 'transitionend'
		};

		for (var name in transEndEventNames) {
			if (el.style[name] !== undefined) {
				return {
					end: transEndEventNames[name]
				};
			}
		}
		return false;
	}

	$.fn.emulateTransitionEnd = function (duration) {
		var called = false;
		var $el = this;
		$(this).one('mmTransitionEnd', function () {
			called = true;
		});
		var callback = function () {
			if (!called) {
				$($el).trigger($transition.end);
			}
		};
		setTimeout(callback, duration);
		return this;
	};

	var $transition = transitionEnd();
	if (!!$transition) {
		$.event.special.mmTransitionEnd = {
			bindType: $transition.end,
			delegateType: $transition.end,
			handle: function (e) {
				if ($(e.target).is(this)) {
					return e.
					handleObj.
					handler.
					apply(this, arguments);
				}
			}
		};
	}

	var MetisMenu = function (element, options) {
		this.$element = $(element);
		this.options = $.extend({}, MetisMenu.DEFAULTS, options);
		this.transitioning = null;

		this.init();
	};

	MetisMenu.TRANSITION_DURATION = 350;

	MetisMenu.DEFAULTS = {
		toggle: true,
		doubleTapToGo: false,
		activeClass: 'active',
		collapseClass: 'collapse',
		collapseInClass: 'in',
		collapsingClass: 'collapsing'
	};

	MetisMenu.prototype.init = function () {
		var $this = this;
		var activeClass = this.options.activeClass;
		var collapseClass = this.options.collapseClass;
		var collapseInClass = this.options.collapseInClass;
		var $source = this.options.source;
		
		//draw elements from json menu [https://github.com/MarceloLaraBA/metisMenu]
		if ($source && $source.length !== 0) {
			this.buildMenu($this.$element);
		}

		this
		  .$element
		  .find('li.' + activeClass)
		  .has('ul')
		  .children('ul')
		  .attr('aria-expanded', true)
		  .addClass(collapseClass + ' ' + collapseInClass);

		this
		  .$element
		  .find('li')
		  .not('.' + activeClass)
		  .has('ul')
		  .children('ul')
		  .attr('aria-expanded', false)
		  .addClass(collapseClass);

		//add the 'doubleTapToGo' class to active items if needed
		if (this.options.doubleTapToGo) {
			this
			  .$element
			  .find('li.' + activeClass)
			  .has('ul')
			  .children('a')
			  .addClass('doubleTapToGo');
		}

		this
		  .$element
		  .find('li')
		  .has('ul')
		  .children('a')
		  .on('click.metisMenu', function (e) {
		  	var self = $(this);
		  	var $parent = self.parent('li');
		  	var $list = $parent.children('ul');
		  	e.preventDefault();

		  	if ($parent.hasClass(activeClass) && !$this.options.doubleTapToGo) {
		  		$this.hide($list);
		  		self.attr('aria-expanded', false);
		  	} else {
		  		$this.show($list);
		  		self.attr('aria-expanded', true);
		  	}

		  	//Do we need to enable the double tap
		  	if ($this.options.doubleTapToGo) {
		  		//if we hit a second time on the link and the href is valid, navigate to that url
		  		if ($this.doubleTapToGo(self) && self.attr('href') !== '#' && self.attr('href') !== '') {
		  			e.stopPropagation();
		  			document.location = self.attr('href');
		  			return;
		  		}
		  	}
		  });
	};

	MetisMenu.prototype.doubleTapToGo = function (elem) {
		var $this = this.$element;
		//if the class 'doubleTapToGo' exists, remove it and return
		if (elem.hasClass('doubleTapToGo')) {
			elem.removeClass('doubleTapToGo');
			return true;
		}
		//does not exists, add a new class and return false
		if (elem.parent().children('ul').length) {
			//first remove all other class
			$this
			  .find('.doubleTapToGo')
			  .removeClass('doubleTapToGo');
			//add the class on the current element
			elem.addClass('doubleTapToGo');
			return false;
		}
	};

	MetisMenu.prototype.show = function (el) {
		var activeClass = this.options.activeClass;
		var collapseClass = this.options.collapseClass;
		var collapseInClass = this.options.collapseInClass;
		var collapsingClass = this.options.collapsingClass;
		var $this = $(el);
		var $parent = $this.parent('li');
		if (this.transitioning || $this.hasClass(collapseInClass)) {
			return;
		}

		$parent.addClass(activeClass);

		if (this.options.toggle) {
			this.hide($parent.siblings().children('ul.' + collapseInClass).attr('aria-expanded', false));
		}

		$this
		  .removeClass(collapseClass)
		  .addClass(collapsingClass)
		  .height(0);

		this.transitioning = 1;
		var complete = function () {
			$this
			  .removeClass(collapsingClass)
			  .addClass(collapseClass + ' ' + collapseInClass)
			  .height('')
			  .attr('aria-expanded', true);
			this.transitioning = 0;
		};
		if (!$transition) {
			return complete.call(this);
		}
		$this
		  .one('mmTransitionEnd', $.proxy(complete, this))
		  .emulateTransitionEnd(MetisMenu.TRANSITION_DURATION)
		  .height($this[0].scrollHeight);
	};

	MetisMenu.prototype.hide = function (el) {
		var activeClass = this.options.activeClass;
		var collapseClass = this.options.collapseClass;
		var collapseInClass = this.options.collapseInClass;
		var collapsingClass = this.options.collapsingClass;
		var $this = $(el);

		if (this.transitioning || !$this.hasClass(collapseInClass)) {
			return;
		}

		$this.parent('li').removeClass(activeClass);
		$this.height($this.height())[0].offsetHeight;

		$this
		  .addClass(collapsingClass)
		  .removeClass(collapseClass)
		  .removeClass(collapseInClass);

		this.transitioning = 1;

		var complete = function () {
			this.transitioning = 0;
			$this
			  .removeClass(collapsingClass)
			  .addClass(collapseClass)
			  .attr('aria-expanded', false);
		};

		if (!$transition) {
			return complete.call(this);
		}
		$this
		  .height(0)
		  .one('mmTransitionEnd', $.proxy(complete, this))
		  .emulateTransitionEnd(MetisMenu.TRANSITION_DURATION);
	};

	MetisMenu.prototype.buildMenu = function($elem) { //https://github.com/MarceloLaraBA/metisMenu
		var $this = this;
		console.log($elem);
		$.each(this.options.source.menu, function () {
			$elem.append($this.loadMenu(this, $this));
		});
	};

	MetisMenu.prototype.loadMenu = function(menuItem, ref, level) { //https://github.com/MarceloLaraBA/metisMenu
		// create link
		var $a = $("<a>", { href: menuItem.link, html: ((menuItem.icon) ? " " : "") + menuItem.name });

		// add icon
		if (menuItem.icon) {
			$a.prepend($("<i>").addClass("fa " + menuItem.icon));
		}

		// place link
		var $li = $("<li>").append($a);
		if (menuItem.items) {
			// append arrow
			$a.append($("<span>").addClass("fa arrow"));
			// create list
			var $ul = $("<ul>");
			// define level
			if (level == undefined) level = 2;
			else level++;
			// iterate inner items
			$.each(menuItem.items, function() {
				$ul.append(ref.loadMenu(this, ref, level));
			});
			// set level class
			switch (level) {
				case 2: $ul.addClass("nav nav-second-level"); break;
				case 3: $ul.addClass("nav nav-third-level"); break;
			}
			// append inner menu
			$li.append($ul);
		}
		return $li;
	};

	function Plugin(option) {
		return this.each(function () {
			var $this = $(this);
			var data = $this.data('mm');
			var options = $.extend({},
			  MetisMenu.DEFAULTS,
			  $this.data(),
			  typeof option === 'object' && option
			);

			if (!data) {
				$this.data('mm', (data = new MetisMenu(this, options)));
			}
			if (typeof option === 'string') {
				data[option]();
			}
		});
	}

	var old = $.fn.metisMenu;

	$.fn.metisMenu = Plugin;
	$.fn.metisMenu.Constructor = MetisMenu;

	$.fn.metisMenu.noConflict = function () {
		$.fn.metisMenu = old;
		return this;
	};

})(jQuery);