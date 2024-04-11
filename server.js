const express = require('express');
const app = express();
const port = 3000;
const {compose, Jimp} = require('./compose-async');
const {decodedToParamObject} = require('./pixifier/decoded-metar-parser');

app.get('/', (req, res) => {
  let body = "";
  let link = "<a href='${url}'>${url}</a><br/>";
  let metarLink = "m <a title='METAR ${station}' href='/metar?location=${station}'>${station}</a>";
  let jsonLink  = "j <a title='json prettyprint ${station}' href='/json?location=${station}'>${station}</a>";
  let pixieLink  = "p <a title='pixie ${station}' href='/compose?location=${station}'>${station}</a>";
  let reportLink = `<tr><td>${metarLink}</td><td>${jsonLink}</td><td>${pixieLink}</td></tr>\n`;
  body += "<table border><thead><tr><th>METAR Report</th><th>Pixie Params</th><th>Composed Pixie</th></tr></thead>\n"
  body += reportLink.replace(/\${station}/g, 'KSEA');
  body += reportLink.replace(/\${station}/g, 'KPAE');
  body += reportLink.replace(/\${station}/g, 'KBFI');
  body += reportLink.replace(/\${station}/g, 'KSFO');
  body += reportLink.replace(/\${station}/g, 'LIMC');
  body += reportLink.replace(/\${station}/g, 'NZSP');
  body += reportLink.replace(/\${station}/g, 'XKXK');
  body += "</table><br/>"
  body += link.replace(/\${url}/g, '/compose');
  body += link.replace(/\${url}/g, '/pixie');
  res.send(body);
});

const redirectDefaultLocation = (req, res) => {
  let redirection = req.path + '?location=KSEA';
  res.redirect(redirection);
};

const defaultReport = (location) => {
  let loc = location;
  return `Could not retrieve observation from station code ${loc}.`;
}

const fetchMETAR = async (location) => {
  // note new METAR API endpoint after text server was announced
  // as discontinued but text URL is working 2024-03-25. Be wary.
  // https://aviationweather.gov/data/api/#/Data/dataMetars
  //
  // also note the bulk all-current-METARs cache updated by minute.
  // https://aviationweather.gov/data/cache/metars.cache.csv.gz
  let url = `https://tgftp.nws.noaa.gov/data/observations/metar/decoded/${location}.TXT`;
  console.log("Fetching", url);
  let report = await fetch(url).then(response => response.text()).catch(error => { console.error(JSON.stringify(error, null, 2)); return defaultReport(location) });
  return report;
}

app.get('/json', async (req, res) => {
  const location = req.query.location;
  if (location === undefined) {
    redirectDefaultLocation(req, res);
    return;
  }
  const textReport = await fetchMETAR(location);
  const jsonReport = decodedToParamObject(textReport);
  let jsonBody = `<pre>${JSON.stringify(jsonReport, null, 2)}</pre>`;
  res.send(jsonBody);
});

app.get('/metar', async (req, res) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  // if location is not provided, redirect to /metar?location=KSEA
  const location = req.query.location;
  if (location === undefined) {
    redirectDefaultLocation(req, res);
    return;
  }
  let report = await fetchMETAR(location);
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Hello from ${location}, report follows:\n ${report}`);
});

app.get('/compose', async (req, res) => {
  const location = req.query.location;
  if (location === undefined) {
    redirectDefaultLocation(req, res);
    return;
  }
  let report = await fetchMETAR(location);
  const params = decodedToParamObject(report);
  params.text = `Hello from ${location}.`;
  var pixie = await compose(params).catch(console.error);
  let jsonOutput = JSON.stringify(params, null, 2);
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => { res.send(`<img src="${src}" /><br/><pre>${jsonOutput}</pre>`) });
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