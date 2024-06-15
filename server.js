const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;
const {stations, resources, Jimp} = require('./preloads');
const {compose} = require('./compose-async');
const {decodedToParamObject, worldMapLink} = require('./pixifier/decoded-metar-parser'); //icao.js used
const {computeImageTextValues} = require('./pixifier/compute-image-text');

const codes = [];
for (const stn of stations.keys()) {codes.push(stn);};
const randomStation = function () {
 const scount = 8696.0;
 const idx = Math.trunc(Math.random() * scount);
 return codes[idx];
}

const shortStationName = function(stn) {
  let loc = stations.get(stn);
  if (loc) {
    let tailExp = new RegExp("\\("+stn+".*");
    loc = loc.replace(tailExp, "");
  } else {
    loc = "";
  }
  return loc;
}

app.get('/', (req, res) => {
  const stationChoices = [
  'KSEA', 'KPAE', 'KBFI', 'KBLI', 'KSFO', 'EGLC', 'EGGD', 'LIMC', 'SAWH'
  ];
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  let body = "";
  let link = "<a href='${url}'>${url}</a><br/>";
  let metarLink = "m <a title='METAR ${station}' href='/metar?location=${station}'>${station}</a>";
  let jsonLink  = "j <a title='json prettyprint ${station}' href='/json?location=${station}'>${station}</a>";
  let pixieLink  = "p <a title='pixie ${station}' href='/pixie?location=${station}'>${station}</a> | <i><a title='developer ${station}' href='/compose?location=${station}'>d</a></i>";
  let locationLink = "${location}";
  let reportLink = `<tr><td>${metarLink}</td><td>${jsonLink}</td><td>${pixieLink}</td><td>${locationLink}</td></tr>\n`;
  body += "<table border><thead><tr><th>METAR Report</th><th>Pixie Params</th><th>Composed Pixie</th><th>Location</th></tr></thead>\n"
  stationChoices.map(stn =>
  {
    let loc = shortStationName(stn);
    body += reportLink.replace(/\${station}/g, stn).replace(/\${location}/, loc);
  });
  body += reportLink.replace(/\${station}/g, 'NZSP').replace(/\${location}/, shortStationName('NZSP'));
  body += reportLink.replace(/\${station}/g, 'XKXK').replace(/\${location}/, '(unknown station)');
  body += "</table><br/>"
  body += link.replace(/\${url}/g, '/compose');
  body += link.replace(/\${url}/g, '/pixie');
  res.send(body);
});

const redirectDefaultLocation = (req, res) => {
  let redirection = req.path + '?location=KSEA';
  res.redirect(redirection);
};

const KLAN = `
CAPITAL CITY AIRPORT, MI, United States (KLAN) 42-47N 084-35W 264M
Aug 11, 2021 - 11:30 PM EDT / 2021.08.12 0330 UTC
Wind: from the S (190 degrees) at 10 MPH (9 KT):0
Visibility: 6 mile(s):0
Sky conditions: mostly cloudy
Weather: light rain with thunder; mist; Lightning observed
Precipitation last hour: 0.03 inches
Temperature: 72.0 F (22.2 C)
Dew Point: 69.1 F (20.6 C)
Relative Humidity: 90%
Pressure (altimeter): 29.88 in. Hg (1011 hPa)
ob: KLAN 120330Z 19009KT 6SM -TSRA BR FEW049 SCT075 BKN110 22/21 A2988 RMK AO2 LTG DSNT ALQDS TSE0258B30 P0003 T02220206
cycle: 3`;

const defaultReport = (location) => {
  let loc = location;
  if (stations[loc]) {
    return KLAN;
  } else {
    return `Could not retrieve observation from station code ${loc}.`;
  }
}

// allows offline testing using fixed cache-for-test
const fetchMetarFile = async (location) => {
  let metarFile = `spec/resources/${location}.TXT`;
  try {
    let report = fs.readFileSync(metarFile, 'utf-8');
    return report;
  } catch(error) {
    console.error(JSON.stringify(error, null, 2));
  }
  return defaultReport(location);
};

const fetchMETAR = async (location) => {
  // note new METAR API endpoint after text server was announced
  // as discontinued but text URL is working 2024-03-25. Be wary.
  // https://aviationweather.gov/data/api/#/Data/dataMetars
  //
  // also note the bulk all-current-METARs cache updated by minute.
  // https://aviationweather.gov/data/cache/metars.cache.csv.gz
  let url = `https://tgftp.nws.noaa.gov/data/observations/metar/decoded/${location}.TXT`;
  console.log("Fetching", url);
  let report = await fetch(url).then(response => response.text()).catch(error => { console.error(JSON.stringify(error, null, 2)); return fetchMetarFile(location) });
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
  const imageText = JSON.stringify(computeImageTextValues(jsonReport));
  let jsonBody = `<pre>${JSON.stringify(jsonReport, null, 2)}\n${imageText}</pre>`;
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
  const report = await fetchMETAR(location);
  const params = decodedToParamObject(report);
  let title = `Pixel Doll Weather Report from ${location}.`;
  params.text = title;
  var [pixie, alt]= await compose(params).catch(console.error);
  let jsonOutput = JSON.stringify(params, null, 2);
  // add a "stations" lookup
  let icaoLocData = stations.get(location);
  let mapUrl = worldMapLink(params);
  let mapLink = '';
  if (mapUrl.startsWith('http')) {
     mapLink = `<a href="${mapUrl}">${mapUrl}</a>`;
  }
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const responseBody = `<img alt="${alt}" src="${src}" title="${title}" /><br/><p>alt=${alt}</p><p>icaoLocData=${icaoLocData}</p><p>mapLink=${mapLink}</p><pre>${jsonOutput}</pre>`;
    res.send(responseBody); });
});

// parameters: airport code, C/F, which pixie set; optional!
app.get('/pixie', async (req, res) => {
  const location = req.query.location;
  if (location === undefined) {
    redirectDefaultLocation(req, res);
    return;
  }
  const myReport = await fetchMETAR(location);
  const params = decodedToParamObject(myReport);
  let title = `Pixel Doll Weather Report from ${location}.`;
  params.text = title;
  var [pixie, alt]= await compose(params).catch(console.error);
  // add a "stations" lookup
  let icaoLoc = stations.get(location);
  let mapUrl = worldMapLink(params);
  let mapLink = '';
  if (mapUrl.startsWith('http')) {
     mapLink = `<p><a href="${mapUrl}">${location} OpenStreetMap</a></p>`;
  }
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const responseBody = `<img alt="${alt}" src="${src}" title="${title}" /><br/><p>${icaoLoc}</p>${mapLink}`;
    res.send(responseBody); });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
