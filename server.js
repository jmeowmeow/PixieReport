const tStart = Date.now();
const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;
const {stations, activeMetarStations, stationsByLat, stationsByLong, resources, Jimp} = require('./preloads');
const {compose} = require('./compose-async');
const {decodedToParamsForStation, worldMapLink} = require('./pixifier/decoded-metar-parser'); //icao.js used
const {computeImageTextValues} = require('./pixifier/compute-image-text');
const {cache} = require('./webapp/cache');

const favicon = "\n<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Ctext%20x='0'%20y='14'%3E⛅%3C/text%3E%3C/svg%3E\" type=\"image/svg+xml\" />\n";

const pagetitle = "PixieReport Webapp";
const pagehead = `<head><title>${pagetitle}</title>\n${favicon}</head>`; // maybe <title/> is in order?

const anchor = function(url, text) {
  return `<a href="${url}">${text}</a>`;
};

const navigationLinks = [
  {url: '/', text: 'Home'},
  {url: '/about', text: 'About'},
  {url: '/random', text: 'Random'},
  {url: '/pixie', text: 'Pixie'},
  {url: '/compose', text: 'devpixie'},
  {url: '/png', text: 'img'},
  {url: '/metar', text: 'metar'},
  {url: '/uptime', text: 'uptime'},
  {url: '/stations', text: 'stations'},
  {url: '/cache', text: 'cache'},
].map(link => anchor(link.url, link.text)).join(' | ');

const navigation = `<p class="nav">${navigationLinks}</p>`;

const nav = function(req) {
  const url = req.url;
  const pathquery = url.split('?');
  if( pathquery.length != 2) { return navigation; }
  let q = pathquery[1];
  return navigation.replace(
    '/compose', '/compose?'+q).replace(
      '/pixie', '/pixie?'+q).replace(
      '/png', '/png?'+q).replace(
       '/metar', '/metar?'+q).replace(
       '/stations', '/stations?'+q);
};

const sinceStart = function() {
  return Date.now() - tStart;
}

const randomStation = function () {
 const scount = activeMetarStations.length;
 const idx = Math.trunc(Math.random() * scount);
 return activeMetarStations[idx];
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
  'KSEA', 'KPAE', 'KBFI', 'KBLI', 'KSFO', 'EGLC', 'EGGD', 'LIMC', 'SAWH',
  'PANU', 'DTKA', 'LFSO'
  ];
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  let body = "";
  let metarLink = "m <a title='METAR ${station}' href='/metar?location=${station}'>${station}</a>";
  let jsonLink  = "j <a title='json prettyprint ${station}' href='/json?location=${station}'>${station}</a>";
  let pixieLink  = "p <a title='pixie ${station}' href='/pixie?location=${station}'>${station}</a> | <i><a title='developer ${station}' href='/compose?location=${station}'>d</a></i>";
  let pixieimg  = '<a href="pixie?location=${station}&set=${dollset}"><img width="125" alt="pixie for ${station}" src="/png?location=${station}&set=${dollset}" title="pixie for ${station}"/></a>';
  let locationLink = "${location}";
  let reportLink = `<tr><td>${metarLink}</td><td>${jsonLink}</td><td>${pixieLink}</td><td>${locationLink}</td></tr>\n`;
  body += navigation;
  body += "\n";
  body += "<table border><thead><tr><th>METAR Report</th><th>Pixie Params</th><th>Composed Pixie</th><th>Location</th></tr></thead>\n"
  stationChoices.map(stn =>
  {
    let loc = shortStationName(stn);
    body += reportLink.replace(/\${station}/g, stn).replace(/\${location}/, loc);
  });
  body += reportLink.replace(/\${station}/g, 'NZSP').replace(/\${location}/, shortStationName('NZSP'));
  body += reportLink.replace(/\${station}/g, 'XKXK').replace(/\${location}/, '(unknown station)');
  body += "</table><br/>"
  body += "<p>"
  let tileNo = 0;
  let pixiesetnum = 4;
  stationChoices.map(stn =>
  {
    let dollset=Math.trunc(Math.random() * pixiesetnum);
    body += pixieimg.replace(/\${station}/g, stn).replace(/\${dollset}/g, dollset);
    tileNo++;
    if (tileNo % 4 === 0) {body += "<br/>";}
  });
  body += "</p>\n"
  body += navigation;
  const responseBody = `${pagehead}<body>${body}</body>`;
  res.send(responseBody);
});

