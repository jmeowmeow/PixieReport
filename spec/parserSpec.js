const fs = require('fs');

const samples = [ 'KFNT', 'KIIY', 'KLAN', 'KSIY', 'NZSP', 'VEJS', 'KYIP', 'KBLI', 'MHGS', 'SVCJ', 'KBRL', 'PANU', 'EHJA', 'KSMO' ];
const expectedParams = {
  KBLI: { degreesC: 1, zuluTime: '06:53Z',  zuluDayOfMonth: '03'},
  KFNT: { degreesC: 22, zuluTime: '03:21Z', zuluDayOfMonth: '12', windSpeedMph: '15-25'},
  KIIY: { degreesC: 22, zuluTime: '03:15Z', zuluDayOfMonth: '12'},
  KLAN: { degreesC: 22, zuluTime: '03:30Z', zuluDayOfMonth: '12'},
  KSIY: { degreesC: 34, zuluTime: '02:53Z', zuluDayOfMonth: '12'},
  KYIP: { degreesC: 32, zuluTime: '19:53Z', zuluDayOfMonth: '22'},
  NZSP: { degreesC: -72, zuluTime: '23:50Z',zuluDayOfMonth: '11'},
  VEJS: { degreesC: 30, zuluTime: '03:05Z', zuluDayOfMonth: '12'},
  MHGS: { degreesC: 29, zuluTime: '22:00Z', zuluDayOfMonth: '16'},
  SVCJ: { degreesC: 31, zuluTime: '17:02Z', zuluDayOfMonth: '10'},
  KBRL: { degreesC: 0, zuluTime: '15:45Z',  zuluDayOfMonth: '15', windSpeedMph: '5'},
  PANU: { degreesC: 18, zuluTime: '18:56Z',  zuluDayOfMonth: '22', windSpeedMph: '7', windDir: 'NW'},
  EHJA: { degreesC: 9, zuluTime: '16:55Z',  zuluDayOfMonth: '24', windSpeedKph: '76', windDir: 'Wind'},
  KSMO: { degreesC: 17, zuluTime: '19:51Z', zuluDayOfMonth: '20', windDir: 'S'},
};

// Given an observation like
// ob: EGSC 171550Z 23019KT CAVOK 32/14 Q1016
// to parse how far a weather report time is off from now, we need a formula like
//
// zReportTime = new Date()
// zReportTime.setUTCFullYear() // not usually
// zReportTime.setUTCMonth() // not usually
// zReportTime.setUTCDate(17)
// zReportTime.setUTCHours(15)
// zReportTime.setUTCSeconds(50)
// howOldIsReport = Date.now() - zReportTime[Symbol.toPrimitive]('number');
// this should generally be milliseconds since observation to now.
// We can use obs age to assess freshness
//
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
// If we stick with decoded METAR, there are lines like this in the readout:
//   Jun 22, 2024 - 02:56 PM EDT / 2024.06.22 1856 UTC
// whose parsed date-time should cross-check with the METAR ob time, 221856Z
//   ob: PANU 221856Z AUTO 31006KT 10SM BKN100 18/08 A2994 RMK AO2 SLP045 T01830083

const expectedAltTextWords = {
  'KFNT': ['night', 'overcast', 'lightning', 'light rain'],
  'KIIY': ['night', 'clear', 'lightning'],
  'KLAN': ['night', 'cloudy', 'lightning', 'mist'],
  'KSIY': ['day', 'overcast'],  // , 'haze'], // we don't render haze in the picture yet
  'NZSP': ['night', 'clear', 'mist'],
  'VEJS': ['day', 'cloudy', 'mist'],
  'KYIP': ['day', 'cloudy'],
  'KBLI': ['night', 'overcast', 'mist'],
  'MHGS': ['day', 'cloudy'], // towering cumulus not yet rendered
  'SVCJ': ['day', 'clear'],
  'PANU': ['day', 'cloudy'], // after adding location, we resolve "day"
};

const { decodedToParamsForStation, decodedToParamObject, computeAltText, Layer, computeTheLayers, computeSceneText} = require('../pixifier/decoded-metar-parser.js');
const resourceDir = __dirname + '/resources';
const { layerDefs } = require(resourceDir + '/' + 'layerDefsTest.js'); // snapshot from main prog layer defs

const loadAndParse = function(icaoName) {
    var metarFile = resourceDir + '/' + icaoName + '.TXT';
    expect(fs.existsSync(resourceDir)).toBeTrue();
    expect(fs.existsSync(metarFile)).toBeTrue();
    const decoded_inputbuf = fs.readFileSync(metarFile, 'utf-8');
    var paramObject = decodedToParamObject(decoded_inputbuf);
    expect(paramObject.stationCode).toBe(icaoName);
    var layers = computeTheLayers(paramObject, layerDefs);
    paramObject.sceneText = computeSceneText(layers);
    return paramObject;
};

