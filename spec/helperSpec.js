// helperSpec.js
// testing independent helper functions
// with no external test fixture resources loaded

// functions under test
const {worldMapLink} = require('../pixifier/decoded-metar-parser.js');

// embedded fixture data and specs
const sampleLatLongParams = [
  { latlong: {degLat:42.96666666666667, degLong:-83.75} },
  { latlong: {degLat:33.77972222222222, degLong:-82.81638888888888} },
  { latlong: {degLat:42.78333333333333, degLong:-84.58333333333333} },
  { latlong: {degLat:41.766666666666666, degLong:-122.46666666666667} },
  { latlong: {degLat: 47.60, degLong: -122.33} },
  { latlong: {degLat:22.816666666666666, degLong:86.18333333333334} },
  { latlong: {degLat:42.233333333333334, degLong:-83.53333333333333} },
  { latlong: {degLat:-90, degLong:0} }
];

describe("latlong to worldMapLink helper", function() {
  beforeAll(function() {
    expect(worldMapLink).not.toBe(null);
  });

  it("should return nolink for missing latlong input", function() {
    // maybe switch to empty string later?
    expect(worldMapLink('')).toBe('');
    expect(worldMapLink(null)).toBe('');
    expect(worldMapLink( {} )).toBe('');
    expect(worldMapLink( {latlong: null } )).toBe('');
    expect(worldMapLink( {latlong: {} } )).toBe('');
  });

  // https://www.openstreetmap.org/#map=10/47.6233/-122.4316
  it("should parse the latlong samples to URLs", function() {
    for (const latlongp of sampleLatLongParams) {
      const latlongstr = JSON.stringify(latlongp);
      const theLink = worldMapLink(latlongp);
      expect(theLink).toMatch('.*(www.openstreetmap.org).*', `for ${latlongstr}`);
    };
  });

});
