;(function($) {
  $.fn.poppy = function(options) {
    return this.each(function() {
      var container = $(this),
        jqueryCookieAvailable = jQuery.cookie != undefined;
      if (container.data('poppy.opts'))
        return; // already initialized
      if (options && options.cookie == true && !jqueryCookieAvailable) {
         $.fn.poppy.log(' jQuery cookie plugin required if cookie parameter is set to true');
      }
      if (options && !options.id && options.cookie == true) {
         $.fn.poppy.log(' must pass parameter id, if cookie parameter is set to true');
         return;
      }
      var opts = $.extend({}, $.fn.poppy.defaults, options || {}); 
      opts.API = $.extend ({_container: container}, $.fn.poppy.API );
      opts.API.log = $.fn.poppy.log;
      opts.API.trigger = function( eventName, args ) {
         opts.API._container.trigger(eventName, args);
         return opts.API;
      };
      opts.factory = $.fn.poppy.factory;
      // Check for jquery cookie
      opts.jqueryCookieAvailable = jqueryCookieAvailable;
      container.data('poppy.opts', opts );
      container.data('poppy.API', opts.API );
      opts.needsPopup = opts.API.needsPopup();
      // Only initialize if cookie mode is on and element needs a cookie or cookie mode is off
      // and open will be triggered manually.
      if ((opts.needsPopup == true && opts.cookie == true) || opts.cookie == false) {
        opts.API.init();
      }
    });
  }
  // API to be exposed via command section
  $.fn.poppy.API = {
    opts: function() {
      return this._container.data('poppy.opts');
    },
    init: function() {
      var _this = this,
      opts = this.opts(),
      // Factory out elements
      el = this._el = opts.factory.screen(),
      outerWrapper = opts.factory.wrapper().appendTo(el),
      wrapper = opts.factory.content().appendTo(outerWrapper);
      el.addClass(opts.wrapperClasses.join(' '));
      // Size screen to parent's height
      el.height($(this._container).outerHeight());
      // Add content
      wrapper.append(opts.content);
      // If we have a close button make one.
      if (opts.close == true) {
        var close = opts.factory.close().on('click', function(e) {
          opts.API.close();
          e.preventDefault();
        });
        close.appendTo(wrapper);
      }
      $(this._container).append(el);
      // Hide Wrapper initially
      el.hide();
      if (opts.needsPopup == true) {
        opts.API.open();
      }
    },
    open: function() {
      var opts = this.opts();
      opts.API._el.show();
      opts.API.trigger('poppy-show', [opts, opts.API]);
    },
    close: function() {
      var opts = this.opts();
      opts.API._el.hide();
      opts.API.setCookie();
      opts.API.trigger('poppy-close', [opts, opts.API]);
    },
    content: function(content) {
      var $wrapper = this._container.find('.poppy-wrapper-content');
      $wrapper.find(':not(.poppy-close)').remove();
      $wrapper.prepend(content);
    },
    needsPopup: function() {
      var opts = this.opts();
      if (opts.jqueryCookieAvailable) {
        if (opts.cookie == true) {
          var cookieId = "poppy-" + opts.id,
          date = $.cookie(cookieId);
          if (!date || opts.cookieLife == false)
            return true; 
          if ((new Date().getTime() - date) > (opts.cookieLife * 86400000)) 
            return true;
        }
      }
      return false;
    },
    setCookie: function() {
      var opts = this.opts();
      if (opts.jqueryCookieAvailable) {
        var opts = this.opts(),
          cookieId = "poppy-" + opts.id;
        $.cookie(cookieId, new Date().getTime(), {expires: opts.cookieLife, path: opts.cookiePath });
      }
    }
  };
  $.fn.poppy.defaults = {
    id: "",
    content: "",
    close: true,
    cookie: false,
    cookieLife: 7,
    cookiePath: "/",
    wrapperClasses: [] 
  }
  $.fn.poppy.log = function log() {
    if (window.console && console.log)
        console.log('[poppy] ' + Array.prototype.join.call(arguments, ' ') );
  };
  $.fn.poppy.factory = {
    close: function() {
      return $('<a/>').addClass('poppy-close').attr('href', '#').text('x');
    },
    wrapper: function() {
      return $('<div/>').addClass('poppy-wrapper');
    },
    content: function() {
      return $('<div/>').addClass('poppy-wrapper-content');
    },
    screen: function() {
      return $('<div/>').addClass('poppy-screen');
    }
  };
})(jQuery);
// Command module
;(function($) {
  var poppy = $.fn.poppy;
  $.fn.poppy = function(options) {
    var cmd, cmdFn, opts;
    var args = $.makeArray(arguments);
    if ($.type(options) == 'string') {
      return this.each(function() {
        opts = $(this).data('poppy.opts');
        if (opts === undefined) {
          poppy.log(" must be initialized before sending commands.");
          return;
        }
        cmd = options;
        cmdFn = opts.API[cmd];
        if ($.isFunction(cmdFn)) {
          cmdArgs = $.makeArray(args);
          cmdArgs.shift();
          return cmdFn.apply(opts.API, cmdArgs);
        }
        else {
          poppy.log(' unknown command: ', cmd );
        }
      });
    }
    else {
      poppy.call(this, options);
    }
    return this;
  }
  $.extend($.fn.poppy, poppy);
})(jQuery);
