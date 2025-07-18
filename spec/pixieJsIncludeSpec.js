describe("data resource modules should load OK", function() {
  var icaoEntries, entryCount;

  const { activeMetarStations, icaoToLocationMap } = require('../pixifier/icao.js');

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
    expect(entryCount).withContext("number of doll variations by temperature").toBe(5); // icy, cold, cool, warm, hot
    expect(dollEntries[5]).toBeUndefined();
    expect(dollEntries[4][0]).withContext("last map entry").toBe('4');
    expect(dollEntries[4][1]).withContext("last doll variation has non-empty doll description").toMatch(/\.$/);
  };

  beforeAll(function() {
    icaoEntries = Object.entries(icaoToLocationMap);
    entryCount = icaoEntries.length;
    // to-do: cross-check the active stations list vs icao geodata?
    expect(icaoToLocationMap).toBeDefined();
    expect(icaoToLocationMap).not.toBe(null);
    expect(activeMetarStations).toBeDefined();
    expect(activeMetarStations).not.toBe(null);
    activeCount = activeMetarStations.length;
  });

  it("location map should have this many entries", function() {
    expect(entryCount).toBe(8729);
  });

  it("location map first entry should be", function() {
    expect(icaoEntries[0][0]).toBe('AAWR');
  });

  it("location map last entry should be", function() {
    expect(icaoEntries[entryCount-1][0]).toBe('ZYYY');
  });

  it("active stations should have this many entries (fwiw!)", function () {
    expect(activeCount).toBe(4949);
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
