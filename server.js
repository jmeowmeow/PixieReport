const tStart = Date.now();

const express = require('express');
const app = express();
const port = 3000;
const ipv4_localhost = '127.0.0.1';
const host = ipv4_localhost;

const fs = require('fs'); // fallback to load METARs for local testing
const robots_txt = fs.readFileSync("webapp/robots.txt");

// preloaded data files and image layers, Jimp image package
const {stations, activeMetarStations, stationsByLat, stationsByLong, resources, Jimp} = require('./preloads');
// image composition
const {compose} = require('./compose-async');
// METAR parsing
const {decodedToParamsForStation, worldMapLink} = require('./pixifier/decoded-metar-parser'); //icao.js used
const {computeImageTextValues} = require('./pixifier/compute-image-text');
// pixie cache and recent client IP addresses
const {cache, clients, robots} = require('./webapp/cache');

const dispRecentIps = function(brk, ipCache) {
  return ipCache.showclients().reduce((a,b) => a + `${b[0]} : ${b[1]} ${brk}\n`, `${brk}\n`);
}

const dispclients = function(brk) {
  return dispRecentIps(brk, clients);
}

const disprobots = function(brk) {
  return dispRecentIps(brk, robots);
}

const tallyRobotIp = function(req) {
  let robotIp = req.headers["x-forwarded-for"];
  if (robotIp) {
    robots.increment(robotIp, Date.now());
  }
}

const tallyClientIp = function(req) {
  let clientIp = req.headers["x-forwarded-for"];
  if (clientIp) {
    clients.increment(clientIp, Date.now());
  }
}

// app activity counters
const {increment, clearout, showcounters} = require ('./webapp/counters')

const dispcounters = function(brk) {
  return showcounters().reduce((a,b) => a + `${b[0]} : ${b[1]} ${brk}\n`, `${brk}\n`);
}

clearout('imagecount', 'pixiecount');

const favicon = "\n<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Ctext%20x='0'%20y='14'%3E⛅%3C/text%3E%3C/svg%3E\" type=\"image/svg+xml\" />\n";

const ogTitle    = '<meta property="og:title" content="PixieReport" />\n';
const ogType     = '<meta property="og:type" content="website" />\n';
const ogImage    = '<meta property="og:image" content="https://github.com/jmeowmeow/PixieReport/raw/main/doc/images/image6.png" />\n';
const ogUrl      = '<meta property="og:url" content="pixiereport.com" />\n';
const ogSiteName = '<meta property="og:site_name" content="PixieReport" />\n';
const ogDesc     = '<meta property="og:description" content="Pixel paperdoll weather reports in homage to Weatherpixie dot com." />\n';
const opengraph = `${ogTitle}${ogDesc}${ogType}${ogImage}${ogUrl}${ogSiteName}`;

const pagetitle = "PixieReport Webapp";
const pagehead = `<head><title>${pagetitle}</title>\n${favicon}${opengraph}</head>`;

// in which we reinvent Lodash a method at a time, to avoid managing
// a dependency stream
const absentValue = function(val) {
  return ((val === undefined) || (val === null) || (val == "undefined"));
};

const anchor = function(url, text, title) {
  return `<a href="${url}" title="${title}">${text}</a>`;
};

const userNav = [
  {url: '/', text: 'Home', title: 'PixieReport Home'},
  {url: '/about', text: 'About', title: 'About PixieReport'},
  {url: '/random', text: 'Random', title: 'Random Pixie Slideshow'},
  {url: '/make', text: 'Make', title: 'Make a Pixie URL'},
  {url: '/pixie', text: 'Pixie', title: 'Pixie Page'},
  {url: '/png', text: 'Image', title: 'Pixie Image'},
  {url: '/stations', text: 'Nearby', title: 'Stations Near a Station or Location'},
].map(link => anchor(link.url, link.text, link.title)).join(' | ');

