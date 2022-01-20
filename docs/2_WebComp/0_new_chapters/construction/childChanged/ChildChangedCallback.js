(function (addEventListener, removeEventListener) {

  class ChildChangedNodes {

    #now;
    #old;
    static #empty = [];

    constructor(now, old) {
      this.#now = now;
      this.#old = old || ChildChangedNodes.#empty;
    }

    get old() {
      return this.#old.slice();
    }

    get now() {
      return this.#now.slice();
    }

    get added() {
      return this.#now.filter(n => this.#old.indexOf(n) === -1);
    }

    get removed() {
      return this.#old.filter(n => this.#now.indexOf(n) === -1);
    }
  }

  const lastSeen = new WeakMap();
  const listeners = new WeakMap();

  function callChildChanged(el, slots, nodes, oldNodes) {
    updateSlotchangeListener(el, slots);
    lastSeen.set(el, nodes);
    try {
      el.childChangedCallback(new ChildChangedNodes(nodes, oldNodes));
    } catch (error) {
      window.dispatchEvent(new ErrorEvent('error', {error}));
    }
  }

  function getSlotsAndFlattenChildren(el) {
    const nodes = [];
    const slots = [];
    for (let n of el.childNodes) {
      if (n instanceof HTMLSlotElement) {
        slots.push(n);
        nodes.push(...n.assignedNodes({flatten: true}));
      } else
        nodes.push(n);
    }
    return {nodes, slots};
  }

  function updateSlotchangeListener(el, slots) {
    const previousSlotChangeListener = listeners.get(el);
    if (previousSlotChangeListener && !slots.length) {
      removeEventListener.call(el, 'slotchange', listeners.get(el), true);
      listeners.delete(el);
    } else if (!previousSlotChangeListener && slots.length) {
      const listener = checkChildChangedFromEvent.bind(el);
      listeners.set(el, listener);
      addEventListener.call(el, 'slotchange', listener, true);
    }
  }

  function arraysAreTheSame(a, b) {
    return a.length === b?.length && a.every((n, i) => n === b[i]);
  }

  function setupChildChanged(el) {
    MO.observe(el, {childList: true});
    const {nodes, slots} = getSlotsAndFlattenChildren(el);
    callChildChanged(el, slots, nodes);
  }

  function checkChildChanged(el) {
    const {nodes, slots} = getSlotsAndFlattenChildren(el);
    const previousNodes = lastSeen.get(el);
    if (arraysAreTheSame(nodes, previousNodes))
      return;
    callChildChanged(el, slots, nodes, previousNodes);
  }

  function checkChildChangedFromEvent(e) {
    for (let el of e.composedPath()) {
      if (!(el instanceof HTMLSlotElement))   //slotchangeNipSlip
        return;
      if (el.parentNode === this)
        return checkChildChanged(this);
    }
  }

  function checkChildChangedFromMO(mrs) {
    mrs.map(mr => mr.target).filter((el, i, ar) => ar.indexOf(el) === i).forEach(checkChildChanged);
  }

  const MO = new MutationObserver(checkChildChangedFromMO);
  ElementObserver.complete(el => el.childChangedCallback && setupChildChanged(el));
})(addEventListener, removeEventListener);