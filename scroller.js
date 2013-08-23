/*!
 * Scroller.js
 * Copyright (c) 2013 Oleg Gromov
 * https://github.com/oleggromov/scroller.js/blob/master/LICENSE
 */

;(function($) {
    'use strict';

    var defaults = {
        vertical: false,
        wheelSpeed: 50
    };

    var htmlScroller = '<div class="scroller" />';
    var htmlWrap = '<div class="scroller__wrap" />';
    var htmlHandle = '<div class="scroller__scroll"><div class="scroller__handle" /></div>';


    // objects're created for each instance
    var Scroller = function(node, options) {
        this.options = $.extend({}, defaults, options);

        // content dom references
        this.parent = $(node);
        this.child = $(this.parent).children();
        this.childItems = this.child.children();

        // appending html
        $(htmlScroller)
            .append($(htmlWrap).append(this.child))
            .append(htmlHandle)
            .appendTo(this.parent)
            .toggleClass('scroller_vertical', this.options.vertical);

        // ui dom references
        this.wrap = this.parent.find('.scroller__wrap');
        this.scroll = this.parent.find('.scroller__scroll');
        this.handle = this.parent.find('.scroller__handle');

        this.resize();

        // event handlers
        this.parent.on('mousewheel wheel', $.proxy(this.dragByWheel, this));
        this.handle.on('mousedown', $.proxy(this.startDragging, this));
        $(document).on({
            'mouseup': $.proxy(this.stopDragging, this),
            'mousemove': $.proxy(this.drag, this)
        });
        $(window).on('resize', $.proxy(this.resize, this));
    };

    Scroller.prototype = {
        // event handlers
        startDragging: function(e) {
            if (!this.enabled || this.dragging) return;

            this.dragging = true;
            this.dragStart = this.options.vertical ? e.clientY : e.clientX;
        },


        stopDragging: function() {
            if (!this.enabled || !this.dragging) return;

            this.dragging = false;
            this.handleOffsetPrev = this.handleOffset;
        },


        drag: function(e) {
            if (!this.enabled || !this.dragging) return;

            this.handleOffset = this.getHandleOffset(this.options.vertical ? e.clientY : e.clientX);

            this.move(-(this.handleOffset / this.handleSize * 100))

            return {
                left: this.handleOffset,
                right: this.handlendleOffset + this.handleSize
            };
        },


        // TODO: refactoring
        dragByWheel: function(e) {
            if (!this.enabled) return;

            var delta = e.originalEvent.deltaY || -e.originalEvent.wheelDeltaY || -e.originalEvent.wheelDelta;
            var direction = delta < 0 ? -1 : 1;

            this.startDragging({
                clientX: 0,
                clientY: 0
            });
            var offsets = this.drag({
                clientX: this.options.wheelSpeed * direction,
                clientY: this.options.wheelSpeed * direction
            });
            this.stopDragging();

            if (offsets.left !== 0 && offsets.right !== 100) e.preventDefault();
        },


        resize: function() {
            var self = this.options.vertical ? this.parent.height() : this.parent.width();
            var child = this.setChildSize();

            // setting offsets
            this.handleOffset = 0;
            this.handleOffsetPrev = 0;
            this.dragging = false;
            this.enabled = false;
            // resetting position
            this.move(0);

            if (self >= child) {
                this.scroll.removeClass('scroller__scroll_visible');
            } else {
                this.enabled = true;
                this.scroll.addClass('scroller__scroll_visible');
                // sizing handle
                this.handleSize = this.getPercent(self, this.options.vertical ? this.child.outerHeight() : this.child.outerWidth());
                this.handle.css(this.options.vertical ? 'height' : 'width', this.handleSize + '%');
            }
        },


        setChildSize: function() {
            var scroller = this;
            var size = 0;
            var prev = $();

            this.childItems.each(function() {
                size += scroller.options.vertical ? $(this).outerHeight() + scroller.getMaxMargin(prev, $(this)) : $(this).outerWidth(true);
                prev = $(this);
            });

            this.child.css(this.options.vertical ? 'height' : 'width', size);
            return size;
        },


        move: function(childOffset) {
            this.wrap.css(this.options.vertical ? 'top' : 'left', childOffset + '%');
            this.handle.css(this.options.vertical ? 'top' : 'left', this.handleOffset + '%');
        },


        // aux
        getPercent: function(pixels, relativeTo) {
            return +(pixels / relativeTo * 100).toFixed(2);
        },


        getHandleOffset: function(offsetCurrent) {
            var pxOffset = offsetCurrent - this.dragStart;
            var percentOffset = this.getPercent(pxOffset, this.options.vertical ? this.parent.height() : this.parent.width()) + this.handleOffsetPrev;

            if (percentOffset < 0) {
                percentOffset = 0;
            } else if (percentOffset > (100 - this.handleSize)) {
                percentOffset = 100 - this.handleSize;
            }

            return percentOffset;
        },


        getMaxMargin: function(prevItem, item) {
            return Math.max(
                parseInt(item.css('margin-top'), 10),
                parseInt(prevItem.css('margin-bottom') || 0, 10)
            );
        },
    };


    // initing only once
    $.fn.scroller = function(options) {
        return this.each(function() {
            if ($(this).data('scroller')) return;

            $(this).data('scroller', new Scroller(this, options));
        });
    };
})(jQuery);