const express = require('express');
const app = express();
const port = 3000;
const {compose, Jimp} = require('./compose-async');
const {decodedToParamObject} = require('./pixifier/decoded-metar-parser');

app.get('/', (req, res) => {
  let body = "";
  let link = "<a href='${url}'>${url}</a><br/>";
  body += link.replace(/\${url}/g, '/metar?location=KSEA');
  body += link.replace(/\${url}/g, '/metar?location=KPAE');
  body += link.replace(/\${url}/g, '/metar?location=KBFI');
  body += link.replace(/\${url}/g, '/metar?location=KSFO');
  body += link.replace(/\${url}/g, '/compose');
  body += link.replace(/\${url}/g, '/pixie');
  res.send(body);
});

const fetchMETAR = async (location) => {
  // note new METAR API endpoint after text server was announced
  // as discontinued but text URL is working 2024-03-25. Be wary.
  // https://aviationweather.gov/data/api/#/Data/dataMetars
  //
  // also note the bulk all-current-METARs cache updated by minute.
  // https://aviationweather.gov/data/cache/metars.cache.csv.gz
  let url = `https://tgftp.nws.noaa.gov/data/observations/metar/decoded/${location}.TXT`;
  console.log("Fetching", url);
  let report = await fetch(url).then(response => response.text()).catch(console.error);
  return report;
}

app.get('/json', async (req, res) => {
  const textReport = await fetchMETAR('KSEA');
  const jsonReport = decodedToParamObject(textReport);
  res.setHeader('Content-Type', 'application/json');
  res.send(jsonReport);
});

app.get('/metar', async (req, res) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  // if location is not provided, redirect to /metar?location=KSEA
  const location = req.query.location; // ?location=KSEA (a METAR station)
  if (location === undefined) {
    res.redirect('/metar?location=KSEA');
    return;
  }
  let report = await fetchMETAR(location);
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Hello from ${location}, report follows:\n ${report}`);
});

app.get('/compose', async (req, res) => {
  var pixie = await compose().catch(console.error);
  // 8 or 16
  await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then((font) => {
    pixie.print(font, 10, 10, "Hello world!");
  });
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => { res.send(`<img src="${src}" />`) });
});

// parameters: airport code, C/F, which pixie set; optional!
app.get('/pixie', (req, res) => {
  // if either location or temp is not provided, redirect to /pixie?location=KSEA&temp=F
  const location = req.query.location; // ?location=KSEA (a METAR station)
  const tempUnit = req.query.temp; // ?temp=F
  if (location === undefined || tempUnit === undefined) {
    res.redirect('/pixie?location=KSEA&temp=F');
    return;
  }
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Hello from ${location}
The temperature is 30 ${tempUnit}`)
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});