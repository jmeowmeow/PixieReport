// cacheSpec.js
// Jasmine spec to define the METAR report cache
// Overlaps parserSpec.js in using the same METAR resources

const { cache } = require('../webapp/cache.js');

// console.log("My cache is: "+JSON.stringify(cache));

const fs = require('fs');
const resourceDir = __dirname + '/resources';
const samples = [ 'KFNT', 'KIIY', 'KLAN', 'KSIY', 'NZSP', 'VEJS', 'KYIP', 'KBLI', 'MHGS', 'SVCJ', 'KBRL', 'PANU' ];
const loadMetarText = function(icaoName) {
    var metarFile = resourceDir + '/' + icaoName + '.TXT';
    expect(fs.existsSync(resourceDir)).toBeTrue();
    expect(fs.existsSync(metarFile)).toBeTrue();
    const metarText = fs.readFileSync(metarFile, 'utf-8');
    return metarText;
};

describe("metar to param parser", function() {
  beforeAll(function() {
    expect(cache).not.toBe(null);
    expect(cache).not.toBe(undefined);
    expect(loadMetarText).not.toBe(null);
    expect(loadMetarText('NZSP')).toMatch('.*South Pole.*');
  });

  it("should have a cache module loaded", function() {
     expect(JSON.stringify(cache)).toMatch('{"keyValue":{}}');
  });
});
