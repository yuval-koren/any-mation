var Storyboard;
(function (Storyboard) {
    var Position = (function () {
        function Position(xy) {
            this.x = xy[0];
            this.y = xy[1];
        }
        return Position;
    }());
    var AnimateNumberLinear = (function () {
        function AnimateNumberLinear(start, end) {
            this.start = start;
            this.end = end;
        }
        AnimateNumberLinear.prototype.getValue = function (percent) {
            return this.start + percent * (this.end - this.start);
        };
        ;
        return AnimateNumberLinear;
    }());
    var AnimateNumberCubicBezier = (function () {
        function AnimateNumberCubicBezier(start, startEase, end, endEase) {
            this.start = start;
            this.startEase = startEase;
            this.end = end;
            this.endEase = endEase;
        }
        AnimateNumberCubicBezier.prototype.getValue = function (percent) {
            var oneMinusPercent = 1 - percent;
            return Math.pow(oneMinusPercent, 3) * this.start +
                3 * Math.pow(oneMinusPercent, 2) * percent * this.startEase +
                3 * oneMinusPercent * Math.pow(percent, 2) * this.endEase +
                Math.pow(percent, 3) * this.end;
        };
        return AnimateNumberCubicBezier;
    }());
    var SetXPos = (function () {
        function SetXPos() {
        }
        SetXPos.prototype.setProperty = function (sprite, value) {
            sprite.setXPos(value);
        };
        return SetXPos;
    }());
    var SetYPos = (function () {
        function SetYPos() {
        }
        SetYPos.prototype.setProperty = function (sprite, value) {
            sprite.setYPos(value);
        };
        return SetYPos;
    }());
    var AnimationQueueItem = (function () {
        function AnimationQueueItem(startTick, totalTicks, item, algorithm, setterFunc) {
            this.startTick = startTick;
            this.totalTicks = totalTicks;
            this.item = item;
            this.algorithm = algorithm;
            this.setterFunc = setterFunc;
        }
        AnimationQueueItem.prototype.setValueForCurrentTick = function (currentTick) {
            var percent = (currentTick - this.startTick) / this.totalTicks;
            var value = this.algorithm.getValue(percent);
            this.setterFunc.setProperty(this.item, value);
        };
        return AnimationQueueItem;
    }());
    var EventTicket = (function () {
        function EventTicket() {
        }
        return EventTicket;
    }());
    var AnimationEvents = (function () {
        function AnimationEvents(animationQueue) {
            this.animationQueue = animationQueue;
            this.eventQueue = [];
        }
        AnimationEvents.prototype.addStartAnimationEvent = function (animation) {
            var ticket = new EventTicket();
            ticket.eventType = 'start';
            ticket.eventValue = animation;
            this.addEvent(animation.startTick, ticket);
        };
        AnimationEvents.prototype.addStopAnimationEvent = function (animation) {
            var ticket = new EventTicket();
            ticket.eventType = 'stop';
            ticket.eventValue = animation;
            this.addEvent(animation.startTick + animation.totalTicks, ticket);
        };
        AnimationEvents.prototype.addEvent = function (tick, ticket) {
            if (!(tick in this.eventQueue)) {
                this.eventQueue[tick] = [];
            }
            this.eventQueue[tick].push(ticket);
        };
        AnimationEvents.prototype.eventsInTick = function (tick) {
            if (tick in this.eventQueue) {
                return this.eventQueue[tick];
            }
            else {
                return [];
            }
        };
        AnimationEvents.prototype.executeEvent = function (ticket) {
            if (ticket === null) {
                return;
            }
            if (ticket.eventType === 'start') {
                this.animationQueue.queue.push(ticket.eventValue);
                return;
            }
            if (ticket.eventType === 'stop') {
                var index = this.animationQueue.queue.indexOf(ticket.eventValue);
                if (index > -1) {
                    this.animationQueue.queue.splice(index, 1);
                }
            }
        };
        return AnimationEvents;
    }());
    var AnimationQueue = (function () {
        function AnimationQueue() {
            this.tick = 0;
            this.stopFlag = false;
            this.queue = [];
            this.events = new AnimationEvents(this);
        }
        AnimationQueue.prototype.start = function () {
            window.setTimeout(this.handleTick, 0, this);
        };
        AnimationQueue.prototype.stop = function () {
            this.stopFlag = true;
        };
        AnimationQueue.prototype.addAnimation = function (anim) {
            this.events.addStartAnimationEvent(anim);
            this.events.addStopAnimationEvent(anim);
        };
        AnimationQueue.prototype.getCurrentTick = function () {
            return this.tick;
        };
        AnimationQueue.prototype.handleTick = function (that) {
            // handling stoping the animation
            if (that.stopFlag) {
                that.stopFlag = false;
                return;
            }
            // todo: check if there are events and handle them correctly.
            var eventsInTick = that.events.eventsInTick(that.tick);
            for (var eventKey in eventsInTick) {
                that.events.executeEvent(eventsInTick[eventKey]);
            }
            // handling all animated items
            for (var key in that.queue) {
                // calculate and set new position
                that.queue[key].setValueForCurrentTick(that.tick);
            }
            // next tick handling
            that.tick++;
            // calling next frame
            window.setTimeout(that.handleTick, 0, that);
        };
        AnimationQueue.prototype.handleEndOfAnimation = function (anim) {
        };
        return AnimationQueue;
    }());
    var Item = (function () {
        function Item() {
        }
        Item.prototype.init = function (x, y, image, parentElement) {
            this.x = x;
            this.y = y;
            //that.image = image;
            var elm = document.getElementById('rz-panel');
            var item = document.createElement('img');
            item.className = 'absoluteImage';
            item.src = image;
            item.style.position = 'absolute';
            item.style.left = this.x + 'px';
            item.style.top = this.y + 'px';
            this.element = item;
            elm.appendChild(item);
        };
        Item.prototype.setXPos = function (x) {
            this.element.style.left = x + 'px';
        };
        Item.prototype.setYPos = function (y) {
            this.element.style.top = y + 'px';
        };
        return Item;
    }());
    // Public API --------------------------------------------------------------------------------------------------------
    window['initGameOfLife'] = function initGameOfLife() {
        var imgSrc = 'http://img.mako.co.il/2011/10/10/f3dbfac67eee8cc1_dora-the-explorer-swiper_g.jpg';
        var myItem = new Item();
        myItem.init(100, 100, imgSrc, 'rz-panel');
        var dynamics = new AnimationQueue();
        dynamics.start();
        dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick(), 100, myItem, new AnimateNumberCubicBezier(100, 150, 200, 150), new SetXPos()));
        dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick(), 100, myItem, new AnimateNumberCubicBezier(100, 300, 150, -50), new SetYPos()));
        dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick() + 100, 100, myItem, new AnimateNumberCubicBezier(200, 250, 300, 250), new SetXPos()));
        dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick() + 100, 100, myItem, new AnimateNumberCubicBezier(150, 350, 200, -100), new SetYPos()));
        dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick() + 200, 100, myItem, new AnimateNumberCubicBezier(300, 350, 400, 350), new SetXPos()));
        dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick() + 200, 100, myItem, new AnimateNumberCubicBezier(200, 400, 250, -150), new SetYPos()));
        //dynamics.addAnimation(new Animation(myItem, new Position([100,100]), new Position([500,500]), 500));
    };
})(Storyboard || (Storyboard = {}));
;
//# sourceMappingURL=storyboard.js.map