'use strict';
const fs = require('fs'); // read pixie layers
const { decodedToParamObject, windSpeed, computeAltText, Layer, computeTheLayers, computeSceneText, worldMapLink } = require('./decoded-metar-parser.js');

// pixie-composer.js
//
// Weatherpixie layer compositing
// Originally derived from https://github.com/Automattic/node-canvas#quick-example
// input:
//  in order to write the bottom weather banner we need
//   temp hum% time
//   WDIR WSPD pressure
//  in order to compose the pixie we need
//   (which pixie)
//   is it day, night, or twilight? (sun, stars, pink or gray twilight)
//   sky conditions / clouds (clouds)
//   high wind lights or flags
//   temp (clothes)
//   weather conditions (mist, fog, rain, haze, snow, smoke)

const { createCanvas, loadImage } = require('canvas')

const path = require('path');
const cwd  = __dirname;

const pixiewidth  = 125;
const pixieheight = 175;
const canvas = createCanvas(pixiewidth, pixieheight);

// messy start at HTML template output for buildHtmlPixie
const favicon = "\n<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Ctext%20x='0'%20y='14'%3E⛅%3C/text%3E%3C/svg%3E\" type=\"image/svg+xml\" />\n";
const prolog1 = '<html><head><title>Station ';
const prolog2 = '</title>' +
  '<style>' + 'table { background: rgb(255,255,255); }' +
  'table { background: linear-gradient(45deg, rgba(0,212,255,1) 0%, rgba(220,80,80,1) 50%, rgba(0,212,255,1) 100%); }' + '</style>' +
  favicon +
  '</head><body>\n';
const prolog3 = '<a name="sub1"/><table cellpadding="10"><tr>';
const epilog = '</tr></table>\n<a name="sub3"/>\n</body></html>';

var tightenLocationSpacing = function(location) {
  var loc = location;
  loc = loc.replace(" *", " ");
  loc = loc.replace(/( ){2,}/g, " ");
  loc = loc.replace(/ ,/g, ",");
  return loc;
}

var abbreviateLocation = function(location) {
  var loc = location;
  loc = loc.replace(/^([A-Za-z ]*), (\1)/, '$1'); // "City, City Airport..."
  loc = loc.replace("Automatic", "Auto");
  loc = loc.replace("AUTOMATIC", "AUTO");
  loc = loc.replace("International", "Intl");
  loc = loc.replace("INTERNATIONAL", "INTL");
  loc = loc.replace('INTERNTL', 'INTL'); // KLAX
  loc = loc.replace("Regional", "Regl");
  loc = loc.replace("REGIONAL", "REGL");
  loc = loc.replace("Municipal", "Muni");
  loc = loc.replace("MUNICIPAL", "MUNI");
  loc = loc.replace("Airport", "Apt");
  loc = loc.replace("AIRPORT", "APT");
  loc = loc.replace("Field", "Fld");
  loc = loc.replace("FIELD", "FLD");
  loc = loc.replace("Island", "Isl");
  loc = loc.replace("ISLAND", "ISL");
  loc = loc.replace("Lake ", "Lk "); // Lakenheath Royal Air Force Base
  loc = loc.replace("LAKE ", "LK ");
  loc = loc.replace("Auxiliary", "Aux");
  loc = loc.replace("AUXILIARY", "AUX");
  loc = loc.replace("AIR FORCE BASE", "AFB");
  loc = loc.replace("Air Force Base", "AFB");
  loc = loc.replace("AIR FORCE", "AF"); // must come after AFB
  loc = loc.replace("Air Force", "AF");
  loc = loc.replace("United States", "USA");
  loc = loc.replace("UNITED STATES", "USA");
  loc = loc.replace("United Kingdom", "UK");
  loc = loc.replace("UNITED KINGDOM", "UK");
  loc = loc.replace("New Zealand", "NZ");
  loc = loc.replace("NEW ZEALAND", "NZ");
  loc = tightenLocationSpacing(loc);
  return loc;
}

