const tStart = Date.now();

const express = require('express');
const escapeHtml = require('escape-html');
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
const externalMapLink = worldMapLink; // distinguish world-map on picker from external world map service
const {computeImageTextValues, useMetric} = require('./pixifier/compute-image-text');
// pixie cache and recent client IP addresses
const {cache, clients, robots, pages} = require('./webapp/cache');

const dispRecentIps = function(brk, ipCache) {
  return ipCache.showclients().reduce((a,b) => a + `${b[0]} : ${b[1]} ${brk}\n`, `${brk}\n`);
}

const dispclients = function(brk) {
  return dispRecentIps(brk, clients);
}

const disprobots = function(brk) {
  return dispRecentIps(brk, robots);
}

const disppages = function(brk) {
  return dispRecentIps(brk, pages);
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

const tallyPage = function(req) {
  let path = req.path;
  if (path) {
    pages.increment(path, Date.now());
  }
}

// app activity counters
const {increment, clearout, showcounters} = require ('./webapp/counters')

const dispcounters = function(brk) {
  return showcounters().reduce((a,b) => a + `${b[0]} : ${b[1]} ${brk}\n`, `${brk}\n`);
}

clearout('pngcount', 'p64count');

const favicon = "\n<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3E%3Ctext%20x='0'%20y='14'%3E⛅%3C/text%3E%3C/svg%3E\" type=\"image/svg+xml\" />\n";

const viewport   = '<meta name="viewport" content="width=device-width, initial-scale=1" />\n';
const ogTitle    = '<meta property="og:title" content="PixieReport" />\n';
const ogType     = '<meta property="og:type" content="website" />\n';
const ogImage    = '<meta property="og:image" content="https://github.com/jmeowmeow/PixieReport/raw/main/doc/images/image6.png" />\n';
const ogImageAlt = '<meta property="og:image:alt" content="A set of pixel paperdoll weather reports for day and night from icy cold to hot weather." />\n';
const ogUrl      = '<meta property="og:url" content="pixiereport.com" />\n';
const ogSiteName = '<meta property="og:site_name" content="PixieReport" />\n';
const ogDesc     = '<meta property="og:description" content="Pixel paperdoll weather reports in homage to Weatherpixie dot com." />\n';
const opengraph  = `${ogTitle}${ogDesc}${ogType}${ogImage}${ogImageAlt}${ogUrl}${ogSiteName}`;
const getContentById = `
const getContentById = function(domId) {
  if (domId && document.getElementById(domId)) {
    contentElement = document.getElementById(domId);
    return contentElement.innerText;
  } else {
    return '';
  }
}
`;
const copyTextToClipboard = `
const copyTextToClipboard = function(domId, prefix) {
  navigator.clipboard.writeText(''+prefix+getContentById(domId));
}

const copyAnimation = function(element) {
  element.classList.add('copyAnimation');
  setTimeout(()=> { element.classList.remove('copyAnimation')}, 750);
}

const animateAndCopyText = function(element, domId) {
  copyAnimation(element);
  copyTextToClipboard(domId, '');
}

const animateAndCopyPath = function(element, pathDomId) {
  copyAnimation(element);
  // path DOM element text content should start with '/'
  // pre-pend the server base URL as seen by the client
  copyTextToClipboard(pathDomId, document.location.origin);
}
`;

const onPageLoad = `
  // Find src=" and href=" and pre-pend document.location.origin
  // to particularize text intended for copying, then un-hide that element.
  // (does the first matching element)
  const onLoadIncludeOriginBaseUrl = function() {
    let baseUrl = document.location.origin + '/';
    element = document.body.querySelector('.sourceloc');
    let myText = element.textContent;
    let withServerOrigin =
      myText.replace('src="', 'src="' + baseUrl).replace('href="', 'href="' + baseUrl);
    element.textContent = withServerOrigin;
    element.style = "display: inline";
  };
`;

// in which we finally remember we're sending HTML document responses
// replaces most calls to res.send(responseBody) with
// sendHtml(res, responseBody);
const sendHtml = function(responseHandle, bodyElementOuterHtml) {
  const responseDoc = `<!DOCTYPE html>\n<html>\n${bodyElementOuterHtml}\n</html>\n`;
  responseHandle.setHeader('Content-Type', 'text/html');
  responseHandle.send(responseDoc);
};

const headscript = `<script>${getContentById} ${copyTextToClipboard}</script>` + '\n';
const locscript = `<script>${getContentById} ${copyTextToClipboard} ${onPageLoad}</script>` + '\n';
const pagetitle = "PixieReport Webapp";
const headstyle = `<style>
.copyAnimation:after { content: " ☑"}
</style>`;
const pagehead = `<head><title>${pagetitle}</title>\n${favicon}${viewport}${opengraph}${headscript}${headstyle}</head>`;
const locpagehead = `<head><title>${pagetitle}</title>\n${favicon}${viewport}${opengraph}${locscript}${headstyle}</head>`;

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
// preserving location, set (dollset), and units during navigation.
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
  tallyPage(req);
  tallyRobotIp(req);
  res.setHeader('Content-Type', 'text/plain');
  res.send(robots_txt);
});

