(function () {

  const listenersGet = EventTarget.prototype.getEventListeners;
  Object.defineProperty(EventTarget.prototype, 'getEventListeners', {value: undefined});

  MonkeyPatch.monkeyPatch(EventTarget.prototype, 'dispatchEvent', function dispatchEvent(og, e) {
    const targetId = this.getAttribute(":uid");
    if (!targetId)
      throw new Error("No :uid attribute on target element" + e.target);
    const eventLoop = document.querySelector('event-loop');
    if (!eventLoop)
      throw new Error("No event-loop element in document");
    else
      eventLoop.append(HTMLEventElement.makeEventElement(targetId, e));
  });

  const events = new WeakMap();

  //todo this thing needs to capture both the Attr and the EventTarget. The Attr should have been an EventTarget, but it isn't
  // so we need to make it so again.

  window.HTMLEventElement = class HTMLEventElement extends HTMLElement {
    static makeEventElement(targetId, e) {
      const el = document.createElement('event');
      el.setAttribute(':inner-target', targetId);
      el.setAttribute(":created", Date.now());
      el.setAttribute(':type', e.type);
      el.setAttribute(':composed', e.composed);
      el.setAttribute(':bubbles', e.bubbles);        //todo always true?? I think yes.
      if (e.pointerType === "mouse") {
        el.setAttribute(':x', e.x);
        el.setAttribute(':y', e.y);
      }
      return el;
    }

    get type() {
      return this.getAttribute(":type");
    }

    get defaultPrevented() {
      return this.getAttribute(":default-prevented");
    }

    get preventDefault() {
      this.hasAttribute(":default-prevented") || this.setAttribute(":default-prevented");
    }

    get innerTarget() {
      return document.querySelector(`[\\:uid='${this.getAttribute(":inner-target")}']`);
    }

    //target and currentTarget should be private in a weakMap.

    get composed() {
      return this.getAttribute(":composed");
    }

    get event() {
      let event = events.get(this);
      !event && events.set(this, event = new ElementEvent(this));
      return event;
    }

    static dispatchEvent(eventElement) {
      eventElement.setAttribute(":started", Date.now());
      Object.setPrototypeOf(eventElement, HTMLEventElement.prototype);
      if (eventElement.innerTarget)
        HTMLEventElement.#propagate(eventElement, eventElement.innerTarget);
      else
        eventElement.setAttribute(":error", `Can't find target: ${(eventElement.getAttribute(":target"))}`);
      eventElement.setAttribute(":finished", Date.now());
    }

    static targetRoots(target, composed) {
      if (!composed)
        return [{target, root: target.getRootNode(), path: []}];
      const hosts = [];
      for (let root; target; target = root.host)
        hosts.unshift({target, root: root = target.getRootNode(), path: []});
      return hosts;
    }

    static* dynamo_core(target, composed, depth = 0, pos = 0) {
      const hosts = HTMLEventElement.targetRoots(target, composed);
      for (let i = 0; i < hosts.length; i++) {                           //user document is top down
        let {target, root, path} = hosts[i];
        for (; target; target = target.parentNode) {
          path.push(target);
          yield {target, root, depth: depth + i, pos, path};
        }
      }
      for (let i = hosts.length - 1; i >= 0; i--) {                     //slotting/attributes  documents is bottom up
        let {path} = hosts[i];
        for (let pos = 0; pos < path.length; pos++) {
          let target = path[pos];
          if (target.assignedSlot) {                                    //first shadowDom
            yield* this.dynamo_core(target.assignedSlot, false, depth + i + 1, pos + 1);
          }
          if (target.attributes)
            //todo this itar doesn't work. if the attribute event listener removes the attribute itself,
            // or another attribute on the host element listed before it,
            // then all hell breaks loose.
            // We need to clone the list of attributes before the running through it.
            // This we need a test for.
            // We need an action attribute that removes and adds attributes, and
            // then we need a plan for how this should behave dynamically.
            // I think that they should work immediately, but the event listeners doesn't do that.
            // This is an issue that we should a) test for, b) specify. What should be the dynamic behavior of event listeners
            // added on the same element? I think they should be just as dynamic as event listeners added
            // on other elements later in the propagation path. Why not?
            for (let i = 0; i < target.attributes.length; i++)          //second attributes
              yield {target: target.attributes[i], root: target.attributes[i], depth: depth + i, pos: pos+1};
        }
      }
    }

    //if you remove a node from the dom, then you don't really need to run its listeners anymore.
    static* dynamo_connected(t, composed, connectedOnly) {
      if (!connectedOnly) {
        yield* this.dynamo_core(t, composed);
        return;
      }
      for (let {target, root} of this.dynamo_core(t, composed))
        if (target.isConnected) yield {target, root};
    }

    //example of dev time check that can be used to produce error messages.
    static* dynamo_neverSameTargetTwice(t, composed, connectedOnly) {
      const seen = new WeakSet();
      for (let {target, root} of this.dynamo_connected(t, composed, connectedOnly)) {
        if (seen.has(target))
          throw new Error("Don't manipulate the parent context of an element during event propagation");
        seen.add(target);
        yield {target, root};
      }
    }

    static* dynamo_preventDefaultStops(t, eventEl) {
      let previousRoot;
      for (let {target, root} of this.dynamo_neverSameTargetTwice(t, eventEl.composed === "true", false)) {
        if (previousRoot === root)
          yield {target, newDocument: false};
        else if (eventEl.defaultPrevented)  //defaultPrevented is a global variable... this could be a problem...
          return;                          //blocks mandatory defaultActions such as a dblclick attribute on the <body>. fix this stage 2.
        else
          previousRoot = root, yield {target, newDocument: true};
      }
    }

    static #propagate(eventEl, target) {
      for (let {target: t, newDocument} of this.dynamo_preventDefaultStops(target, eventEl)) {
        if (newDocument)
          eventEl.target = t;    //todo lock this in weakMap
        const list = listenersGet.call(t, eventEl.type);              //todo this is a locked, private function
        if (!list)
          continue;
        eventEl.currentTarget = t;  //todo lock this in weakMap
        for (let fun of list) {
          try {
            fun?.call(t, eventEl.event);
          } catch (error) {
            //eventElement.listenerErrors.push(target, fun, error); //todo something like this
          }
        }
      }
    }
  }
})();