'use strict';
const fs = require('fs'); // read stdin; write PNG and text files to __dirname/output
 const { buildWidePngPixie, buildHtmlPixie, buildLocText, computeLayers, computeSceneText, computeAltText, loadAndCompose, decodedToParamObject, canvas, paramProducer, composePixie } = require('./pixie-composer.js');

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

const sample_fallback_params = paramProducer();

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
composePixie(params);
var dollCanvas = canvas;
if (myArgs.length > 0) {
  setTimeout(() => {
    writePngPixie(dollCanvas, params, fs);
  });
} else {
  setTimeout(() => {
    writeHtmlPixie(dollCanvas, params);
  });
}
