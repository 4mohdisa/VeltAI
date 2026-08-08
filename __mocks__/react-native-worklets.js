// Worklets' native runtime does not exist under jest, and reanimated's own
// mock still imports a moving set of symbols from it at module-eval time.
// Rather than chase each one, hand back a permissive stub: every property is
// an identity function that also works as an object/constructor. Render tests
// assert what a screen RENDERS, never animation behaviour, so this is exactly
// as much fidelity as they need.
const makeStub = () => {
  const fn = function (...args) {
    return args[0];
  };
  return new Proxy(fn, {
    get(target, prop) {
      if (prop === '__esModule') return true;
      if (prop === 'default') return makeStub();
      if (prop === 'then') return undefined; // never look thenable to await
      if (prop === Symbol.toPrimitive || prop === Symbol.toStringTag) return undefined;
      if (!(prop in target)) target[prop] = makeStub();
      return target[prop];
    },
    apply(_t, _this, args) {
      return args[0];
    },
  });
};

module.exports = makeStub();
