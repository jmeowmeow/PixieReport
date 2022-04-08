'use strict';
const fs = require('fs'); // read stdin; write PNG and text files to __dirname/output
 const { buildWidePngPixie, buildHtmlPixie, buildLocText, computeLayers, computeSceneText, computeAltText, loadAndCompose, decodedToParamObject, canvas } = require('./pixie-composer.js');

////////// pixie building above, pixie output below, script args at end

// Canvas to PNG credit:
// https://github.com/Automattic/node-canvas#canvascreatepngstream
// https://flaviocopes.com/canvas-node-generate-image/ (writeFileSync)
// persists tweet components (tweet, widened png image, image alt text)
var writePngPixie = function(opaqueImageCanvas, params, fs) {
  const station = params.stationCode;
  const tweetComponents = { widePng: null, locText: null, altText: null };

  tweetComponents.widePng = buildWidePngPixie(opaqueImageCanvas, params);
  tweetComponents.locText = buildLocText(params);
  tweetComponents.altText = computeAltText(params);

  const imagefilepath = 'output/' + station + '.png';
  fs.writeFileSync(__dirname + '/' + imagefilepath, tweetComponents.widePng);
  console.log('Created '+imagefilepath);

  const tweetfilepath = 'output/' + station + '.txt'
  fs.writeFileSync(__dirname + '/' + tweetfilepath, tweetComponents.locText);
  console.log('Created '+tweetfilepath);

  const altfilepath = 'output/' + station + '.alt.txt'
  fs.writeFileSync(__dirname + '/' + altfilepath, tweetComponents.altText);
  console.log('Created '+altfilepath);
}

var writeHtmlPixie = function(theCanvas, params) {
  // used in a shell pipeline, thus console-out
  console.log(buildHtmlPixie(theCanvas, params));
}

// pixie creation logic above
// -------------------------
// script-args logic below

const sample_fallback_params = {
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
};

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


const everett = {
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

// start of script execution
// read stdin for pixie params
// read argv  for twitter-out vs. html-out

const stdin_fd = 0;
const decoded_inputbuf = fs.readFileSync(stdin_fd, 'utf-8');

var params;

if (decoded_inputbuf.length > 0) {
   params = decodedToParamObject(decoded_inputbuf);
   } else {
   params = sample_fallback_params;
}
var myArgs = process.argv.slice(2);
var dollLayers = computeLayers(params);
var sceneText  = computeSceneText(dollLayers);
if (sceneText) { params.sceneText = sceneText; }
loadAndCompose(dollLayers, params);
var dollCanvas = canvas;
console.log(dollCanvas);
if (myArgs.length > 0) {
  setTimeout(() => {
    writePngPixie(dollCanvas, params, fs);
  });
} else {
  setTimeout(() => {
    writeHtmlPixie(dollCanvas, params);
  });
}