const devNav = [
  {url: '/compose', text: 'devpixie', title: 'Pixie Page with Developer Details'},
  {url: '/metar', text: 'metar', title: 'Weather Report Text' },
  {url: '/json', text: 'params', title: 'Parsed Pixie Params' },
  {url: '/sets', text: 'sets', title: 'Pixel Doll Sets' },
  {url: '/uptime', text: 'uptime', title: 'Server Uptime and Metrics'},
  {url: '/cache', text: 'cache', title: 'Weather Report and Image Cache'},
].map(link => anchor(link.url, link.text, link.title)).join(' | ');

const navigationLinks = userNav + "<br/>\n" + devNav;

const navigation = `<p class="nav">${navigationLinks}</p>`;

// Copy pixie query params into navigation links,
// preserving location and set (dollset) during navigation.
const nav = function(req) {
  const url = req.url;
  const pathquery = url.split('?');
  if( pathquery.length != 2) { return navigation; }
  let q = pathquery[1];
  return navigation.replace(
    '/compose', '/compose?'+q).replace(
    '/make', '/make?'+q).replace(
    '/pixie', '/pixie?'+q).replace(
    '/png', '/png?'+q).replace(
    '/metar', '/metar?'+q).replace(
    '/json', '/json?'+q).replace(
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

app.get('/robots.txt', (req, res) => {
  tallyRobotIp(req);
  res.setHeader('Content-Type', 'text/plain');
  res.send(robots_txt);
});

app.get('/', (req, res) => {
  tallyClientIp(req);
  const stationChoices = [
  'KSEA', 'KPAE', 'KBLI', 'KSFO', 'EGLC', 'EGGD', 'LIMC', 'SAWH'
  ];
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  stationChoices.push(randomStation());
  let body = "";
  let pixieLink  = "p <a title='pixie ${station}' href='/pixie?location=${station}'>${station}</a> | <i><a title='developer ${station}' href='/compose?location=${station}'>d</a></i>";
  let pixieimg  = '<a href="pixie?location=${station}&set=${dollset}"><img width="125" alt="pixie for ${station}" src="/png?location=${station}&set=${dollset}" title="pixie for ${station}"/></a>';
  let locationLink = "${location}";
  let reportLink = `<tr><td>${pixieLink}</td><td>${locationLink}</td></tr>\n`;
  body += navigation;
  body += "\n";
  body += "<table border><thead><tr><th>Composed Pixie</th><th>Location</th></tr></thead>\n"
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
  stationChoices.map(stn =>
  {
    let dollset=resources.randomDollSetNum();
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
      return cached;
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
  tallyClientIp(req);
  const location = req.query.location;
  if (absentValue(location)) {
    redirectToSetLocation(req, res);
    return;
  }
  const jsonReport = decodedToParamsForStation(await fetchMETAR(location), location);
  const imageText = JSON.stringify(computeImageTextValues(jsonReport));
  let jsonBody = `<pre>${JSON.stringify(jsonReport, null, 2)}\n${imageText}</pre>`;
  res.send(jsonBody);
});

app.get('/metar', async (req, res) => {
  tallyClientIp(req);
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  const location = req.query.location;
  if (absentValue(location)) {
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
  const dtNow = Date.now();
  const cachedPixie = cache.get(pixieKey, dtNow);
  if (cachedPixie) {
    increment('pixiecache.hit');
    return cachedPixie;
  } else {
    increment('pixiecache.miss');
    if (Math.random() < 0.1) {
      cache.expire(dtNow);
    }
  }
  var [pixie, alt]= await compose(params).catch(console.error);
  cache.put(pixieKey, [pixie, alt], dtNow);
  let keyWithDollset = `location=${location}&set=${params.dollset}`; // late bound dollset?
  if (pixieKey != keyWithDollset) {
    cache.put(keyWithDollset, [pixie, alt], dtNow);
  }
  return [pixie, alt];
}

const elapsedMessage = function(hoursSince) {
 if (typeof hoursSince === 'number' && isFinite(hoursSince)) {
    return `${hoursSince.toFixed(1)} h since report.`;  // toFixed(1) makes it a string
  } else {
    return "No report time available."
  }
}

app.get('/compose', async (req, res) => {
  tallyClientIp(req);
  // Developer's view of a pixie render.
  const location = req.query.location;
  if (absentValue(location)) {
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
  } else {
     mapLink = ' (no geodata)';
     mapLink = mapLink + `, try aviationweather.gov for <a href="https://aviationweather.gov/data/metar/?id=${location}">${location}</a>\n`;
  }
  const elapsedMsg = elapsedMessage(params.zHoursSince);
  const mynav = nav(req);
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const responseBody = `${mynav}\n<img width="125" alt="${alt}" src="${src}" title="${title}" /><br/><p>alt=${alt}</p><p>icaoLocData=${icaoLocData}</p><p>mapLink=${mapLink}</p><p>${elapsedMsg}</p>${mynav}\n<pre>${jsonOutput}</pre>`;
    res.send(responseBody);
    increment('pixiecount');
  });
});

// factored for param-request and random-request
const servePixie = async function(req, res, location, note) {
  // which pixel doll? is this in 'req' or already 'params' ?
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  if (!note || note == '') { // patch contra factoring, had to be after params call.
    note = `<p>${elapsedMessage(params.zHoursSince)}</p>\n`;
  }
  params.dollset = req.query.set;
  let title = `Pixel Doll Weather Report from ${location}.`;
  params.text = title;
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  let dollset = params.dollset; // if bound in compose(); TODO pull late-bound set to server code?
  // add a "stations" lookup
  let icaoLoc = stations.get(location);
  if (!icaoLoc) {
    icaoLoc = `No information in database for station code ${location}.`;
    icaoLoc = icaoLoc + `\n<br/>Try NWS METAR for <a href="https://aviationweather.gov/data/metar/?id=${location}">${location}</a>\n`
  }
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
    const body = imageHolder.replace(/\${src}/g, src)+`<br/><p>${icaoLoc}</p>${mapLink}${note}`;
    const responseBody = `${pagehead}<body>\n${mynav}\n${body}\n${mynav}\n</body>`;
    res.send(responseBody);
    increment('pixiecount');
  });
}

app.get('/about', async (req, res) => {
  tallyClientIp(req);
  let doc = anchor('https://github.com/jmeowmeow/PixieReport/blob/main/doc/weatherpixie-prospectus.md','PixieReport Prospectus', 'PixieReport History, Notes, and Prospects');
  let body = "<p>About the PixieReport server.</p>";
  body += "<p>PixieReport constructs pixel paperdoll images from airport weather conditions. ";
  body += "It is an homage to Tamsin Bowles' original Weatherpixie.com site.</p>";
  body += "<p>The site is intended to support bookmarking URLs for including PixieReport images in other pages, ";
  body += "similar to the original Weatherpixie.</p>";
  body += `<p>For more information, see the ${doc} in the GitHub project source tree.</p>`;
  const preamble = body;
  const location = 'KSEA';
// TODO dollset resource lookup by set name?
  const dollset = 'selfie';
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  params.dollset = dollset;
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  const imageHolder  = `${preamble}<br/><img width="125" alt="${alt}" src="_SRC_" title="Author selfie"/>`;
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const body = imageHolder.replace(/_SRC_/g, src);
    const responseBody = `${pagehead}<body>\n${navigation}\n${body}\n${navigation}\n</body>`;
    res.send(responseBody);
    increment('pixiecount');
  });
});

