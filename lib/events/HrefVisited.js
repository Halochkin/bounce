const state = new WeakMap();
const observer = new MutationObserver(function (mutationList) {
  for (let mutation of mutationList) {
    const att = mutation.attributeName;
    const el = mutation.target;
    if (mutation.oldValue === el.getAttribute(att))
      continue;
    if (att === 'href') updateHref(el);
    else if (att === 'link') updateLink(el);
    else if (att === 'visited') updateVisited(el);
  }
});

function isHrefVisited(href) {
  // The real visited property is readable from user eyeballs only.
  // For obvious security and privacy issues.
  // Hence the users browsing history is not accessible from script.
  // So, here we just make a little random function to get some variation in this demo.
  return Math.random() > 0.5;
}

function updateHref(el) {
  const href = el.getAttribute('href');
  const state = !href ? null : isHrefVisited(href) ? 'visited' : 'link';
  state.set(el, state);
  updateVisited(el);
  updateLink(el);
}

function updateLink(el) {
  const doLink = state.get(el) === "link";
  const hasLink = el.hasAttribute('link');
  if(!doLink && hasLink) el.removeAttribute('link');
  else if(doLink && !hasLink) el.setAttribute('link', '');
}

function updateVisited(el) {
  const doVisited = state.get(el) === "visited";
  const hasVisited = el.hasAttribute('visited');
  if(!doVisited && hasVisited) el.removeAttribute('visited');
  else if(doVisited && !hasVisited) el.setAttribute('visited', '');
}

let observeds = [];

function observeHashchange(e) {
  observeds = observeds.filter(function (ref) {
    const el = ref.deref();
    if (!el)
      return false;
    updateHref(el);
    return true;
  });
  !observeds.length && window.removeEventListener('hashchange', observeHashchange);
}

export function hrefVisited(el) {
  updateHref(el);
  observer.observe(el, {attributes: true});
  observeds.push(new WeakRef(el));
  observeds.length === 1 && window.addEventListener('hashchange', observeHashchange);
}

export function HrefVisited(Base) {
  return class Visited extends Base {
    constructor() {
      super();
      hrefVisited(this);
    }
  }
}