// PixieReport Home Page
app.get('/', (req, res) => {
  tallyPage(req);
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
  let body = ""; // home page body is top nav; 18-line station table; 4x4 grid w/first 16 images; bottom nav.
  let pixieLink  = "p <a title='pixie ${station}' href='/pixie?location=${station}'>${station}</a> | <i><a title='developer ${station}' href='/compose?location=${station}'>d</a></i>";
  // Currently no C/F units from the home page, but we can use the query param like nearby/make if we want to.
  let pixiehomeimg  = '<a style="display: grid" href="pixie?location=${station}&set=${dollset}"><img height="100%" width="100%" style="display: grid; object-fit: cover" alt="pixie for ${station}" src="/png?location=${station}&set=${dollset}" title="pixie for ${station}"/></a>';
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
  // two extra lines in the table; no images in the grid for NZSP and XKXK
  body += reportLink.replace(/\${station}/g, 'NZSP').replace(/\${location}/, shortStationName('NZSP'));
  body += reportLink.replace(/\${station}/g, 'XKXK').replace(/\${location}/, '(unknown station)');
  body += "</table><br/>";
  body += "<p>";
  let tileNo = 0;
  let myStationChoices = "";
  stationChoices.map(stn =>
  {
    let dollset=resources.randomDollSetNum();
    myStationChoices += pixiehomeimg.replace(/\${station}/g, stn).replace(/\${dollset}/g, dollset);
  });
// Set "display: grid" on the containing element and then grid-template-rows: repeat(4, 1fr) and grid-template-columns: repeat(4, 1fr) (4w x 4h)
  myStationChoices = `<div id="stationholder" style="max-width: 70vh; display: grid; grid-template-rows: repeat(4, 1fr); grid-template-columns: repeat(4, 1fr)">\n${myStationChoices}</div>\n`;
  body += myStationChoices;
  body += "</p>\n"
  body += navigation;
  const responseBody = `${pagehead}<body>${body}</body>`;
  sendHtml(res, responseBody);
});

//  "dollset" and "set" separate for '/make'
const toUrlWithParams = function(baseUrl, props) {
  let qparams = [];
  // location or nothing; dollset or nothing; units or nothing.
  if (props.location) { qparams.push(`location=${props.location}`); }
  if (props.set == 0 || props.set == '0' || props.set)  { qparams.push(`set=${props.set}`); } // don't shortcut dollset zero
  if (props.dollset == 0 || props.dollset == '0' || props.dollset)  { qparams.push(`set=${props.dollset}`); } // don't shortcut dollset zero (or re-do it as a special value equivalent to "none"?)
  if (props.units)    { qparams.push(`units=${props.units}`); }
  let qUrl;
  if (qparams.length == 0) {
    qUrl = baseUrl;
  } else {
    qUrl = `${baseUrl}?${qparams.join('&')}`;
  }
  return qUrl;
};

const withQueryParams = function(baseUrl, props) {
  const qUrl = toUrlWithParams(baseUrl, props);
  return `${anchor(qUrl, qUrl, qUrl)}`;
}

const withQueryParamsAndId = function(baseUrl, props, idName) {
  const qUrl = toUrlWithParams(baseUrl, props);
  return `<span id="${idName}" style="display: none">${qUrl}</span><a href="${qUrl}" title="${qUrl}">${qUrl}</a>`;
}