describe("decoded metar to param parser", function() {
  beforeAll(function() {
    expect(decodedToParamObject).not.toBe(null);
    expect(computeTheLayers).not.toBe(null);
  });

  it("should parse an empty string", function() {
    const emptyParsedToParam = decodedToParamObject('');
    expect(emptyParsedToParam).toBeDefined();
    expect(emptyParsedToParam).not.toBe(null);
    expect(emptyParsedToParam.stationCode).toBe('????');
  });

  it("should default empty metar to requested station code", function() {
    const emptyParsedToParam = decodedToParamsForStation('', 'KYYX');
    expect(emptyParsedToParam).toBeDefined();
    expect(emptyParsedToParam).not.toBe(null);
    expect(emptyParsedToParam.stationCode).toBe('KYYX');
  });

  it("should parse the sample decoded reports", function() {
    for (const sampleMetar of samples) {
      var toParam = loadAndParse(sampleMetar);
      var descstr = toParam.stationDesc;
      expect(descstr).toMatch('.*(' + sampleMetar + ').*');
    };
  });

  it("should parse the METARs to expected values", function() {
    for (const sampleMetar of samples) {
      var toParam = loadAndParse(sampleMetar);
      var expectedParamsMap = expectedParams[sampleMetar];
      for (const prop of Object.getOwnPropertyNames(expectedParamsMap)) {
        var asFound  = toParam[prop];
        var asSought = expectedParamsMap[prop];
        expect(asFound).withContext('properties.' + prop + ' of '+sampleMetar).toBe(asSought);
      };
    };
  });

});


describe("Layer class constructor", function() {
  it("should pair up a path and a short description", function() {
    const aLayer = new Layer("rainy", "path/to/layer.png");
    expect(aLayer.path).toBe("path/to/layer.png");
    expect(aLayer.desc).toBe("rainy");
  });
});

const altTextLayerCases = [
  [ "On a clear night, a pixel doll dressed for cold weather stands in fog.", [ "night", "clear", "a pixel doll dressed for cold weather", "fog", "frame"] ],
  [ "On an overcast day, a pixel doll dressed for warm weather stands in rain.", [ "day", "overcast", "a pixel doll dressed for warm weather", "rain", "frame"] ],
  [ "On a cloudy dusk with lightning, a pixel doll dressed for cool weather stands in rain. A pole flies two red gale warning pennants.", [ "dusk", "cloudy", "lightning", "a pixel doll dressed for cool weather", "two red gale warning pennants", "rain", "frame"] ],
  [ "On a cloudy night with lightning, Snork Maiden from Moomin, sniffing a plucked flower, looking to one side, with a golden fringe of hair and pale purple skin, wearing only a golden anklet.", [ "night", "cloudy", "lightning", "Snork Maiden from Moomin, sniffing a plucked flower, looking to one side, with a golden fringe of hair and pale purple skin, wearing only a golden anklet.", "frame"] ]
  ];

const layersForTest = function(layerNames) {
  const layersBottomToTop = [];
  for (const layerName of layerNames) {
     layersBottomToTop.push(new Layer(layerName, "path/to/layer/"+layerName+".png"));
  }
 return layersBottomToTop;
}

describe("layer composition", function() {
  it("should compose layers...", function() {
    // expect()...
  });
});

describe("alt text calculation", function() {

  // snapshot to a constant to allow separating functions
  const emptyParsedToParam = {
    stationCode: '????', stationDesc: '????', hectoPressure: '', inHgPressure: '',
    degreesC: null, degreesF: null, windSpeedKph: '', windSpeedMph: '',
    windDir: undefined, zuluTime: '(no time)', zuluDayOfMonth: undefined, skyCover: 'clear', humidity: '',
    weather: [], metar: '', latlong: null, dateTimeUTC: null
  }

  beforeAll(function() {
    expect(computeAltText).not.toBe(null);
    expect(emptyParsedToParam).not.toBe(null);
  });

  it("should emit some alt for empty input", function() {
    var altTextForEmpty = computeAltText(emptyParsedToParam);
    expect(altTextForEmpty).toBeDefined();
    expect(altTextForEmpty).not.toBe(null);
    // documentary rather than definitional
    expect(altTextForEmpty).toBe("Weatherpixie image for ICAO METAR ????, showing undefined");
  });

  it("should generate alt text for the sample parsed reports", function() {
    for (const sampleMetar of samples) {
      var toParam = loadAndParse(sampleMetar);
      var dollDescText = toParam.dollDescText;
      expect(dollDescText).toBeDefined();
      expect(dollDescText).not.toBe(null);
      var altText = computeAltText(toParam);
//      console.log('For '+sampleMetar+', parsed params are\n'+JSON.stringify(toParam));
//      console.log('For '+sampleMetar+', doll desc text is '+toParam.dollDescText);
//      console.log('For '+sampleMetar+', alt text is '+altText);
      expect(altText).toMatch('.*, with Beatrix Potter\'s');

      const words = expectedAltTextWords[sampleMetar];
      if (words) {
        var containsAll = true;
        for (const word of expectedAltTextWords[sampleMetar]) {
            containsAll = containsAll && altText.includes(word);
        }
      if (!containsAll) {
          fail("Expected '" + altText + "'" + ' to include all of [\'' + words.join("', '")+'\']');
        }
      }

    };
  });

});
