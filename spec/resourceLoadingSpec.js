describe("preloads of resources should produce images and lookups", function() {

// preloaded data files and image layers, Jimp image package
// using CommonJS require() - consider possible time lag for async load of files?

  const {stations, activeMetarStations, stationsByLat, stationsByLong, resources, Jimp} = require('../preloads');


  it(`should have loaded`, function() {
    console.log("should have loaded 1");
  });

  it(`should have loaded by now anyway?`, function() {
    console.log("should have loaded 2");
  });


});
