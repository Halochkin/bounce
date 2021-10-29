(function initConstructionFrameAPI() {
  /*
   * The ConstructionFrame API
   *
   *  1. construction-start. Dispatched immediately *before* a new constructionFrame starts.
   *  2. construction-end.   Dispatched immediately *after* a constructionFrame ends. Has one property,
   *                         .ended which is the constructionFrame recently dropped.
   *                         runs shadow-light, bottom-up, right-left.
   *  3. construction-complete. Dispatched after a top constructionFrame ends. Has one property: .completed
   *                         which is a top-down iterator of all the frames completed.
   *                         runs light-shadow, top-down, left-right.
   *
   * The ConstructionFrame API depends on:
   *  1. beforescriptexecute event.
   *  2. NoNewConstructorHTMLElement.
   *     The NoNewContructorHTMLElement essentially ensures that no 'new HTMLElement()' constructor is called directly.
   *     This is a restriction that applies to native elements, and this restriction is extended to custom elements.
   *     The ConstructionFrame API will produce wrong events if used with 'new HTMLElement.constructor()',
   *     but error management is not included to make the ConstructionFrame API faster in production.
   *
   * Whenever a custom element is defined and referenced in an HTMLElement construction method or template, then
   * the browser will call all the callbacks *sync* for those elements as part of the construction process.
   * This means that the construction HTMLElements nests and branch out as a tree when for example as a custom element
   * creates a shadowDom with one or more other custom elements. We call the nodes in this graph for constructionFrames.
   *
   * Example:
<script>
  class CompA extends HTMLElement{
    constructor(){
      super();
      this.attachShadow();
      this.shadowRoot.innerHTML = '<comp-b></comp-b>';
    }
  }
  class CompB extends HTMLElement{
    constructor(){
      super();
      this.attachShadow();
      const c = document.createElement('comp-c');
      this.shadowRoot.appendChild(c);
    }
  }
  class CompC extends HTMLElement{
    constructor(){
      super();
      this.attachShadow();
      this.shadowRoot.innerHTML = 'hello sunshine';
    }
  }
  customElements.define('comp-c', CompC);
  customElements.define('comp-b', CompB);
  customElements.define('comp-a', CompA);
</script>.
<comp-a></comp-a>
   *
   *  In this example, the constructionFrame will nest like this:
   *  { predictive:comp-a { innerHTML:comp-b { createElement:comp-c } } }
   *
   * Problem 1: main document nests lightDom branches while loading
   * While loading, the browser can create custom elements directly. And while loading, the browser's parser
   * may be delayed for a long time while waiting for sync <scripts>. And with custom web components that direct layout,
   * you need to load custom elements synchronously and block rendering to avoid FOUC.
   *
   * This creates a situation where you wish to mark the *end* of a construction frame as early as possible, ie.
   * on a per element level. When we mark a construction frame for an individual element, the frame begins just before
   * the start tag is read and ends when the end tag is read. As there is no possible means to know when the end tag is,
   * the document frame would end as soon as possible after the end tag is read.
   *
   * The per element construction frames that are created when the predictive parser calls the custom element constructor
   * directly is called a "predictive construction frame".
   *
   * We make "predictive construction frames" with a somewhat complex mechanism:
   * 1. every time an HTMLElement.constructor() is called directly by the predictive parser, we start a new
   *    predictive constructionFrame and issue a construction-start event. all predictive constructionFrames will have
   *    an empty parent construction frame (ie. be a root construction frame).
   * 2. then, every time the predictive parser breaks to either a) run a script or b) run another custom element constructor,
   *    ie. at beforescriptexecute time during loading, then the mechanism will check if the endTag of the custom element
   *    whose constructor triggered the predictive construction frame has been read.
   * 3. If the endTag of the custom element that triggered the predictive frame has been read, the construction-end event
   *    is dispatched for that predictive construction frame.
   * 4. This means that predictive construction frames for parent nodes will remain open (but no longer be accessible from
   *    ConstructionFrame.now) while the predictive construction frames of the light dom child nodes are also active.
   * 5. For nested construction frame contexts, construction contexts start and end recursively.
   *    A predictive construction frame associated with a descendant element will always end before
   *    a predictive construction frame associated with an ancestor element.
   *
   * The ConstructionFrame API is a low level API. It is not intended to be used directly, but intended for use by other
   * API such as attributeReadyCallback() and childReadyCallback() APIs.
   * These APIs need mainly to listen for construction-end events so that they can trigger
   * attributeReadyCallback() and childReadyCallback() at the correct time.
   */
  let now;

  class ConstructionFrame {

    #children = [];
    #parent;
    #state;

    static #observers = {'start': [], 'end': [], 'complete': []};

    constructor() {
      this.#parent = now;
      now = this;
      this.#parent?.#children.push(this);
      this.#callObservers('start');
    }

    #callObservers(state) {
      this.#state = state;
      ConstructionFrame.#observers[state].forEach(cb => cb(this));
    }

    #complete() {
      this.#callObservers('complete');
      this.#children.forEach(frame => frame.#complete());
    }

    get parent() {
      return this.#parent;
    }

    get state() {
      return this.#state;
    }

    toString() {
      const parent = this.#parent ? this.#parent.toString() + ', ' : '';
      return parent + this.constructor.name.slice(0, -17) + '#' + this.#state;
    }

    static get now() {
      return now;
    }

    static dropNow() {
      now = undefined;
    }

    static observe(state, cb) {
      this.#observers[state]?.push(cb);
    }

    static disconnect(state, cb) {
      const ar = this.#observers[state];
      if (!ar) return;
      const pos = ar.indexOf(cb);
      pos >= 0 && ar.splice(pos, 1);
    }

    end() {
      this.#callObservers('end');
      !this.#parent && this.#complete();
      now = this.#parent;
    }
  }

  window.ConstructionFrame = ConstructionFrame;

  function* recursiveNodes(n) {
    yield n;
    if (n.childNodes)
      for (let c of n.childNodes)
        yield* recursiveNodes(c);
  }

  function* siblingUntil(start, end) {
    for (let next = start.nextSibling; next !== end; next = next.nextSibling)
      yield next;
  }

  class DocumentCreateElementConstructionFrame extends ConstructionFrame {
    #el;

    end(created) {
      this.#el = created;
      super.end();
    }

    * nodes() {
      yield this.#el;
    }
  }

  class CloneNodeConstructionFrame extends ConstructionFrame {
    #el;

    end(nodes) {
      this.#el = nodes;
      super.end();
    }

    * nodes() {
      yield* recursiveNodes(this.#el);
    }
  }

  class InnerHTMLConstructionFrame extends ConstructionFrame {
    #nodes;

    end(nodes, el) {
      this.#nodes = el.childNodes;
      super.end();
    }

    * nodes() {
      for (let n of this.#nodes)
        yield* recursiveNodes(n);
    }
  }

  class InsertAdjacentHTMLConstructionFrame extends ConstructionFrame {
    #start;
    #end;

    constructor(el, position) {
      super();
      [this.#start, this.#end] = InsertAdjacentHTMLConstructionFrame.adjacentElements(position, el);
    }

    * nodes() {
      for (let el of siblingUntil(this.#start || this.firstChild, this.#end))
        yield* recursiveNodes(el);
    }

    static adjacentElements(pos, el){
      return pos === 'beforebegin' ? [el.previousSibling, el] :
        pos === 'afterend' ? [el, el.nextSibling] :
          pos === 'afterbegin' ? [undefined, el.firstChild] :
            pos === 'beforeend' ? [el.lastChild, undefined] :
              null;
    }
  }

  function monkeyPatch(proto, prop, setOrValue, Type) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
    const og = descriptor[setOrValue];
    descriptor[setOrValue] = function constructHtmlElement(...args) {
      const frame = new Type(this, ...args);
      const res = og.call(this, ...args);
      frame.end(res, this, ...args);
      return res;
    };
    Object.defineProperty(proto, prop, descriptor);
  }

  // monkeyPatch(Element.prototype, "outerHTML", 'set', CloneNodeConstructionFrame);  //todo make a separate function here. Or. Should we simply outlaw this function?
  monkeyPatch(Element.prototype, "innerHTML", 'set', InnerHTMLConstructionFrame);
  monkeyPatch(ShadowRoot.prototype, "innerHTML", 'set', InnerHTMLConstructionFrame);
  monkeyPatch(Node.prototype, "cloneNode", 'value', CloneNodeConstructionFrame);
  monkeyPatch(Document.prototype, "createElement", 'value', DocumentCreateElementConstructionFrame);
  monkeyPatch(Element.prototype, "insertAdjacentHTML", 'value', InsertAdjacentHTMLConstructionFrame);
})();
/*
 * UPGRADE, depends on ConstructionFrame
 */
(function () {
  class UpgradeConstructionFrame extends ConstructionFrame {
    #tagName;
    #el;

    constructor(el, tagName) {
      super();
      this.#el = el;
      this.#tagName = tagName;
    }

    chain(el) {
      if (!this.#el) return this.#el = el; //if this is the first upgraded element, then just update the element in the frame
      super.end();                                       //otherwise, end the previous element frame,
      new UpgradeConstructionFrame(el, this.#tagName);   //and start a new frame
    }

    * nodes() {
      if (this.#el) yield this.#el;
    }
  }

  const descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, "define");
  const og = descriptor.value;
  descriptor.value = function createElement_constructionFrame(...args) {
    new UpgradeConstructionFrame(undefined, args[0]);
    og.call(this, ...args);
    ConstructionFrame.now.end();
  };
  Object.defineProperty(CustomElementRegistry.prototype, "define", descriptor);

  window.HTMLElement = class UpgradeConstructionFrameHTMLElement extends HTMLElement {
    constructor() {
      super();
      ConstructionFrame.now instanceof UpgradeConstructionFrame && ConstructionFrame.now.chain(this);
    }
  }
})();
/*
 * PREDICTIVE PARSER, depends on UPGRADE
 */
(function () {

  if (document.readyState !== 'loading')
    return;

  //todo this is untested..
  function* recursiveNodesWithSkips(el, skips) {
    yield el;
    if (el.childNodes)
      for (let c of el.childNodes)
        if (skips.indexOf(c) < 0)
          for (let desc of recursiveNodesWithSkips(c, skips))
            yield desc;
  }

  class PredictiveConstructionFrame extends ConstructionFrame {

    #el;
    #skips;

    end(el, skips) {
      this.#el = el;
      this.#skips = skips;
      super.end();
    }

    * nodes() {
      //todo use the root and complete branch to create a correct iterator.
      for (let n of recursiveNodesWithSkips(this.#el, this.#skips))
        yield n;
    }
  }

  let completedBranches = [];

  function endPredictiveFrame(el, frame) {
    frame.end(el, completedBranches);
    completedBranches.push(el);
  }

  const po = new ParserObserver(ConstructionFrame.dropNow, endPredictiveFrame);

  class PredictiveConstructionFrameHTMLElement extends HTMLElement {
    constructor() {
      super();
      !ConstructionFrame.now && po.observe(this, new PredictiveConstructionFrame(this));
    }
  }

  function dropClass(cnstr) {
    Object.setPrototypeOf(cnstr, Object.getPrototypeOf(Object.getPrototypeOf(cnstr)));
    Object.setPrototypeOf(cnstr.prototype, Object.getPrototypeOf(Object.getPrototypeOf(cnstr.prototype)));
  }

  function injectClass(cnstr, superCnstr) {
    Object.setPrototypeOf(superCnstr, Object.getPrototypeOf(cnstr));
    Object.setPrototypeOf(superCnstr.prototype, Object.getPrototypeOf(cnstr.prototype));
    Object.setPrototypeOf(cnstr, superCnstr);
    Object.setPrototypeOf(cnstr.prototype, superCnstr.prototype);
  }

  const OG = window.HTMLElement;
  injectClass(OG, PredictiveConstructionFrameHTMLElement);
  window.addEventListener('readystatechange', () => dropClass(OG), {once: true, capture: true});
})();