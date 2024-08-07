// counters.js

const counters = new Map();

const increment = function(...args) {
  args.map( arg =>
    { let c = counters.get(arg); if (!c) { c = 0; } counters.set(arg, c+1); })
};

const clearout = function(...args) {
  args.map( arg => counters.set(arg, 0));
};

const showcounters = function() {
  let e = counters.entries();
  let a = new Array(...e);
  a.sort();
  return a;
};

exports.increment    = increment;
exports.clearout     = clearout;
exports.showcounters = showcounters;
