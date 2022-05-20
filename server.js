// server.js
// default script for 'npm start'
//
// Serves a sample HTML pixie.
//
// First pass:
//   1. Objects have a script lifecycle rather than a server/request lifecycle
//   2. Hacky use of setTimeout() to yield processing to background file i/o

const { buildWidePngPixie, buildHtmlPixie, buildLocText, computeLayers, computeSceneText, computeAltText, loadAndCompose, decodedToParamObject, canvas, paramProducer, composePixie } = require('./pixifier/pixie-composer.js');
const http = require('http');

const hostname = 'localhost';
const port = 3000;

const imgLinkUrlPath = '/'; // we could put random parameters in here, etc.

const substarray = [
 [ '<a name="sub2a"/>', '<a href="' + imgLinkUrlPath + '">'],
 [ '<a name="sub2b"/>', '</a>']
];

const substitutions = new Map(substarray);

const substituteInHtml = function(htmlString) {
  // throw a link around the picture
 var result = htmlString;
 substitutions.forEach( (val, key) => { result = result.replace(key, val) });
 return result;
}

const sampleOutput = function(res) {
  var p = paramProducer();
  composePixie(p); // side effects cause image to be composed onto canvas
  // buildHtmlPixie produces a whole document, but it knows nothing of the server context for linking, etc.
  var htmlPixie = buildHtmlPixie(canvas, p); // template merged w/params and data URL for canvas image
  var demoServerOut = substituteInHtml(htmlPixie);
  res.end(demoServerOut);
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
    composePixie(paramProducer());
  });
  console.log('Dispatched a background fetch of pixie layer files');
});
