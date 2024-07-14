describe("data resource modules should load OK", function() {
  var icaoToLocationMap, icaoEntries, entryCount;

  const pfx = '../pixifier/pixies/';
  const pixieDirs = [
        pfx + 'pixiemoomin/',
        pfx + 'pixiebunny/',
        pfx + 'pixieselfie/',
        pfx + 'pixie0/',
        pfx + 'pixiexmas/'
        ];

  const assertDollDesc = function(dolldir) {
    expect(dolldir).toBeDefined();
    const { dollsByWeather } = require(dolldir +'dolldesc.js');
    const dollsByTemperature = dollsByWeather;
    expect(dollsByTemperature).toBeDefined();
    expect(dollsByTemperature).toHaveSize(5, "number of temperature level doll map entries"); // Jasmine 3.6.0
    // pre Jasmine 3.6.0 equivalent assertion for number of doll variations
    const dollEntries = Object.entries(dollsByTemperature);
    const entryCount = dollEntries.length;
    expect(entryCount).toBe(5, "number of doll variations by temperature"); // icy, cold, cool, warm, hot
    expect(dollEntries[5]).toBeUndefined();
    expect(dollEntries[4][0]).toBe('4', "last map entry");
    expect(dollEntries[4][1]).toMatch(/\.$/, "last doll variation has non-empty doll description");
  };

  beforeAll(function() {
    icaoToLocationMap = require('../pixifier/icao.js').icaoToLocationMap;
    icaoEntries = Object.entries(icaoToLocationMap);
    entryCount = icaoEntries.length;
    expect(icaoToLocationMap).toBeDefined();
    expect(icaoToLocationMap).not.toBe(null);
  });

  it("location map should have this many entries", function() {
    expect(entryCount).toBe(8703);
  });

  it("location map first entry should be", function() {
    expect(icaoEntries[0][0]).toBe('AAWR');
  });

  it("location map last entry should be", function() {
    expect(icaoEntries[entryCount-1][0]).toBe('ZYYY');
  });

  it(`${pixieDirs[0]} should have moomin doll descriptions`, function() {
    assertDollDesc(pixieDirs[0]);
  });

  it(`${pixieDirs[1]} should have bunny doll descriptions`, function() {
    assertDollDesc(pixieDirs[1]);
  });

  it(`${pixieDirs[2]} should have selfie doll descriptions`, function() {
    assertDollDesc(pixieDirs[2]);
  });

  it(`${pixieDirs[3]} should have basic doll descriptions`, function() {
    assertDollDesc(pixieDirs[3]);
  });

  it(`${pixieDirs[4]} should have xmas doll descriptions`, function() {
    assertDollDesc(pixieDirs[4]);
  });

});
