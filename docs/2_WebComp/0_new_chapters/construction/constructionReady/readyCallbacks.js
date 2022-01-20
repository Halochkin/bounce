(function (defineOG) {

  const done = new WeakSet();

  function callAttributeReady(el) {
    if (done.has(el)) return;
    done.add(el);
    try {
      el.attributeReadyCallback();
    } catch (error) {
      window.dispatchEvent(new ErrorEvent('error', {error}));
    }
  }

  function callChildReady(el) {
    try {
      el.childReadyCallback();
    } catch (error) {
      window.dispatchEvent(new ErrorEvent('error', {error}));
    }
  }

  Object.defineProperty(customElements, 'define', {
    enumerable: true, writable: true, configurable: true, value:
      function defineX(tag, constr, ...args) {
        const proto = constr.prototype;
        if (!proto.attributeReadyCallback)
          return defineOG.call(this, tag, constr, ...args);

        const accbProp = Object.getOwnPropertyDescriptor(proto, 'attributeChangedCallback');
        const ccbProp = Object.getOwnPropertyDescriptor(proto, 'connectedCallback');

        if (accbProp) {
          const accbOg = accbProp.value;
          Object.defineProperty(proto, 'attributeChangedCallback', {
            enumerable: true, writable: true, configurable: true, value:
              function attributeReadyInterceptor(...args) {
                callAttributeReady(this);
                accbOg.call(this, ...args);
              }
          });
        }
        if (ccbProp) {
          const ccbOg = ccbProp.value;
          Object.defineProperty(proto, 'connectedCallback', {
            enumerable: true, writable: true, configurable: true, value:
              function attributeReadyInterceptor(...args) {
                callAttributeReady(this);
                ccbOg.call(this, ...args);
              }
          });
        }
        defineOG.call(this, tag, constr, ...args);
        accbProp && Object.defineProperty(proto, 'attributeChangedCallback', accbProp);
        ccbProp && Object.defineProperty(proto, 'connectedCallback', ccbProp);
      }
  });
  ElementObserver.end(el => el.attributeReadyCallback && callAttributeReady(el));
  ElementObserver.complete(el => el.childReadyCallback && callChildReady(el));
})(customElements.define);