const redirectToSetLocation = (req, res) => {
  // We could use cookies or other preset info to set
  // which location to use if absent from the request.
  let redirection = req.path + '?location=KSEA';
  let location = randomStation();
  if (location) {
    redirection = req.path + `?location=${location}`;
  }
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
     // for a known station, return an arbitrary parsed METAR report
    return KLAN;
  } else {
     // unknown stations are handled as unknown
    return `Could not retrieve observation from station code ${loc}.`;
  }
}

// offline testing of METAR report cache, given
// that an old snapshot is presumed current.
// But subtract four minutes from the cache.
cache.put('KLAN', KLAN, Date.now() - (4 * 60 * 1000));

const fetchMetarFile = async (location) => {
  let metarFile = `spec/resources/${location}.TXT`;
  try {
    let report = fs.readFileSync(metarFile, 'utf-8');
    return report;
  } catch(error) {
    console.error(JSON.stringify(error, null, 2));
  }
  // allows offline testing using fixed cache-for-test
  return defaultReport(location);
};


const fetchMETAR = async (location) => {
  // note new METAR API endpoint after text server was announced
  // as discontinued but text URL still works 2024-06-25. Be wary.
  // https://aviationweather.gov/data/api/#/Data/dataMetars
  //
  // also note the bulk all-current-METARs cache updated by minute,
  // with the METAR reports in raw, non-decoded form.
  // https://aviationweather.gov/data/cache/metars.cache.csv.gz
  let cached = cache.get(location, Date.now());
  if (cached) {
//      console.log(`metar cache: found report for ${location}`);
      return cached;
    } else {
//      console.log(`metar cache: need to fetch ${location}`);
    }
  let url = `https://tgftp.nws.noaa.gov/data/observations/metar/decoded/${location}.TXT`;
  let report = await fetch(url).then(
    response => { const text = response.text();
                  cache.put(location, text, Date.now()); // potential race?
                  return text; }).catch(
      error => { console.error(JSON.stringify(error, null, 2)); return fetchMetarFile(location) });

  return report;
}

app.get('/json', async (req, res) => {
  const location = req.query.location;
  if (location === undefined) {
    redirectToSetLocation(req, res);
    return;
  }
  const jsonReport = decodedToParamsForStation(await fetchMETAR(location), location);
  const imageText = JSON.stringify(computeImageTextValues(jsonReport));
  let jsonBody = `<pre>${JSON.stringify(jsonReport, null, 2)}\n${imageText}</pre>`;
  res.send(jsonBody);
});