function useMetric(params) {
  if (params.stationCode.startsWith("K")) {
    return false; // Continental US plus one 'VI'
  }
  if (params.stationCode.startsWith("TJ")) {
    return false; // Puerto Rico
  }
  if (params.stationCode.startsWith("PH")) {
    return false; // Hawaii
  }
  if (params.stationCode.startsWith("P") && params.latlong.degLat > 50.0) {
    return false; // Alaska
  }
  // "P...": missing some stations in US Pacific island territories
  return true;
}

// write after top layer black frame loaded
// alt text can include a version of this weather report text.
async function writeTextOnPixie(canvas_2d, params) {
  const c2d = canvas_2d;
  const tilt_ccw =  -1.570796326795; // -90 degrees in radians
  const tilt_cw  =   1.570796326795; //  90 degrees in radians
  const weatherFont = 'bold 11px Menlo';
  const timeFont = 'bold 9px Menlo';
  var temphum = ''; var windbar = '';
  if (useMetric(params)) {
    if (params.degreesCstr) {
      temphum = temphum + params.degreesCstr + 'C ';
    } else {
      temphum = '     ';
    }
    if (params.humidity) {
      temphum = temphum + params.humidity;
    }
    if (!params.windDir) {
        windbar = '       ';
    } else if (params.windDir == "Calm") {
        windbar = '' + params.windDir  + '  ';
    } else {
        windbar = '' + params.windDir  + ' ' + params.windSpeedKph + 'kph ';
    }
    if (params.hectoPressure == '') {
    } else {
      windbar = windbar + params.hectoPressure + 'hPa';
    }
  } else { // non-metric
    if (params.degreesFstr) {
      temphum = temphum + params.degreesFstr + 'F ';
    } else {
      temphum = '     ';
    }
    if (params.humidity) {
      temphum = temphum + params.humidity;
    }
    if (!params.windDir) {
        windbar = '       ';
    } else if (params.windDir == "Calm") {
      windbar = '' + params.windDir  + '  ';
    } else {
      windbar = '' + params.windDir  + ' ' + params.windSpeedMph + 'mph ';
    }
    if (params.inHgPressure == '') {
    } else {
      windbar = windbar + params.inHgPressure + 'mmHg';
    }
  }

  // choose a side label to ID the location
  var location_label = params.stationCode;

  var guess_at_name_end = params.stationDesc.lastIndexOf(' (');
  if (guess_at_name_end > 0) {
    location_label = params.stationDesc.substring(0, guess_at_name_end);
    location_label = abbreviateLocation(location_label);
  }

  // computed text: temphum, windbar, zuluTime, location_label
  //   caution: params.fieldName and fn(metar)->text names aliased, e.g. zuluTime
  // console.log("Computed from weather params: ["+temphum+", "+windbar+", "+params.zuluTime+", "+location_label+".]");


  // weather
  c2d.font = weatherFont;
  c2d.fillStyle = 'rgba(255,255,255,1.0)';
  c2d.fillText(temphum, 2, 160);
  c2d.fillText(windbar, 2, 172);

  // time
  c2d.fillStyle = 'rgba(127,255,127,1.0)';
  c2d.font = timeFont;
  c2d.fillText(params.zuluTime, 77, 160);


  // text going upward along L or R margin
  // right side: const lineY=120; const textY=123;
  // left side:  const lineY=5;   const textY=8;
  const lineY=5; const textY=8;
  c2d.rotate(tilt_ccw)
  var textextent = c2d.measureText(location_label);
  c2d.strokeStyle = 'rgba(255,63,63,0.3)';
  c2d.lineWidth = 10.0;
  c2d.beginPath();
  c2d.lineTo(-150, lineY); c2d.lineTo(-146 + textextent.width, lineY);
  c2d.stroke();

  c2d.fillText(location_label, -148, textY);
  c2d.rotate(tilt_cw)
}

