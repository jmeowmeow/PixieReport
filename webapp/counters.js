// counters.js
// Update runtime tallies of pixies rendered, etc.
// Naive wrapper over a Map(string, int).

const counters = new Map();

// Tally one count to each named counter.
const increment = function(...tallyNames) {
  tallyNames.map( each =>
    { let tally = counters.get(each); if (!tally) { tally = 0; } counters.set(each, tally+1); })
};

// Implicitly defines what counters we care to report on,
// before any tallies, by zeroing the counters by name.
const clearout = function(...tallyNames) {
  tallyNames.map( each => counters.set(each, 0));
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