const redirectToSetLocation = (req, res) => {
  // Presumes req.query.location is undefined.

  // We could use cookies or other preset info to set
  // which location to use if absent from the request.
  // preserve dollset and units: join the rest of the qparams?

  // caution: we may want to sort the param keys for the cache key's sake.

  let location = randomStation();
  if (!location) {
    location = 'KSEA'; // SEA-TAC, because why not?
  }
  let pathWithLocation = `${req.path}?location=${location}`
  if (req.query) {
    req.query.location = location;
  } else {
    req.query = {'location': location};
  }
  res.redirect(toUrlWithParams(req.path, req.query));
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
  tallyPage(req);
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
  tallyPage(req);
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

const pixieCacheKeys = function(params) {
  // NOTE: the request parameters are not available here;
  // what is in hand are the processed pixie params, and
  // any logic assuming URL params is ill-posed.
  const location = params.stationCode;
  const set   = params.dollset;   // from qParam on fetch
  const units = params.units;     // from qParam on fetch
  let pixieKey;
  if (set) {
    pixieKey = `location=${location}&set=${set}`;
  } else {
    pixieKey = `location=${location}`;
  }
  // if set is absent in qparams, we can include a no-dollset key in cache.get
  // we should be able to include a no-dollset key in cache.put
  const paramUnits = params.units;
  const locationUnits = useMetric( {stationCode: location, units: undefined } ) ? 'C' : 'F';
  if ((paramUnits == 'C' || paramUnits == 'F') && (paramUnits != locationUnits)) {
    pixieKey = pixieKey + `&units=${paramUnits}`;
  }
  let someParams = { stationCode: location, dollset: set, units: params.units };
  return pixieKey;
}

const pixieAlt = async function(params) {
  // a first-cut parameter for caching would be the request query param string
  // location=ABCD&set=3  where location=params.stationCode and set=params.dollset

  // params.stationCode appears as '????' if the fetch fails, and we cache that.
  // ok what did I mess up
  // maybe a more explicit no-report-found would be better?
  // "the sky over the port was the the color of a television tuned to an empty channel"
  let location = params.stationCode;
  let set = params.dollset;
  let pixieKey = pixieCacheKeys(params); // handle dollset and units
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
  var [pixie, alt, unrendered] = await compose(params).catch(console.error);
  params.unrendered = unrendered; // freezing fog, blowing dust: see devpixie
  cache.put(pixieKey, [pixie, alt], dtNow);
  // todo keyWithDollset needs units if set
  let keyWithDollset = `location=${location}&set=${params.dollset}`; // late bound dollset?
  if (pixieKey != keyWithDollset) {
    cache.put(keyWithDollset, [pixie, alt], dtNow);
  }
  return [pixie, alt];
}

const elapsedMessage = function(hoursSince) {
 if (typeof hoursSince === 'number' && isFinite(hoursSince)) {
    let quip = (hoursSince < 0) ? ' What even is time?' : '';
    return `${hoursSince.toFixed(1)} h since report.${quip}`;  // toFixed(1) makes it a string
  } else {
    return "No report time available."
  }
}

// %%% with invisible text holder, for regular pixie with hidden alt-text
const copyTextClipboard = function(spanId, spanTitle, textToCopy) {
  // just innerText the DOM element to avoid quote escaping oops but "copy alt text to clipboard" is not interesting.
  const holderAndWidget = `
<span id="${spanId}holder" style="display:none">${textToCopy}</span>
<span id="${spanId}" style="cursor: pointer" onclick="animateAndCopyText(this, '${spanId}holder')">Copy ${spanTitle} to clipboard &#x1f4cb;</span>`;
  return holderAndWidget;
}

// for devpixie or compose endpoint with exposed alt-text
const wrapInCopy = function(spanId, spanText) {
  return `<span id="${spanId}" style="cursor: pointer" onclick="animateAndCopyText(this, '${spanId}')">${spanText}</span>`;
}

app.get('/compose', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  // Developer's view of a pixie render.
  const location = req.query.location;
  if (absentValue(location)) {
    redirectToSetLocation(req, res);
    return;
  }
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  params.dollset = req.query.set;
  params.units   = req.query.units;
  let title = `Pixel Doll Weather Report from ${location}.`;
  params.text = title;
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  let jsonOutput = JSON.stringify(params, null, 2);
  // add a "stations" lookup
  let icaoLocData = stations.get(location);
  let mapUrl = externalMapLink(params);
  let mapLink = '';
  if (mapUrl.startsWith('http')) {
     mapLink = `<a href="${mapUrl}">${mapUrl}</a>`;
  } else {
     mapLink = ' (no geodata)';
     mapLink = mapLink + `, try aviationweather.gov for <a href="https://aviationweather.gov/data/metar/?id=${location}">${location}</a>\n`;
  }
  const elapsedMsg = elapsedMessage(params.zHoursSince);
  const mynav = nav(req);
  const wrappedAlt = wrapInCopy('alttext', alt);
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const body = `${mynav}\n<img width="125" alt="${alt}" src="${src}" title="${title}" /><br/>
       <p>alt (click in text to copy)=${wrappedAlt}</p><p>icaoLocData=${icaoLocData}</p><p>mapLink=${mapLink}</p><p>${elapsedMsg}</p>${mynav}\n<pre>${jsonOutput}</pre>`;
    const responseBody = `${pagehead}<body>${body}</body>`;
    sendHtml(res, responseBody);
    increment('p64count');
  });
});