app.get('/metar', async (req, res) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  const location = req.query.location;
  if (location === undefined) {
    redirectToSetLocation(req, res);
    return;
  }
  let report = await fetchMETAR(location);
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Hello from ${location}, report follows:\n ${report}`);
});

const pixieAlt = async function(params) {
  // a first-cut parameter for caching would be the request query param string
  // location=ABCD&set=3  where location=params.stationCode and set=params.dollset

  // params.stationCode appears as '????' if the fetch fails, and we cache that.
  // maybe a more explicit no-report-found would be better?
  // "the sky over the port was the the color of a television tuned to an empty channel"
  let location = params.stationCode;
  let set = params.dollset;
  let pixieKey;
  if (set) {
    pixieKey = `location=${location}&set=${set}`;
  } else {
    pixieKey = `location=${location}`;
  }
  const cachedPixie = cache.get(pixieKey, Date.now());
  if (cachedPixie) {
    // console.log(`image cache: found ${pixieKey}`)
    return cachedPixie;
  } else {
    // console.log(`image cache: need new image for ${pixieKey}`)
  }
  var [pixie, alt]= await compose(params).catch(console.error);
  cache.put(pixieKey, [pixie, alt], Date.now());
  // console.log(`image cache: saved [image, alt] ${pixieKey}`)
  let keyWithDollset = `location=${location}&set=${params.dollset}`; // late bound dollset?
  if (pixieKey != keyWithDollset) {
    cache.put(keyWithDollset, [pixie, alt], Date.now());
  //   console.log(`image cache: saved [image, alt] ${keyWithDollset}`)
  }
  return [pixie, alt];
}

app.get('/compose', async (req, res) => {
  // Developer's view of a pixie render.
  const location = req.query.location;
  if (location === undefined) {
    redirectToSetLocation(req, res);
    return;
  }
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  params.dollset = req.query.set;
  let title = `Pixel Doll Weather Report from ${location}.`;
  params.text = title;
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  let jsonOutput = JSON.stringify(params, null, 2);
  // add a "stations" lookup
  let icaoLocData = stations.get(location);
  let mapUrl = worldMapLink(params);
  let mapLink = '';
  if (mapUrl.startsWith('http')) {
     mapLink = `<a href="${mapUrl}">${mapUrl}</a>`;
  }
  const mynav = nav(req);
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const responseBody = `${mynav}\n<img width="125" alt="${alt}" src="${src}" title="${title}" /><br/><p>alt=${alt}</p><p>icaoLocData=${icaoLocData}</p><p>mapLink=${mapLink}</p>${mynav}\n<pre>${jsonOutput}</pre>`;
    res.send(responseBody); });
});

// factored for param-request and random-request
const servePixie = async function(req, res, location) {
  // which pixel doll? is this in 'req' or already 'params' ?
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  params.dollset = req.query.set;
  let title = `Pixel Doll Weather Report from ${location}.`;
  params.text = title;
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  let dollset = params.dollset; // if bound in compose(); TODO pull this to server
  // add a "stations" lookup
  let icaoLoc = stations.get(location);
  let mapUrl = worldMapLink(params);
  let mapLink = '';
  if (mapUrl.startsWith('http')) {
     mapLink = `<p><a href="${mapUrl}">${location} OpenStreetMap</a></p>`;
  }
  let pixieimg  = '<a href="pixie?location=${station}&set=${dollset}"><img width="125" alt="${alt}" src="${src}" title="${title}"/></a>';
  const imageHolder = pixieimg.replace(
    /\${station}/g, location).replace(
      /\${dollset}/g, dollset).replace(
        /\${alt}/g, alt).replace(
          /\${title}/g, title);
  const mynav = nav(req);
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const body = imageHolder.replace(/\${src}/g, src)+`<br/><p>${icaoLoc}</p>${mapLink}`;
    const responseBody = `${pagehead}<body>\n${mynav}\n${body}\n${mynav}\n</body>`;
    res.send(responseBody);
  });
}

app.get('/about', async (req, res) => {
  let doc = anchor('https://github.com/jmeowmeow/PixieReport/blob/main/doc/weatherpixie-prospectus.md','PixieReport Prospectus');
  let body = "<p>This is a prototype server for PixieReport.</p>";
  body += "<p>Briefly, this service constructs pixel paperdoll images from airport weather conditions. ";
  body += "It is an homage to Tamsin Bowles' original Weatherpixie.com site.</p>";
  body += "<p>The public version is intended to support bookmarking URLs for including PixieReport images in other pages, ";
  body += "similar to the original.</p>";
  body += `<p>For more information, see the ${doc} in the GitHub project source tree.</p>`;
  const preamble = body;
  const location = 'KSEA';
  const dollset = 'selfie';
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  params.dollset = dollset;
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  const imageHolder  = `${preamble}<br/><img width="125" alt="${alt}" src="_SRC_" title="Author selfie"/>`;
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const body = imageHolder.replace(/_SRC_/g, src);
    const responseBody = `${pagehead}<body>\n${navigation}\n${body}\n${navigation}\n</body>`;
    res.send(responseBody);
  });
});

// parameters: airport code, C/F, which pixie set; optional!
app.get('/pixie', async (req, res) => {
  const location = req.query.location;
  if (location === undefined) {
    redirectToSetLocation(req, res);
    return;
  }
  servePixie(req, res, location);
});

app.get('/random', async (req, res) => {
  const location = randomStation();
  // can we add a response header like 'Refresh: "3"' for a slide show? Yes!
  res.header('Refresh', '10');
  servePixie(req, res, location);
});

app.get('/png', async (req, res) => {
  const location = req.query.location;
  if (location === undefined) {
    redirectToSetLocation(req, res);
    return;
  }
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  params.dollset = req.query.set;
  // if this fails, we should probably return a default image.
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  const pngbuf = await pixie.getBufferAsync(Jimp.MIME_PNG);
  res
  .writeHead(200, {
    'Content-Length': Buffer.byteLength(pngbuf),
    'Content-Type': 'image/png'
  })
  .end(pngbuf);
});

const msecPerHr = 3600 * 1000;
const msecPerMin =  60 * 1000;
const to_hhmmss = function(msec) {
  let hh = '00';
  let mm = '00';
  let ssmils = '00.000';

  if (msec < 1000) {
    return `${msec} msec`;
  }
  let rem = msec;
  let hrs = Math.trunc(msec / msecPerHr);
  rem = (rem - (msecPerHr * hrs));
  let min = Math.trunc(rem / msecPerMin);
  rem = (rem - (msecPerMin * min));
  let ssdotmmm = rem
  // Convert ssdotmmm to ss.mmm (GitHub Copilot)
  let ss = Math.trunc(ssdotmmm / 1000);
  let ms = ssdotmmm - (ss * 1000);
  hh = (hrs < 10) ? `0${hrs}` : `${hrs}`;
  mm = (min < 10) ? `0${min}` : `${min}`;
  ssmils = (ss < 10) ? `0${ss}.${ms}` : `${ss}.${ms}`;
 return `${hh}:${mm}:${ssmils}`
}

app.get('/uptime', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Uptime: ${to_hhmmss(sinceStart())}\n`);
});

