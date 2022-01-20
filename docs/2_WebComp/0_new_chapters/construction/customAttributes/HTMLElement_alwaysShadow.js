(function () {
  const nativeElementsToMockSlot = new WeakMap();

  //attach mock shadowRoot,<slot> for native HTMLElements
  function attachMockShadowRoot(el) {

    const root = new DocumentFragment();
    const slot = document.createElement('slot');
    Object.defineProperty(slot, 'assignedNodes', {
      get: function () {
        return this.parentNode.host.childNodes;
      }
    });
    root.appendChild(slot);
    nativeElementsToMockSlot.set(el, slot);

    Object.defineProperty(el, 'shadowRoot', {writable: false, value: root, enumerable: true, configurable: true});
    Object.defineProperty(root, 'host', {writable: false, value: el, enumerable: true, configurable: true});
  }

  //extend the Element.assignedSlot() method, so that it will include any mockShadowRoots
  MonkeyPatch.monkeyPatchGetter(Element.prototype, "assignedSlot", function assignedSlot(og) {
    return og.call(this) || nativeElementsToMockSlot.get(this.parentNode);
  });
})();