// factored for param-request and random-request and embed
const servePixie = async function(req, res, location, note, withNav) {
  const isEmbed = !withNav;
  // which pixel doll? is this in 'req' or already 'params' ?
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  if (!note || note == '') { // patch contra factoring, had to be after params call.
    note = `<p>${elapsedMessage(params.zHoursSince)}</p>\n`;
  }
  params.dollset = req.query.set; // qParam to pixie param
  params.units   = req.query.units;
  let title = `Pixel Doll Weather Report from ${location}.`;
  params.text = title;
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  // Currently if we navigate from '/make' there's no dollset; when
  // coming from the home page there's a dollset in the params.
  let dollset = params.dollset; // if bound in compose(); TODO pull late-bound set to server code?
  // add a "stations" lookup
  let icaoLoc = stations.get(location);
  if (!icaoLoc) {
    icaoLoc = `No information in database for station code ${location}.`;
    icaoLoc = icaoLoc + `\n<br/>Try NWS METAR for <a href="https://aviationweather.gov/data/metar/?id=${location}">${location}</a>\n`
  }
  let mapUrl = externalMapLink(params);
  let mapLink = '';
  if (mapUrl.startsWith('http')) {
     mapLink = `<p><a href="${mapUrl}">${location} OpenStreetMap</a></p>`;
  }
  const altTextSpan = '\n<p>' + copyTextClipboard('alt', 'alt text', alt) + '</p>\n';

  let dollparam;
  if (absentValue(dollset)) {
    dollparam = "";
  } else {
    dollparam = `&set=${dollset}`;
  }

  let pixieimg  = '<a href="pixie?location=${station}${dollparam}"><img width="125" alt="${alt}" src="${src}" title="${title}"/></a>';
  const imageHolder = pixieimg.replace(
    /\${station}/g, location).replace(
      /\${dollparam}/g, dollparam).replace(
        /\${alt}/g, alt).replace(
          /\${title}/g, title);

  const copyableImageHolder = pixieimg.replace(
    /\${station}/g, location).replace(
      /\${dollparam}/g, dollparam).replace(
        /\${alt}/g, title).replace(
          /\${title}/g, title);

  const pngRelativeUrl = toUrlWithParams("png", {
    location,
    set: req.query.set,
    units: req.query.units,
  });
  const copyableCode = copyableImageHolder.replace(/\${src}/g, pngRelativeUrl)
  const copyableCodeEscaped = 'Copy the following HTML to include this weather report:<br/><p><tt><span class="sourceloc" style="display: none">${copyableCode}</span></tt></p>'.replace(/\${copyableCode}/g, escapeHtml(copyableCode));
  const mynav = nav(req);
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => {
    const linkedImage = imageHolder.replace(/\${src}/g, src);
    const pageContent = linkedImage + `<br/><p>${icaoLoc}</p>${mapLink}${altTextSpan}${copyableCodeEscaped}${note}`;
    let responseBody;
    if (isEmbed) {
      let linkedImageNewTab = linkedImage.replace(/<a /, '<a target="_blank" ');
      responseBody = `${pagehead}<body>\n${linkedImageNewTab}\n</body>`;
    } else {
      responseBody = `${locpagehead}<body onload="onLoadIncludeOriginBaseUrl()">\n${mynav}\n${pageContent}\n${mynav}\n</body>`;
    }
    sendHtml(res, responseBody);
    increment('p64count');
  });
}

app.get('/about', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  let doc = anchor('https://github.com/jmeowmeow/PixieReport/blob/main/doc/weatherpixie-prospectus.md','PixieReport Prospectus', 'PixieReport History, Notes, and Prospects');
  let body = "<p>About the PixieReport server.</p>";
  body += "<p>⛅</p>";
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
    sendHtml(res, responseBody);
    increment('p64count');
  });
});

// parameters: airport code, C/F, which pixie set; optional!
app.get('/pixie', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  const location = req.query.location;
  if (absentValue(location)) {
    redirectToSetLocation(req, res);
    return;
  }

    const withNav = true;
    servePixie(req, res, location, '', withNav);
  });

app.get('/random', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  const location = randomStation();
  // can we supply a doll set and C/F params (or other theming params?)
  // can we add a response header like 'Refresh: "3"' for a slide show? Yes!
  const refsec = '10';
  res.header('Refresh', refsec);
  const withNav = true;
  servePixie(req, res, location, `<p>New pixie every ${refsec} seconds.</p>`, withNav);
});

// embed: no navigation in or out, this endpoint is supposed
// to be for iframes, etc.
app.get('/embed', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  let location = req.query.location;
  if (absentValue(location)) {
    location = randomStation();
  }
  const falseForNoNav = false;
  servePixie(req, res, location, '', falseForNoNav);
});

// <img src="/worldmap">
app.get('/worldmap', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  const worldbuf = await resources.worldMap.img.getBufferAsync(Jimp.MIME_PNG);
  res
  .writeHead(200, {
    'Content-Length': Buffer.byteLength(worldbuf),
    'Content-Type': 'image/png'
  })
  .end(worldbuf);

});

