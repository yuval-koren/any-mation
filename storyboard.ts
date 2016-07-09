module Storyboard {

	class Position {
		x : number;
		y : number;
		
		constructor(xy : [number]) {
			this.x = xy[0];
			this.y = xy[1];
		}
	}

	interface IGetAnimatedValue {
		getValue(percent : number) : number;
	}

	class AnimateNumberLinear implements IGetAnimatedValue {		
		constructor(public start : number, public end : number) {
			
		}
		
		getValue(percent : number) : number{
			return this.start + percent * (this.end - this.start);
		};
	}
	
	class AnimateNumberCubicBezier implements IGetAnimatedValue {
		constructor(public start : number, public startEase : number, public end : number, public endEase : number) {
			
		}
		
		getValue(percent : number) {
			var oneMinusPercent = 1 - percent;

			return  Math.pow(oneMinusPercent,3) * this.start + 
					3 * Math.pow(oneMinusPercent,2) * percent * this.startEase +
					3 * oneMinusPercent * Math.pow(percent,2) * this.endEase +
					Math.pow(percent,3) * this.end; 
		}
	}

	interface ISetItemProp {
		setProperty(sprite : Item, value : number) : void;
	}
	
	class SetXPos implements ISetItemProp {
		setProperty(sprite : Item, value : number) : void {
			sprite.setXPos(value);
		}
	}
	
	class SetYPos implements ISetItemProp {
		setProperty(sprite : Item, value : number) : void {
			sprite.setYPos(value);
		}
	}


	class AnimationQueueItem {
		
		constructor(public startTick : number, public totalTicks : number, public item : Item, public algorithm : IGetAnimatedValue, public setterFunc : ISetItemProp) {
				
		}		
		
		setValueForCurrentTick(currentTick : number) {
			var percent = (currentTick - this.startTick) / this.totalTicks;
			var value = this.algorithm.getValue(percent);
			this.setterFunc.setProperty(this.item, value);
		}
	}

	class EventTicket {
		eventType : string;
		eventValue : AnimationQueueItem;
	}

	class AnimationEvents {
		eventQueue : EventTicket[][];
		
		constructor(public animationQueue : AnimationQueue) {
			this.eventQueue = [];
		}
		
		addStartAnimationEvent(animation : AnimationQueueItem) {
			var ticket = new EventTicket();
			ticket.eventType = 'start';
			ticket.eventValue = animation;
			
			this.addEvent(animation.startTick, ticket);
		}
		
		addStopAnimationEvent(animation : AnimationQueueItem) {
			var ticket = new EventTicket();
			ticket.eventType = 'stop';
			ticket.eventValue = animation;
			
			this.addEvent(animation.startTick + animation.totalTicks, ticket);
		}
		
		addEvent(tick : number, ticket : EventTicket) {
			if (!(tick in this.eventQueue)) {
				this.eventQueue[tick] = [];
			} 
				
			this.eventQueue[tick].push(ticket);
			
		}
		
		eventsInTick(tick : number) : EventTicket[] {
			if (tick in this.eventQueue) {
				return this.eventQueue[tick];
			} else {
				return []
			}
		}
		
		executeEvent(ticket : EventTicket) {
			if (ticket === null) { return; }
			
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
		}
	}

	class AnimationQueue {
		
		tick : number;
		stopFlag : boolean;
		queue : AnimationQueueItem[];
		events : AnimationEvents;
		
		constructor() {
			this.tick = 0;
			this.stopFlag = false;
			this.queue = [];
			this.events = new AnimationEvents(this);
		}
		
		start() {
			window.setTimeout(this.handleTick, 0, this);	
		}	
		
		stop() {
			this.stopFlag = true;
		}
		
		addAnimation(anim : AnimationQueueItem) {
			this.events.addStartAnimationEvent(anim);
			this.events.addStopAnimationEvent(anim);
		}
		
		getCurrentTick() : number {
			return this.tick;
		}
		
		handleTick(that : AnimationQueue) {
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
		}
		
		handleEndOfAnimation(anim : AnimationQueueItem) {
		}
	}

	class Item {
		
		x : number;
		y : number;
		element : HTMLElement;
		
		init(x : number, y : number, image : string, parentElement : string) {
			this.x = x;
			this.y = y;
			//that.image = image;
		
			var elm = document.getElementById('rz-panel');
				
			var item = document.createElement('img');
			item.className = 'absoluteImage'
			item.src = image;
			item.style.position = 'absolute';
			item.style.left = this.x+'px';
			item.style.top = this.y+'px';
			
			this.element = item;
			
			elm.appendChild(item);
		}
		
		setXPos(x : number) {
			this.element.style.left = x + 'px';
		}

		setYPos(y : number) {
			this.element.style.top = y + 'px';
		}
		
	}
	
	// Public API --------------------------------------------------------------------------------------------------------
	window['initGameOfLife'] = function initGameOfLife() {
		var imgSrc = 'http://img.mako.co.il/2011/10/10/f3dbfac67eee8cc1_dora-the-explorer-swiper_g.jpg';
		var myItem = new Item();
		myItem.init(100,100,imgSrc,'rz-panel');

		var dynamics = new AnimationQueue();
		dynamics.start();
		dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick(), 100, myItem, new AnimateNumberCubicBezier(100, 150, 200, 150), new SetXPos()));
		dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick(), 100, myItem, new AnimateNumberCubicBezier(100, 300, 150, -50), new SetYPos()));
		dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick()+100, 100, myItem, new AnimateNumberCubicBezier(200, 250, 300, 250), new SetXPos()));
		dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick()+100, 100, myItem, new AnimateNumberCubicBezier(150, 350, 200, -100), new SetYPos()));
		dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick()+200, 100, myItem, new AnimateNumberCubicBezier(300, 350, 400, 350), new SetXPos()));
		dynamics.addAnimation(new AnimationQueueItem(dynamics.getCurrentTick()+200, 100, myItem, new AnimateNumberCubicBezier(200, 400, 250, -150), new SetYPos()));
		//dynamics.addAnimation(new Animation(myItem, new Position([100,100]), new Position([500,500]), 500));
	};
	// Public API --------------------------------------------------------------------------------------------------------

};
