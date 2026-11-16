import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const { window } = dom;

function install(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

// Node already has some of these. Radix dispatches them on jsdom nodes, which
// only accept events constructed in the jsdom realm.
const fromJsdom = [
  "window",
  "document",
  "navigator",
  "Event",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "PointerEvent",
  "FocusEvent",
  "InputEvent",
  "UIEvent",
  "EventTarget",
  "NodeFilter",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLAnchorElement",
  "Element",
  "Node",
  "Document",
  "DocumentFragment",
  "SVGElement",
  "MutationObserver",
];

for (const name of fromJsdom) {
  install(name, window[name as keyof Window]);
}

for (const name of Object.getOwnPropertyNames(window)) {
  if (name in globalThis) continue;
  try {
    install(name, window[name as keyof Window]);
  } catch {
    // A few host objects cannot be copied. Tests only need the DOM surface.
  }
}

install("getComputedStyle", window.getComputedStyle.bind(window));
install("requestAnimationFrame", window.requestAnimationFrame.bind(window));
install("cancelAnimationFrame", window.cancelAnimationFrame.bind(window));
install("IS_REACT_ACT_ENVIRONMENT", true);

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

install("ResizeObserver", ResizeObserverStub);
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

if (!window.Element.prototype.scrollIntoView) {
  window.Element.prototype.scrollIntoView = () => {};
}

const element = window.Element.prototype as Element & {
  hasPointerCapture?: (pointerId: number) => boolean;
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
};
if (!element.hasPointerCapture) {
  element.hasPointerCapture = () => false;
  element.setPointerCapture = () => {};
  element.releasePointerCapture = () => {};
}