app.get('/cache', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.header('Refresh', '10');
  let body;
  let keys = [...cache.keys()].reduce((a,b) => `${a}, ${b}`);
  let activekeys = [...cache.keys()].filter(k => (undefined !== cache.get(k, Date.now()))).reduce((a,b) => `${a}, ${b}`,'');
  let expiredkeys = [...cache.keys()].filter(k => (undefined === cache.get(k, Date.now()))).reduce((a,b) => `${a}, ${b}`,'');
  body = `<p>Uptime: ${to_hhmmss(sinceStart())}</p><p>Cache size = ${cache.size}</p><p>Keys=<br/>${keys}</p><hr/><p>Active keys:<br/>${activekeys}</p><hr/><p>Expired keys:<br/>${expiredkeys}</p>`;
  const responseBody = `${pagehead}<body>\n${navigation}\n${body}\n${navigation}\n</body>`;
  cache.expire();
  res.send(responseBody);
});

app.get('/stations', async (req, res) => {
  const location = req.query.location;
  let body = '';
  let myLocation = "";
  let allClosest = "";
  let myClosestStations = "";
  if (location === undefined) {
    // okay
    myLocation = "No location data."
  } else {
    let icaoLocData = stations.get(location); // lat/long after last comma
    if (icaoLocData) {
      myLocation = icaoLocData.substring(1+icaoLocData.lastIndexOf(', '));
    }
    const params = decodedToParamsForStation(await fetchMETAR(location), location);
    const latlong = params.latlong;
    if (latlong) {
      const coslat = Math.cos(3.141 * latlong.degLat / 180.0); // 180 degrees / pi radians
      const ifdef = function(val) { if ((typeof val) === 'number') { return val;} else { return 9999; }}
      // a better metric weights longitude by cosine of latitude. (says Copilot, 3rd try)
      const diffwt = function(stn) {
        let dw = ((coslat * Math.abs(ifdef(stn.long) - latlong.degLong)) +
                  (Math.abs(ifdef(stn.lat) - latlong.degLat)));
        return dw;
      }
      let myStation = stationsByLat.filter(stn => (stn.station === location));
      console.log("myStation: " + JSON.stringify(myStation));
      myLocation = myLocation + ' dist-to-self: ' +diffwt(stations.get(location)) + ' ' + JSON.stringify(latlong);
      let closestStns = stationsByLong.slice(0).sort( (a, b) => (diffwt(a) - diffwt(b)) );
      // closest is probably "self" if the metric is correct.
      closestStns.map(each => ( each.distance = diffwt(each))); // but what the heck
      allClosest  = closestStns.reduce((a, b) => (`${a}<br/>\n${b.distance.toFixed(2)} ${b.station} ${b.desc}`), "");
      let candidates = closestStns.slice(0, 5);
      const closestStnsStr  = JSON.stringify(candidates, 0, 2);
      myClosestStations = `Closest (lat/long):<br/>\n<pre>${closestStnsStr}</pre>`;
    }
  }
  let slat  = stationsByLat.reduce((a, b) => (`${a}<br/>\n${b.lat.toFixed(2)} ${b.station} ${b.desc}`), "");
  let slong = stationsByLong.reduce((a, b) => (`${a}<br/>\n${b.long.toFixed(2)} ${b.station} ${b.desc}`), "");
  const mynav = nav(req);
  body = `<p>Uptime: ${to_hhmmss(sinceStart())}</p><p>${myLocation}</p><p>${myClosestStations}</p><p>Stations by distance:<br/>${allClosest}</p><p>Stations by Latitude:<br/>${slat}</p><hr/><p>Stations by Longitude:<br/>${slong}</p>`;
  const responseBody = `${pagehead}<body>\n${mynav}\n${body}\n${mynav}\n</body>`;
  res.send(responseBody);
});


app.listen(port, () => {
  console.log(`${new Date().toLocaleTimeString()} Server listening at http://localhost:${port} (${sinceStart()} msec)`);
});