// trying async/await for loadImage - though really the sync calls are fine for our model
// but the "async function" turns the return value into a Promise that might not be fulfilled
// so we'll pass a reference to the canvas separately, argh
async function loadAndCompose(layers, parsedData) {
  var context2d = canvas.getContext('2d');
  // Compose image on node-canvas instance
  for (const layer of layers) {
    await loadImage(layer.path).then((image) => { context2d.drawImage(image, 0, 0) });
  }
  await writeTextOnPixie(context2d, parsedData); // maybe await not needed?
}

// Layer image file resources
//  These can be accompanied by descriptions for alt text; for
//  for the different pixel doll flavors, we need to describe each
//  one in parallel to the resource files in that pixie folder

// const pix = './pixies/pixiemoomin/';
// const pix = './pixies/pixiebunny/';
// const pix = './pixies/pixieselfie/';
// const pix = './pixies/pixiexmas/';
// const pix = './pixies/pixie0/';
// const pix = './pixies/pixie10/'; // Pioneer 10
const pixies = [
        './pixies/pixiemoomin/',
        './pixies/pixiebunny/',
        './pixies/pixie0/',
        './pixies/pixieselfie/'
               ];
const pix = path.join(cwd, pixies[Math.floor(Math.random() * pixies.length)]);
const dolls = [pix + 'pixie-icy.png',  pix + 'pixie-cold.png', pix + 'pixie-cool.png',
               pix + 'pixie-warm.png', pix + 'pixie-hot.png' ];

var dollDescByTemp = {};
var dollLayerByTemp = {};

const noDollLayer = new Layer('no pixel doll shown',
                              path.join(cwd, './pixies/skycond/blank.png'));

try {
   const { dollsByWeather } = require(pix +'dolldesc.js');
   dollDescByTemp = dollsByWeather;
} catch (missingdesc) {
   console.log(missingdesc.message);
   dollDescByTemp = {
     0: "a pixel doll dressed for icy weather",
     1: "a pixel doll dressed for cold weather",
     2: "a pixel doll dressed for cool weather",
     3: "a pixel doll dressed for warm weather",
     4: "a pixel doll dressed for hot weather"
   };
}

// we now have dolls and dollDescByTemp, so: temp -> (description, path)
dollLayerByTemp = {
  0: new Layer(dollDescByTemp[0], dolls[0]),
  1: new Layer(dollDescByTemp[1], dolls[1]),
  2: new Layer(dollDescByTemp[2], dolls[2]),
  3: new Layer(dollDescByTemp[3], dolls[3]),
  4: new Layer(dollDescByTemp[4], dolls[4])
}

const highwind = path.join(cwd, './pixies/highwind/');
// lights
const nighthighwind = [
        new Layer('a high wind beacon', highwind + 'nightwarn.png'),
        new Layer('a gale beacon', highwind + 'nightgale.png'),
        new Layer('a storm beacon', highwind + 'nightstorm.png'),
        new Layer('a hurricane beacon', highwind + 'nighthurricane.png')
        ];

// flags
const dayhighwind = [
        new Layer('a red high wind warning pennant', highwind + 'daywarn.png'),
        new Layer('two red gale warning pennants', highwind + 'daygale.png'),
        new Layer('a red and black storm warning flag', highwind + 'daystorm.png'),
        new Layer('two red and black hurricane warning flags', highwind + 'dayhurricane.png')
        ];

// clear         => blank.png
// mostly clear  => clouds.png
// partly cloudy => clouds.png
// mostly cloudy => clouds.png
// overcast      => overcast.png
// obscured      => overcast.png

const skycond = [ new Layer('clear',    path.join(cwd, './pixies/skycond/blank.png')),
                  new Layer('cloudy' ,  path.join(cwd, './pixies/skycond/clouds.png')),
                  new Layer('overcast', path.join(cwd, './pixies/skycond/overcast.png')) ];

// mapping from parsed sky cover
const skyhash = {
      'clear':         skycond[0],
      'mostly clear':  skycond[1],
      'partly cloudy': skycond[1],
      'mostly cloudy': skycond[1],
      'overcast':      skycond[2],
      'obscured':      skycond[2]
      };