// parameters: airport code, C/F, which pixie set; optional!
app.get('/pixie', async (req, res) => {
  tallyClientIp(req);
  const location = req.query.location;
  if (absentValue(location)) {
    redirectToSetLocation(req, res);
    return;
  }

    servePixie(req, res, location, '');
  });

app.get('/random', async (req, res) => {
  tallyClientIp(req);
  const location = randomStation();
  // can we supply a doll set and C/F params (or other theming params?)
  // can we add a response header like 'Refresh: "3"' for a slide show? Yes!
  const refsec = '10';
  res.header('Refresh', refsec);
  servePixie(req, res, location, `<p>New pixie every ${refsec} seconds.</p>`);
});

app.get('/png', async (req, res) => {
  tallyClientIp(req);
  const location = req.query.location;
  if (absentValue(location)) {
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
  increment('imagecount');
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
  tallyClientIp(req);
  res.setHeader('Content-Type', 'text/plain');
  // JSON dump of header object
  let headers = JSON.stringify(req.headers, null, 2);
  res.send(`Uptime: ${to_hhmmss(sinceStart())}\n${dispcounters('')}\ncallers ${dispclients('')}\nrobots ${disprobots('')}\n\n${headers}\n`);
});

app.get('/cache', (req, res) => {
  const dtNow = Date.now();
  tallyClientIp(req);
  res.setHeader('Content-Type', 'text/html');
  res.header('Refresh', '10');
  let body;
  let keys = (cache.size > 0) ? [...cache.keys()].reduce((a,b) => `${a}, ${b}`) : '[ ]';
  let activekeys = [...cache.keys()].filter(k => (undefined !== cache.get(k, Date.now()))).reduce((a,b) => `${a}, ${b}`,'');
  let expiredkeys = [...cache.keys()].filter(k => (undefined === cache.get(k, Date.now()))).reduce((a,b) => `${a}, ${b}`,'');
  body = `<p>Uptime: ${to_hhmmss(sinceStart())}</p><p>${dispcounters('<br/>\n')}</p><p>Cache size = ${cache.size}</p><p>Keys:<br/>${keys}</p><hr/><p>Active keys:<br/>${activekeys}</p><hr/><p>Expired keys:<br/>${expiredkeys}</p>`;
  const responseBody = `${pagehead}<body>\n${navigation}\n${body}\n${navigation}\n</body>`;
  cache.expire(dtNow);
  res.send(responseBody);
});


const getDollSetCheckerboard = function() {
  let underPixie  = new Jimp(125, 175, "#E0E0E0");
  let blueBlock   = new Jimp( 21,  21, "#A0A0F0");
  let oddrow = 0;
  for (let row = 0; row < 175; row += 21) {
    let dcol = (oddrow) ? 21 : 0;
    for (let col=dcol; col < 125; col += 42) {
      underPixie.composite(blueBlock, col, row);
    }
    oddrow = (1 - oddrow);
  }
  return underPixie;
}

const toPixieImageElement = async function(pixieLayer) {
  let img = getDollSetCheckerboard();
  let desc = pixieLayer.desc;
  let doll = await pixieLayer.toJimp();
  img.composite(doll, 0, 0);
  let element = '';
  await img.getBase64(Jimp.MIME_PNG, (err, src) => {
    const imageHolder  = `<img width="125" alt="${desc}" src="_SRC_" title="pixel doll preview"/>`;
    element = imageHolder.replace(/_SRC_/g, src);
  });
  return element;
}

const makeSetTable = async function(withPicker) {
  // TODO pass in which doll set starts as selected, for picker at least
  // TODO picker should also render a no-set-chosen row with radio button.

  let body = '<p>Pixel Doll Sets</p>\n';
  body = `${body}<br/><table border><tr><th>Set</th><th>icy</th><th>cold</th><th>cool</th><th>warm</th><th>hot</th></tr>\n`;
  if (withPicker) {
    const noPixieLayer = resources.namedLayers.get("whichpixie");
    const noPixie = await toPixieImageElement(noPixieLayer);
    const noPixieRadio = '<input type="radio" name="set" value="none">';
    body = `${body}<tr><td>${noPixieRadio}<br/>none<br/> set</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = body + '</tr>\n';
  }
  for (let setNum = 0; setNum < resources.howManySets; setNum += 1) {
    const dollLayers = resources.dollSets[setNum]; // array 0..4 of desc, path, toJimp()
    const radio = withPicker ? `<input type="radio" name="set" value="${setNum}"> `: '';
    body = `${body}<tr><td>${radio}${setNum}</td>`;
    body = `${body}<td>${await toPixieImageElement(dollLayers[0])}</td>`;
    body = `${body}<td>${await toPixieImageElement(dollLayers[1])}</td>`;
    body = `${body}<td>${await toPixieImageElement(dollLayers[2])}</td>`;
    body = `${body}<td>${await toPixieImageElement(dollLayers[3])}</td>`;
    body = `${body}<td>${await toPixieImageElement(dollLayers[4])}</td>`;
    body = body + '</tr>\n';
  }
  body = body + '</table>';
  return body;
}

const asPicker = true; const asViewer = false;

const makeSetPicker = async function() {
  return makeSetTable(asPicker);
}

const makeSetViewer = async function() {
  return makeSetTable(asViewer);
}

const withQueryParams = function(baseUrl, props) {
  // location or nothing; dollset or nothing; units or nothing.
  let qparams = [];
  if (props.location) { qparams.push(`location=${props.location}`); }
  if (props.dollset)  { qparams.push(`set=${props.dollset}`); }
  if (props.units)    { qparams.push(`units=${props.units}`); }
  let qUrl;
  if (qparams.length == 0) {
    qUrl = baseUrl;
  } else {
    qUrl = `${baseUrl}?${qparams.join('&')}`;
  }
  return `${baseUrl} : ${anchor(qUrl, qUrl, qUrl)}`;
}

app.get('/make', async (req, res) => {  // wip picker
  tallyClientIp(req);
  const mynav = nav(req);
  // Don't redirect if station or set is undefined,
  // we want this endpoint to potentially be re-entered
  // during editing choices and allow undef values.
  let location = req.query.location; // undef is ok
  let dollset  = req.query.set; // undef is ok; filter out unknowns <0 >setnum
  let units  = req.query.units; // C or F, upcased, undef is ok; filter out unknowns
  const props = { units, dollset, location }; // 'units': units, etc.
  // Depict the URLs being constructed, the important dimensions being:
  // which endpoint: PNG or iframe source; maybe a multi-station array like "nearby"
  // source/render choices, all optional: weather station, pixie set, C/F.
  const model_url = "/ENDPOINT?location=LOCATION&set=SET"; // relative URL!
  const endpoints = [ "/pixie", "/png" ];
  let endpointsWithParams = [];
  endpoints.map( each => { endpointsWithParams.push(
    `<br/>${each}: ${withQueryParams(each, props)}\n`); });
  const urlSection = `<p>Model URL:<br/>${model_url}${endpointsWithParams[0]}${endpointsWithParams[1]}</p>`;
  const unitsSection = '<p>Units for Report<br/><input type="radio" name="units" value="" checked> By station locale |' +
		'<input type="radio" name="units" value="C"> C/hPa/kph |' +
		'<input type="radio" name="units" value="F"> F/mmHg/mph </p>\n';
  const table = await makeSetPicker();
  const responseBody = `${pagehead}<body>\n${mynav}\n${urlSection}\n${unitsSection}\n${table}\n${mynav}\n</body>`;
  res.send(responseBody);
});

app.get('/sets', async (req, res) => {
  tallyClientIp(req);
  const mynav = nav(req);
  const body = await makeSetViewer();
  const responseBody = `${pagehead}<body>\n${mynav}\n${body}\n${mynav}\n</body>`;
  res.send(responseBody);
});

const makeGridNav = function(path, latlong) {
   const lat = latlong.degLat;
   const long = latlong.degLong;
   const template = '<td><a href="' + path + '?degLat=LAT&degLong=LONG">NAV</a></td>';
   const lats = [Math.max(-90.0, lat - 5.0),
                 Math.max(-90.0, lat - 1.0),
                 Math.min(90.0, lat + 1.0),
                 Math.min(90.0, lat + 5.0)
                ];
   const longs = [Math.max(-180.0, long - 5.0),
                  Math.max(-180.0, long - 1.0),
                  Math.min(180.0, long + 1.0),
                  Math.min(180.0, long + 5.0)
                ];
   const latnavs =  ["&lt;&lt; S", "&lt; S", "N &gt;", "N &gt;&gt;"];
   const longnavs = ["&lt;&lt; W", "&lt; W", "E &gt;", "E &gt;&gt;"];
   let latnav = "";
   let longnav = "";
   const latTemplate = template.replace('LONG', long).replace('NAV', "NAV latitude");
   const longTemplate = template.replace('LAT', lat).replace('NAV', "NAV longitude");
   for (let idx = 0; idx < 4; idx += 1) {
     latnav += latTemplate.replace('LAT', lats[idx]).replace('NAV', latnavs[idx]);
     longnav += longTemplate.replace('LONG', longs[idx]).replace('NAV', longnavs[idx]);
   }
   // Experiment, width=100% , add a spacer, so maybe lat/log grid navigation isn't so tiny on mobile?
   let spacer = '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
   let gridnav = '<table width="100%"><tr>\n'+latnav + '</tr>\n'+spacer+'\n<tr>' + longnav + '</tr></table>\n';
   return gridnav;
}

app.get('/stations', async (req, res) => {
  tallyClientIp(req);
  const location = req.query.location;
  let body = '';
  let myLocation = "Grid Coordinates";
  let latlong = { degLat: 0.0, degLong: 0.0 }
  let myClosestStations = "";

  if (absentValue(location)) {
    // maybe there is a degLat/degLong passed as query params?
    if (req.query.degLat && req.query.degLong) {
      latlong = { degLat: Number.parseFloat(req.query.degLat),
                  degLong: Number.parseFloat(req.query.degLong) };
    } else {
      // okay, use Zero Zero
      let redirection = req.path + '?degLat=0.0&degLong=0.0';
      res.redirect(redirection);
      return;
    }
  } else {
    let icaoLocData = stations.get(location); // lat/long after last comma
    if (icaoLocData) {
      myLocation = icaoLocData.substring(1+icaoLocData.lastIndexOf(', '));
    }
    const params = decodedToParamsForStation(await fetchMETAR(location), location);
    latlong = params.latlong;
  }
  let gridnav="";
  if (latlong) {
      const coslat = Math.cos(3.141 * latlong.degLat / 180.0); // 180 degrees / pi radians
      const ifdef = function(val) { if ((typeof val) === 'number') { return val;} else { return 9999; }}
      // approximate distance metric, weighting longitude decreasing by cosine of latitude.
      const diffwt = function(stn) {
        let dw = ((coslat * Math.abs(ifdef(stn.long) - latlong.degLong)) +
                  (Math.abs(ifdef(stn.lat) - latlong.degLat)));
        return dw;
      }
      myLocation = myLocation + ' ' + JSON.stringify(latlong);
      gridnav = '<p>\n'+makeGridNav(req.path, latlong)+'\n</p>\n';
      let closestStns = stationsByLong.slice(0).sort( (a, b) => (diffwt(a) - diffwt(b)) );
      closestStns.map(each => ( each.distance = diffwt(each)));
      // anchored list of closest METAR stations on our active station list
      const closestTwelve = closestStns.slice(0,12);
      const closestStnsStr  = closestTwelve.reduce((a, b) =>
        (`${a}<br/>\n${b.distance.toFixed(2)} ${anchor('/stations?location='+b.station, b.station, 'Stations near '+b.station)} ${b.desc}`), "");

      // code duplication from home page array
      let tileNo = 0;
      let pixieimg  = '<a href="pixie?location=${station}&set=${dollset}"><img width="125" alt="pixie for ${station}" src="/png?location=${station}&set=${dollset}" title="pixie for ${station}"/></a>';
      closestTwelve.map(each =>
      {
        let stn = each.station;
        let dollset=resources.randomDollSetNum(); // discards any URL param dollset
        myClosestStations += pixieimg.replace(/\${station}/g, stn).replace(/\${dollset}/g, dollset);
        tileNo++;
        if (tileNo % 4 === 0) {myClosestStations += "<br/>";}
      });
      myClosestStations += "</p>\n";
      myClosestStations += `<p>Closest (lat/long):<br/>\n${closestStnsStr}></p>\n<p>`;

  }
  const mynav = nav(req);
  body = `<p>Uptime: ${to_hhmmss(sinceStart())}</p><p>${myLocation}</p>${gridnav}${myClosestStations}`;
  const responseBody = `${pagehead}<body>\n${mynav}\n${body}\n${mynav}\n</body>`;
  res.send(responseBody);
});


app.listen(port, host, () => {
  console.log(`${new Date().toLocaleTimeString()} Server listening at http://${host}:${port} (${sinceStart()} msec)`);
});

