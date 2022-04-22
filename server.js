// server.js
// default script for 'npm start'
//
// Serves a sample HTML pixie.
//
// First pass:
//   1. Objects have a script lifecycle rather than a server/request lifecycle
//   2. Hacky use of setTimeout() to yield processing to background file i/o

const { buildWidePngPixie, buildHtmlPixie, buildLocText, computeLayers, computeSceneText, computeAltText, loadAndCompose, decodedToParamObject, canvas, sampleParams, composePixie } = require('./pixifier/pixie-composer.js');
const http = require('http');

const hostname = 'localhost';
const port = 3000;

const sampleOutput = function(res) {
  var p = sampleParams;
  composePixie(p);
  res.end(buildHtmlPixie(canvas, p));
};

const server = http.createServer((req, res) => {
  console.log(`serving request for ${req.url} from ${req.headers['user-agent']}`);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  setTimeout(() => {
    sampleOutput(res);
  });

  });

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Canvas width x height = ${canvas.width}x${canvas.height}`);
  // warm up the filesystem I guess?
  setTimeout(() => {
    composePixie(sampleParams);
  });
  console.log('Dispatched a background fetch of pixie layer files');
});