// mapping from parsed weather line, "Weather: rain; mist; Lightning observed"
// note that our naive tokenizing causes this hash to miss weather like
// "light rain with thunder", "rain showers in the vicinity" and many combined conditions.
// In order to make this kind of sensible, we should hash from
// a METAR term to ["short weather name", "path"]
const weathercond = [
  new Layer('', path.join(cwd, './pixies/weather/blank.png')),
  new Layer('drizzle', path.join(cwd, './pixies/weather/drizzle.png')),
  new Layer('light rain', path.join(cwd, './pixies/weather/ltrain.png')),
  new Layer('rain', path.join(cwd, './pixies/weather/rain.png')),
  new Layer('mist', path.join(cwd, './pixies/weather/mist.png')),
  new Layer('fog',  path.join(cwd, './pixies/weather/fog.png')),
  new Layer('light snow',  path.join(cwd, './pixies/weather/ltsnow.png')),
  new Layer('snow',  path.join(cwd, './pixies/weather/snow.png')),
  new Layer('heavy snow',  path.join(cwd, './pixies/weather/snow.png'))
]

// weather we know: keys of weatherhash (drizzle, rain, mist, fog, snow)
// weather we don't: haze, smoke, dust, volcanic ash
const weatherhash = {
      'none':            weathercond[0],
      'light drizzle':   weathercond[1],
      'drizzle':         weathercond[1],
      'heavy drizzle':   weathercond[1],
      'light rain':      weathercond[2],
      'rain':            weathercond[3],
      'heavy rain':      weathercond[3],
      'mist':            weathercond[4],
      'fog':             weathercond[5],
      'patches of fog':  weathercond[5],
      'light snow':      weathercond[6],
      'snow':            weathercond[7],
      'heavy snow':      weathercond[7],
      };

const lightningLayer = new Layer('lightning', path.join(cwd, './pixies/weather/lightning.png')); // after clouds, before doll
const bgd = path.join(cwd, './pixies/backgrounds/');
console.log("background path: "+bgd);
const bkgd = [new Layer("night", bgd + 'starrynightbkg.png'),
              new Layer("gray twilight", bgd + 'graybackground.png'),
              new Layer("dusk", bgd + 'pinkbackground.png'),
              new Layer("day", bgd + 'sunnybackground.png') ];
const frame = new Layer("frame", bgd + 'blackframe.png');

// supporting testability of computeLayers; coalesce the external layers definitions here
  const mainLayerDefs = {
     bkgd: bkgd,
     skyhash: skyhash,
     lightningLayer: lightningLayer,
     noDollLayer: noDollLayer,
     dollLayerByTemp: dollLayerByTemp,
     dayhighwind: dayhighwind,
     weatherhash: weatherhash,
     frame: frame
  };

var computeLayers = function(parsedData) {
  // Could we pass these in as an array of functions to apply?
  // iterate over the fns and get
  // for fn in layerfns
  //   layerfile = fn.apply(layerfile, parsedData)
  //   where "apply" pushes zero or more Layer instances onto layerfile[].
  // that would allow the choosing logic to be abstracted from the layer defining logic

  // the computeLayers logic mingles decision logic useful for
  //   alt-text with image file name layering. By returning an
  //   array of Layer objects, we return a (path, desc) for
  //   each, allowing the path to be used for loading the PNG
  //   layers composing the image, alongside a "desc" field useful
  //   for computing alt text.

  var layerfile = computeTheLayers(parsedData, mainLayerDefs);
  return layerfile;
}

var buildHtmlPixie = function(theCanvas, params) {
  var thePixie = '';
  const metar = params.metar;
  thePixie = thePixie + prolog1 + params.stationDesc + prolog2 + '\n';
  const alttext_label = computeAltText(params);
  thePixie = thePixie + prolog3 + '<td><a name="sub2a"/><img title="' +
             params.stationDesc + '" alt="' + alttext_label +
             '" src="' + theCanvas.toDataURL() + '" /><a name="sub2b"/></td>' + '\n';
  thePixie = thePixie + epilog + '\n';
  return thePixie;
}

