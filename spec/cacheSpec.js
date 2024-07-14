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

describe("cache basic functions", function() {
  beforeAll(function() {
    expect(cache).not.toBe(null);
    expect(cache).not.toBe(undefined);
    expect(loadMetarText).not.toBe(null);
    expect(loadMetarText('NZSP')).toMatch('.*South Pole.*');
  });

  beforeEach(function() {
    cache.clear();
  });
	
  it("should have a cache module loaded", function() {
     expect(JSON.stringify(cache)).toMatch('{"keyValue":{},"durationMsec":300000,"size":0}');
  });

  it("should accept cache.clear()", function() {
     expect(cache.clear()).toBe(cache);
  });

  it("should store and retrieve a value", function() {
    const theNow = Date.now();
    expect(undefined === cache.get('hello', theNow));
    expect(cache.put('hello', 'world', theNow)).toBe(cache);
    expect(cache.get('hello', theNow)).toBe('world');
  }); 

  it("should return undefined for expired values", function() {
    const theNow = Date.now();
    const theFuture = theNow + (1 + cache.durationMsec);
    expect(undefined === cache.get('hello', theNow));
    expect(cache.put('hello', 'world', theNow)).toBe(cache);
    expect(undefined === cache.get('hello', theFuture));
  });


});