app.get('/png', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  const location = req.query.location;
  if (absentValue(location)) {
    redirectToSetLocation(req, res);
    return;
  }
  const params = decodedToParamsForStation(await fetchMETAR(location), location);
  params.dollset = req.query.set; // qParam to doll param
  params.units   = req.query.units;
  // if this fails, we should probably return a default image.
  var [pixie, alt]= await pixieAlt(params).catch(console.error);
  const pngbuf = await pixie.getBufferAsync(Jimp.MIME_PNG);
  res
  .writeHead(200, {
    'Content-Length': Buffer.byteLength(pngbuf),
    'Content-Type': 'image/png'
  })
  .end(pngbuf);
  increment('pngcount');
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
  tallyPage(req);
  tallyClientIp(req);
  res.setHeader('Content-Type', 'text/plain');
  // JSON dump of header object
  let headers = JSON.stringify(req.headers, null, 2);
  res.send(`Uptime: ${to_hhmmss(sinceStart())}\n${dispcounters('')}\npages ${disppages('')}\ncallers ${dispclients('')}\nrobots ${disprobots('')}\n\n${headers}\n`);
});

app.get('/cache', (req, res) => {
  const dtNow = Date.now();
  tallyPage(req);
  tallyClientIp(req);
  res.setHeader('Content-Type', 'text/html');
  res.header('Refresh', '10');
  let body;
  let keys = (cache.size > 0) ? [...cache.keys()].reduce((a,b) => `${a}, ${b}`) : '[ ]';
  let activekeys = [...cache.keys()].filter(k => (undefined !== cache.get(k, Date.now()))).reduce((a,b) => `${a}, ${b}`,'');
  let expiredkeys = [...cache.keys()].filter(k => (undefined === cache.get(k, Date.now()))).reduce((a,b) => `${a}, ${b}`,'');
  body = `<p>Uptime: ${to_hhmmss(sinceStart())}</p><p>${dispcounters('<br/>\n')}</p><p>Cache size = ${cache.size}</p><p>Keys:<br/>${keys}</p><hr/><p>Active keys:<br/>${activekeys}</p><hr/><p>Expired keys:<br/>${expiredkeys}</p>`;
  const responseBody = `<!DOCTYPE html>\n<html>${pagehead}<body>\n${navigation}\n${body}\n${navigation}\n</body>\n</html>\n`;
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

const makeSetTable = async function(withPicker, urlProps) {
  const tempLevels = resources.tempLevels;
  const units = (urlProps) ? urlProps.units : 'C';
  const tempHdr = function(idx) {
    const tl  = tempLevels[idx];
    let hdr;
    if (units == 'F') {
      if (idx == 0) {
        hdr = `${tl.level}<br/>up to ${tl.upperF}F`;
      } else if (idx == 4) {
        hdr = `${tl.level}<br/>${tl.lowerF}F and up`;
      } else {
      hdr = `${tl.level}<br/>${tl.lowerF}F to ${tl.upperF}F`;
      }
    } else {
      if (idx == 0) {
        hdr = `${tl.level}<br/>up to ${tl.upperC}C`;
      } else if (idx == 4) {
        hdr = `${tl.level}<br/>${tl.lowerC}C and up`;
      } else {
        hdr = `${tl.level}<br/>${tl.lowerC}C to ${tl.upperC}C`
      }
    }
    return hdr;
  }

  let body = '<p>Pixel Doll Sets</p>\n';
  body = `${body}<br/><table border><tr><th>Set</th><th>${tempHdr(0)}</th><th>${tempHdr(1)}</th><th>${tempHdr(2)}</th><th>${tempHdr(3)}</th><th>${tempHdr(4)}</th></tr>\n`;
  if (withPicker) {
    const noPixieLayer = resources.namedLayers.get("whichpixie");
    const noPixie = await toPixieImageElement(noPixieLayer);
    const noPixieUrl = withQueryParams(urlProps.baseUrl, {...urlProps, dollset: undefined});
    body = `${body}<tr><td>${noPixieUrl}<br/>no doll set</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = `${body}<td>${noPixie}</td>`;
    body = body + '</tr>\n';
  }
  // resources.howManySets : index-based iteration of pixel doll sets
  // This will work for a bit, and Tamsin's was up in the double digits
  // howManySets presumes that all sets are displayed on one page; also,
  // resources.dollSets is loaded separately from resources.howManySets (oops!)
  for (let setNum = 0; setNum < resources.howManySets; setNum += 1) {
    const dollLayers = resources.dollSets[setNum]; // array 0..4 of desc, path, toJimp()
    const dollsetUrl = withPicker ? withQueryParams(urlProps.baseUrl, {...urlProps, dollset: setNum}) : '';
    body = `${body}<tr><td>${dollsetUrl}<br/>set ${setNum}</td>`;
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

const makeSetPicker = async function(props) {
  return makeSetTable(asPicker, props);
}

const makeSetViewer = async function() {
  return makeSetTable(asViewer, undefined);
}

const pixieProps = function(req) {
  let location = req.query.location;   // undef is ok
  let dollset  = req.query.set;        // undef is ok; filter out unknowns <0 >setnum
  let units    = req.query.units;      // C or F, upcased, undef is ok; filter out unknowns
  return { units, dollset, location }; // shorthand: 'units': units, etc.
}

const asClickToCopyUrl = function(pixieOrPngUrlPath, domId) {
  // domId names the element with innerText with the URL to be copied
  let copySpan = `<span onclick="animateAndCopyPath(this, '${domId}')" style="text-decoration: underline; cursor: pointer">copy URL to clipboard &#x1f4cb;</span>`;
  return `Follow link ${pixieOrPngUrlPath} or ${copySpan}.`;
}

app.get('/make', async (req, res) => {  // dollset and units picker, location wip
  tallyPage(req);
  tallyClientIp(req);
  const mynav = nav(req);
  // Don't redirect if station or set is undefined,
  // we want this endpoint to potentially be re-entered
  // during editing choices and allow undef values.
  let location = req.query.location; // undef is ok
  let dollset  = req.query.set;      // undef is ok; filter out unknowns <0 >setnum
  let units    = req.query.units;    // C or F, upcased, undef is ok; filter out unknowns
  const props  = { ...pixieProps(req), baseUrl: '/make' }; // 'units': units, etc.

  // somewhere in here, if we have degLat and degLong but location is undefined/unknown,
  // bind the nearest station to the location parameter. Otherwise we fall through to a
  // random station. The image map redirection will bind a station but forget all else.

  // Depict the URLs being constructed, the important dimensions being:
  // which endpoint: PNG or iframe source; maybe a multi-station array like "nearby"
  // source/render choices, all optional: weather station, pixie set, C/F.
  //
  // Make the urlSection URLs rendered and copy-pasteable; therefore to do
  // client-side: prefix document.location to the preview URL paths when clicked.
  const endpoints = [ "/pixie", "/png" ];
  let endpointsWithParams = [];
  endpoints.map( each => { 
          let idName = `urlfor${each.slice(1)}`;
	  endpointsWithParams.push(
    `<br/>${asClickToCopyUrl(withQueryParamsAndId(each, props, idName), idName)}\n`); });

  // let's do that again with '/make' and the units property.
  let unitsOptionsUrls = [];
  const unitsOptions = [ undefined, 'C', 'F' ];
  unitsOptions.map( each => { unitsOptionsUrls.push(
    `${withQueryParams('/make', {...props, 'units': each})}\n`); });
  const urlSection = `<p>URLs to copy:<br/>${endpointsWithParams[0]}${endpointsWithParams[1]}</p>`;
  // early-bind a PNG preview location so a random pick is conserved on clickthrough
  const propsWithLocation = { ...props, 'location': (location) ? location : randomStation() }
  const previewPngUrl = toUrlWithParams('/png', propsWithLocation);
  const previewClickUrl = toUrlWithParams('/pixie', propsWithLocation);
  const previewSection = `Preview Image<br/><a href="${previewClickUrl}"><img src="${previewPngUrl}" title="picker preview" /></a><br/>`;
  const unitsSection = "<p>Choose Weather Report Units<br/>" +
    `C/F by station locale: ${unitsOptionsUrls[0]}<br/>` +
		`C/hPa/kph: ${unitsOptionsUrls[1]}<br/>` +
		`F/mmHg/mph: ${unitsOptionsUrls[2]}</p>\n`;

  const table = await makeSetPicker(props);
  const worldmap = '<a href="/makemap"><img src="/worldmap" alt="clickable world map" ismap="true"></a>';
  const responseBody = `${pagehead}<body>\n${mynav}\n${urlSection}\n${previewSection}\n${unitsSection}\n${worldmap}\n${table}\n${mynav}\n</body>`;
  sendHtml(res, responseBody);
});

app.get('/sets', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  const mynav = nav(req);
  const body = await makeSetViewer();
  const responseBody = `${pagehead}<body>\n${mynav}\n${body}\n${mynav}\n</body>`;
  sendHtml(res, responseBody);
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
   let spacer = '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';
   let gridnav = '<table width="100%"><tr>\n'+latnav + '</tr>\n'+spacer+'\n<tr>' + longnav + '</tr></table>\n';
   return gridnav;
}

// iterate over closest twelve, produce a station dot for each
// Can we make the svg dots clickable in the context of the current page?
const stationDot = function(sta, span, latlong, coordScale) {
  const stn = sta.station;
//  const refLat  = latlong.degLat; // viewpoint coords
//  const refLong = latlong.degLong;
  const cx = 250 + coordScale * 500 * (sta.long - span.longMean)/span.longSpan;
  const cy = 250 - coordScale * 500 * (sta.lat  - span.latMean)/span.latSpan;
  const circle = `<circle title="${stn}" id="${stn}" cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="2" fill="black"/>`;
  const label = `<text x="${cx.toFixed(2)}" y="${(cy+4).toFixed(2)}">-${stn}</text>`;
  let staLatLong = {lat: sta.lat, long: sta.long};
  let cxcy = {cx, cy};
  return ''+circle+label;
};

// Handle imagemap clicks using ?x,y query format
// we lose any dollset or C/F units params, c'est la vie for server-parsed imagemaps
const imageMapRedirection = function(req, res, pathTemplate) {

  // any error parsing x,y could be reasonably responded to with a 4x code
  let xy = Object.keys(req.query).filter(k => /,/.test(k)).at(0).split(',');
  let x = Number(xy[0]);
  let y = Number(xy[1]);

  // todo check for shenanigans and return a 4xx go away robot.

  let width = resources.worldMap.width;
  let height = resources.worldMap.height;
  let long=((x - width/2)/width*360.0).toFixed(1);
  let lat=((height/2 - y)/height*180.0).toFixed(1);
  let location = closestStation(lat, long);
  // redirection for /make will bind a station; for /stations will bind lat/long.
  let redirection =
    pathTemplate.replace('${location}', location).replace('${lat}', lat).replace('${long}', long);
  res.redirect(redirection);
  return;

};

app.get('/stationsmap', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  imageMapRedirection(req, res, '/stations?degLat=${lat}&degLong=${long}');
});

app.get('/makemap', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  imageMapRedirection(req, res, '/make?location=${location}');
});

// factored from /stations for use in /make with geo picker
const closestStationsWithDistance = function(latlong) {
// latlong = {degLat: float, degLong: float}
  const coslat = Math.cos(3.141 * latlong.degLat / 180.0); // 180 degrees / pi radians
  const ifdef = function(val) { if ((typeof val) === 'number') { return val;} else { return 9999; }}
  // approximate distance metric, weighting longitude decreasing by cosine of latitude.
  const diffwt = function(stn) {
    let dw = ((coslat * Math.abs(ifdef(stn.long) - latlong.degLong)) +
              (Math.abs(ifdef(stn.lat) - latlong.degLat)));
    return dw;
  }
  let closestStns = stationsByLong.slice(0).sort( (a, b) => (diffwt(a) - diffwt(b)) );
  closestStns.map(each => ( each.distance = diffwt(each)));
  return closestStns;
};

const closestStation = function(degLat, degLong) {
  let latlong = { degLat: Number.parseFloat(degLat),
                  degLong: Number.parseFloat(degLong) };
  let stations = closestStationsWithDistance(latlong);
  return stations[0].station;
};

app.get('/stations', async (req, res) => {
  tallyPage(req);
  tallyClientIp(req);
  // start of extractable logic for nearby stations (for /make station picker)

  // handling input parameters and extracting values for page logic
  const location = req.query.location;
  let units = req.query.units;
  if (units == 'F' || units == 'C') {
    units = `&units=${units}`;
  } else {
    units = '';
  }
  let body = '';
  let myLocation = "Grid Coordinates";
  let latlong = { degLat: 0.0, degLong: 0.0 }
  let myClosestStations = '';
  // preserve a dollset value from the query params if needed;
  // otherwise render the no-doll-set image with a random set
  let urlDollset = req.query.set;
  if (!(req.query.set == 0 || req.query.set == '0' || req.query.set))
    { urlDollset = resources.randomDollSetNum(); }

  // do we have a weather station code? y/n
  if (absentValue(location)) {
    // maybe there is a degLat/degLong passed as query params?
    if (req.query.degLat && req.query.degLong) {
      latlong = { degLat: Number.parseFloat(req.query.degLat),
                  degLong: Number.parseFloat(req.query.degLong) };
    } else {
      // okay, use Zero Zero
      let redirection = req.path + '?degLat=0.0&degLong=0.0'+units;
      res.redirect(redirection);
      return;
    }
  } else {
    // we have a station code in the input params
    let icaoLocData = stations.get(location); // lat/long after last comma
    if (icaoLocData) {
      myLocation = icaoLocData.substring(1+icaoLocData.lastIndexOf(', '));
    }
    // use the lat/long from the external data report (see London airports for confusion)
    const params = decodedToParamsForStation(await fetchMETAR(location), location);
    latlong = params.latlong;
  }
  // we have all the data needed to find the nearest stations

  // find the nearest (active) stations -- there is a long list and a short list of active
  // short = 5000 ; long = 12k?
  let gridnav="";
  let showLimits = "";
  let mySvg = '<svg></svg>';
  if (latlong) {
  //  gridnav = '<p>\n'+makeGridNav(req.path, latlong)+'\n</p>\n';
      gridnav = '<p>Grid navigation temporarily disabled: scrapers.</p>\n';
      myLocation = myLocation + ' ' + JSON.stringify(latlong);
      let closestStns = closestStationsWithDistance(latlong);
      // anchored list of closest METAR stations on our active station list
      const closestTwelve = closestStns.slice(0,12);
      const firstStn =    closestTwelve[0];
      const firstStnUrl = toUrlWithParams('/stations', {...pixieProps(req), 'location': firstStn.station});
      const firstStnStr = `${firstStn.distance.toFixed(2)} ${anchor(firstStnUrl, firstStn.station, 'Stations near '+firstStn.station)} ${firstStn.desc}`;
      const closestStnsStr  = firstStnStr + closestTwelve.slice(1).reduce((a, b) =>
        (`${a}<br/>\n${b.distance.toFixed(2)} ${anchor('/stations?location='+b.station+units, b.station, 'Stations near '+b.station)} ${b.desc}`), "");

      // code duplication from home page array
      let tileNo = 0;
      let pixiegridimg  = '<a style="display: grid" href="pixie?location=${station}&set=${dollset}'+
        units +
        '"><img height="100%" width="100%" style="display: grid; object-fit: cover" alt="pixie for ${station}" src="/png?location=${station}&set=${dollset}'+
        units +
        '" title="pixie for ${station}"/></a>';
      closestTwelve.map(each =>
      {
        let stn = each.station;
        let dollset = (tileNo == 0) ? urlDollset : resources.randomDollSetNum(); // retain url for first image
        myClosestStations += pixiegridimg.replace(/\${station}/g, stn).replace(/\${dollset}/g, dollset);
        tileNo++;
        if (tileNo % 4 === 0) {
           myClosestStations += "\n"; // the newline is a hint in view-source rather than layout mark-up
        }
      });
// Set display: grid  on the containing element and then grid-template-rows: repeat(4, 1fr) and grid-template-columns: repeat(3, 1fr) (4w x 3h)
      myClosestStations = `<div id="nearbyholder" style="max-width: 70vh; display: grid; grid-template-rows: repeat(3, 1fr); grid-template-columns: repeat(4, 1fr)">\n${myClosestStations}</div>\n`;
      myClosestStations += `<hr/>\n<p>Closest (lat/long):<br/>\n${closestStnsStr}></p>\n<p>`;

      const lats =  closestTwelve.map( e => e.lat).concat(latlong.degLat).sort( (a, b) => (a - b) );
      const longs = closestTwelve.map( e => e.long).concat(latlong.degLong).sort( (a, b) => (a - b) );
      const latSpan = (lats[11] - lats[0]);
      const longSpan = (longs[11] - longs[0]);
      const latMin = lats[0];
      const latMax = lats[11];
      const latMean = ((lats[11] + lats[0])/2.0);
      const longMin = longs[0];
      const longMax = longs[11];
      const longMean = ((longs[11] + longs[0])/2.0);
      const span = {latMin, latMax, latMean, latSpan, longMin, longMax, longMean, longSpan};
      // Fitting the nearby stations into the map looks like a job for viewbox
      // but I couldn't get things to work well; therefore center-based coords
      // (250,250) for a 500x500 SVG, and coordScale to shrink toward center.
      const coordScale = 0.8;
      const stationDots = closestTwelve.map( e => stationDot(e, span, latlong, coordScale) ).reduce( (a, b) => `${a}\n${b}`, '');
      const cx = 250 + coordScale*(500 * (latlong.degLong - span.longMean)/span.longSpan);
      const cy = 250 - coordScale*(500 * (latlong.degLat - span.latMean)/span.latSpan);
      const viewpointDot = `<circle title="viewpoint" id="viewpoint" cx="${cx}" cy="${cy}" r="5" stroke="black" fill="none"/>`;
      mySvg = `<svg width="500" viewbox="0 0 500 500"><rect x="0" y="0" width="100%" height="100%" fill="none" stroke="blue" />${stationDots}\n${viewpointDot}</svg>`;
      showLimits = `<p>The range of the stations and the viewpoint is ${latMin.toFixed(2)} to ${latMax.toFixed(2)} latitude, ${longMin.toFixed(2)} to ${longMax.toFixed(2)} longitude, or ${latSpan.toFixed(3)} deg lat, ${longSpan.toFixed(3)} deg long.</p>`;
    }
  // if we didn't render anything the results will be pretty empty
  const mynav = nav(req);
  const mapPane = `${showLimits}\n${mySvg}`;
  // end of the repurposeable code for /make

  const worldmap = '<a href="/stationsmap"><img src="/worldmap" alt="clickable world map" ismap="true"></a>';
  // render the /location page output to the servlet output stream
  body = `<p>Uptime: ${to_hhmmss(sinceStart())}</p><p>${myLocation}</p>${gridnav}${myClosestStations}${mapPane}`;
  body = body + worldmap;
  const responseBody = `${pagehead}<body>\n${mynav}\n${body}\n${mynav}\n</body>`;
  sendHtml(res, responseBody);
});


app.listen(port, host, () => {
  console.log(`${new Date().toLocaleTimeString()} Server listening at http://${host}:${port} (${sinceStart()} msec)`);
});