var buildLocText = function(params) {
  // location text used to compose the tweet text
  // compute location text
  const station = params.stationCode;
  var location_label = "";
  if (params.stationDesc && params.stationDesc.length > 4) {
    location_label = tightenLocationSpacing(params.stationDesc);
  } else {
    location_label = "ICAO METAR " + params.stationCode;
  }
  const mapLink = worldMapLink(params);
  var location_output = location_label;
  if (mapLink && mapLink != '') {
    location_output = `${location_label} ${mapLink}`
  };

  return location_output;
}

var buildWidePngPixie = function(pixieCanvas, params) {
  // composite the pixie into the center of a wider transparent canvas
  const station = params.stationCode;
  const widecanvas = createCanvas(pixiewidth*3, pixieheight);
  const widectx = widecanvas.getContext('2d');
  const xoffset = pixiewidth;
  widectx.drawImage(pixieCanvas, xoffset, 0);
  return widecanvas.toBuffer('image/png');
}

var ksea = {
  stationCode: 'KSEA',
  stationDesc: 'Seattle-Tacoma International Airport',
  hectoPressure: '1006',
  inHgPressure: '29.69',
  degreesC: 7,
  degreesCstr: '7',
  degreesF: 44.6,
  degreesFstr: '45',
  windSpeedKph: '19',
  windSpeedMph: '12',
  windDir: 'S',
  zuluTime: '04:53Z',
  skyCover: 'overcast',
  weather: ['light rain', 'mist'],
  humidity: '85%',
  metar: 'KSEA 130453Z 17010KT 6SM -RA BR OVC026 07/05 A2969 RMK AO2 SLP062 P0007 T00720050'
}

var vibr = {
  stationCode: 'VIBR',
  stationDesc: 'VIBR',
  hectoPressure: '1020',
  inHgPressure: '30.09',
  degreesC: 17,
  degreesCstr: '17',
  degreesF: 62.6,
  degreesFstr: '63',
  windSpeedKph: '0',
  windSpeedMph: '0',
  windDir: 'Calm',
  zuluTime: '05:00Z',
  skyCover: 'mostly clear',
  humidity: '45%',
  metar: 'VIBR 050500Z 00000KT 5000 HZ FEW035 17/05 Q1020'
};

const kpae = {
  stationCode: 'KPAE',
  stationDesc: 'Paine Field, Everett WA',
  hectoPressure: '1009',
  inHgPressure: '29.79',
  degreesC: 5,
  degreesCstr: '5',
  degreesF: 41,
  degreesFstr: '41',
  windSpeedKph: '17-30',
  windSpeedMph: '10-18',
  windDir: 'ESE',
  zuluTime: '01:10Z',
  skyCover: 'overcast',
  humidity: '85%',
  metar: 'KPAE 150110Z AUTO 12009G16KT 6SM -RA BR OVC028 05/03 A2979 RMK AO2 PRESFR P0001 T00500028'
};

var samples = [ ksea, vibr, kpae ];

const sampleParams = samples[Math.floor(Math.random() * samples.length)];

// implicitly depends on canvas as in/out via loadAndCompose
// params and canvas are both mutated references
var composePixie = function(params) {
  var dollLayers = computeLayers(params);
  var sceneText  = computeSceneText(dollLayers);
  if (sceneText) { params.sceneText = sceneText; }
  loadAndCompose(dollLayers, params);
}

exports.buildWidePngPixie = buildWidePngPixie;
exports.buildHtmlPixie = buildHtmlPixie;
exports.buildLocText = buildLocText;
exports.computeLayers = computeLayers;
exports.computeSceneText = computeSceneText;
exports.computeAltText = computeAltText;
exports.loadAndCompose = loadAndCompose;
exports.decodedToParamObject = decodedToParamObject; // forwarded to script driver
exports.canvas = canvas; // icky, but I couldn't figure out how to return from loadAndCompose so sort it out later
exports.sampleParams = sampleParams; // moved here to the importable definitions to use in the demo server
exports.composePixie = composePixie; //   "    "   "  ...
