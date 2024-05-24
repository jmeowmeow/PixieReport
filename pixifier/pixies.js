const layerDefsBunny   = require('./layerDefsBunny.js');
const layerDefsHoliday = require('./layerDefsHoliday.js');
const layerDefsMoomin  = require('./layerDefsMoomin.js');
const layerDefsPixie0  = require('./layerDefsPixie0.js');
const layerDefsSelfie  = require('./layerDefsSelfie.js');

const layerDefs = new Map();
layerDefs.set('bunny', layerDefsBunny);
layerDefs.set('holiday', layerDefsHoliday);
layerDefs.set('moomin', layerDefsMoomin);
layerDefs.set('pixie0', layerDefsPixie0);
layerDefs.set('selfie', layerDefsSelfie);

for (const entry of layerDefs.entries()) {console.log(JSON.stringify(entry));} 
exports.layerDefsMap = layerDefs;
