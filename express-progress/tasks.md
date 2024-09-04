## tasks.md

Progress on expressJS server branch

Earlier work from 14 Mar 2024 to [./archived-tasks.md](./archived-tasks.md)

8<---     Cut above to archived-tasks.md and below remains in tasks.md     --->8

Tue 25 Jun 2024 09:16:50 AM PDT

Two notes on bulk METAR fetch:

Note 1. The METARS cache file with raw METAR readouts is a reminder that it might be
useful to create a parsing stage which will take a METAR and extract weather
information comparable to the parsed METAR endpoint we're hitting.

Note 2. The pixie tableau on / is a reminder that each uncached image render is a
double latency hit: browser to PixieReport server, PixieReport server to
NOAA METAR server, and the NOAA METAR requests are a burst that sometimes
results in a timeout. So maybe a little cache is in order! I can feel a
little architecture on its way. And we could do a little preload of METARs
at server start!

How about a pixel set parameter? Do we have a params story in general for
bookmarking or defaults?

Rollover from previous days of possible Tuesday intentions.

Some progress Wednesday-Thursday for pixie sets.

- [X] Address which pixie set via params. set=0,1,2,3 or set=bunny,selfie,pixie0,moomin
- [X] Pixie preview link in / or /random should include the pixie set as a param.
- [ ] Image cache with 5-10min duration. Add a nocache param? but redirect if seen.


Tue 09 Jul 2024 08:12:49 AM PDT

Reviewing "done" and "tasks" Probably ready for a revamp and rollover of tasks.

Next obvious bits:

Public alpha, needs:
* METAR report cache to avoid hammering the NWS
* status and statistics page (all we have is uptime and the console)


Thu 11 Jul 2024 08:45:38 AM PDT

Yesterday: fixed NPM tests. There's still an occasional race condition
with the Jimp tests, maybe Jasmine is in a little hurry with evaluating
unresolved promises?

Check-in of initial METAR cache and spec. Going to try and develop this with
spec tracking cache behavior.

Thoughts from yesterday near sunset: day/night of report may lag the current
time enough to see as "hey, shouldn't it be twilight already?" so the relevant
thought is: when should we use clock time for day/night rather than report time?

Intention: more cache tests?

Fri 12 Jul 2024 12:10:06 PM PDT

Today: deployed to pixiereport.com, but I see more cache misses than I would
expect when reloading the home page (which is mostly the same set of stations).

1. Is there some non-shared-context going on with Express?
2. Maybe I need a cache list page.
3. Oh oops I forgot to make a fetch generate a cache.put();


**Cache Thoughts**

Extracted to [./cache.md](./cache.md)


Tue 16 Jul 2024 09:26:27 AM PDT

* Cache implemented and deployed. It could use an automatic expire.
* PM2 rolled out as new production launcher. First one's free! [pm2.io](https://pm2.io).
* Updated [./cache.md](./cache.md) and [./done.md](./done.md).

Tuesday intentions:
* Review the prospectus. (check.)
* Consider launch tasks:
    * How do we set up a HTTPS cert for \*.pixiereport.com ?
    * reverse proxy via nginx or other?
* Consider nearest-sites using icao.js geolocations near in lat or long.
* Add some list of nearest sites to the devpixie / compose page.

Wilder ideas (not today):
* Bring Your Own Pictures via PaperJS or a simpler "load to canvas, add transparency".
* As well as /png, have /randompng for a slide show of includable images. Alt text to HTTP headers?
* As well as /png, have /gif for gif89a animated pics or slideshow stacks of multiple locs.
* Multiple "location" query params to make your own matrix (or gif). Redirect to a canonical version for URL based caching if you like.

Mon 22 Jul 2024 05:06:14 PM PDT

* Working on sorted grid of stations by lat/long for "nearest stations to this one".


Mon 29 Jul 2024 09:24:17 AM PDT

Done since last Monday:
* Nearest-stations includes a grid of linked images.

Intention:
* Default View for Nearby Stations. See thoughts below.

Thoughts on navigating nearby stations:
* DONE. Nearby Stations Default View: Zero Zero Island (degLat, degLong)
* Nearby Stations Zoom by Decimation. Do we want to do some binning? Only the most remote
stations have a large reach, because densely spaced stations give a small area.
* Nearby Stations in each cardinal direction. Kind of nonsensical for high latitude but helpful if you're on a continent edge and your next-East or next-West station is a jump; also allows southern-edge stations more reach.
* DONE. Nearby Stations by Lat-Long, with directional browsing. "Stations near LAT, LONG" and
navigation with +/- degrees.
* Of course there's much-thought-of, much-deferred OpenStreetMap Leaflet and linked pegs for navigation.
* Client-side imagemap for nearby stations navigation. One could JUST DO THAT on a static world map or SVG world map, or pair of world / nearby station image maps.

Wilder idea (from Sunday wiki):
* External Federated Wiki server URL patterns, serving wiki-compatible JSON including
sitemap and cache items. Try using Eric Dobbs' model of a wiki-compatible bookmarking
site from Glitch, an "outpost" of Federated Wiki.

Thu 01 Aug 2024 09:53:23 AM PDT

Added OpenGraph "meta" properties for preview, though maybe the image should be static.

Catch-up on notes and progress. Fetched from the Weatherpixie Prospectus,
the features of Tamsin's site. See below, "Weatherpixie.com Features"

Sun 04 Aug 2024

Revise OpenGraph image source URL to GitHub hosted raw PNG.

Wed 07 Aug 2024 09:12:37 AM PDT

Review prelaunch tasks.

From a scan of the empty to-dos, it looks like I want a pixie creation wizard.

Yesterday I looked at clipboard handling "copy to clipboard" on MDN,
which appears to work without extra permissions if launched by a click
handler.

Better handling of the keys list when the app is idle. Enough with the
list reduce error. We know the cache size so don't render an empty cache.

Sun 11 Aug 2024

Pushed through the remaining steps to a soft launch with HTTPS and
current prototype webapp. Announce on Twitter (PixieReport), Mastodon,
and the RC social site.

Opengraph preview image appears to work fine. I could even post it
on Facebook. Uh-oh. Instant Slashdot/Reddit/Hacker News Effect?

Mon 12 Aug 2024

Discovered that "random pixie image" is already a feature,
when using `pixiereport.com/png` as an image source URL.

Without location and doll set, the endpoint redirects to a
random station and renders that image. I can see embedded
images already working in Obsidian's Markdown rendering,
refreshing when a page is visited or reloaded.

Time for an update of the prospectus document with the new
milestone!

Thu 15 Aug 2024 08:28:48 AM PDT

Thursday thoughts.

Do I need a robots.txt to allow /about but deny others?

Post-initial launch. It looks like folks are hitting the
endpoints now and then, not just me.

Thursday intentions.

- [X] Request header dump. (turns out it's an Object)
    - [X] Check on client IP header on public site. "GoogleBot!"
- [ ] Freshness of a METAR report, what's non-fresh?
- [ ] Render non-fresh report time how? (hh:mm since?)
- [ ] Cache clear without hitting /cache endpoint 

Mon 19 Aug 2024 08:58:02 AM PDT

First user of pixiereport include via img src, using the Tacoma station.

Cache expiration and purge looks like a good target. Right now it's
a side effect of looking at the /cache page. Should there be an
implicit expire() inside cache.js or should that be in server.js ?

Added expire() in server.js

- [X] Cache expire(dtNow) without hitting /cache endpoint (10% on a pixie image
      cache miss).

De-tabbed cache.js . Probably want to remove tab formatting in your dev
laptop vim for js.

Matrix pixie displays could be inline data: URLs to reduce multiple
web client fetches. Since I'm not using HTTP/2, the best I can hope
for is HTTP/1.1 keep-alive, but I don't know if that's happening. Not
too hard to check from the client side, esp with a transparent proxy
of some sort.

Thinking again about robots.txt after seeing GoogleBot represented as
the most persistent visitor. I compared a couple of public company
websites. One had no robots.txt file. One had a saga.

Should I start with a larger image for the "radio static" layer and
jitter the row, col start to give variety and try out image spriting?
I guess that makes it Not Like Other Layers, but maybe the jitter can
be set to a specific value when the compositing happens? Not sure.

I suppose a composable layer in the layer list could have (dCols, dRows),
or for the pixel dolls we'd know what the dCols would be for each temperature
level pixie image.

Tue 20 Aug 2024 08:26:44 AM PDT

Fetched from archived tasks, for lookup of active stations not in DB:
Station PANU (Nulato, Alaska) https://aviationweather.gov/data/metar/?id=PANU
Maybe try [NOAA MADIS](https://madis.ncep.noaa.gov/madis_metar.shtml)

Spaced out the lat/long navigation links for the "nearby stations" page
and it helps a little but the text on mobile is super small.

Deployed the cache expiration call. 1 in 10, whenever we're likely
to add to the cache, first run an expire(). This gives us 1 or 2
likely expire() calls per homepage or "stations nearby" fetches.

Looking at the homepage and nearby, they're missing the descriptive
alt text because we don't have it until we run a fetch, and for an
image inclusion on the /png endpoint, the browser doesn't get it.

I guess one could add something in the PNG properties but it's not
like the browser would expose that detail in the view.

Two sides to doing the pixie matrix pages as img src=data server-side:
    1. Having a client page pull 12 or 16 pixies is that much client-side chattiness.
    2. Having the server pull 12 or 16 pixies is a potential hammering of the NWS METAR servers

Pulling to-dos from earlier: freshness.

- [ ] Freshness of a METAR report, how old is non-fresh?
- [ ] Render non-fresh report time how? (hh:mm since?)

The computed pixie parameters have two dates available.
* One uses the server date and the raw METAR, which has the UT day-of-month
and clock time encoded. The "zuluDate" parameter has this information.
* One is supplied from the parsed report, and is reported with the parameter "dateTimeUTC.utcDate" as a subfield of dateTimeUTC.

If a decoded report hangs around long enough (which it can!), then
you can get wildly different guesses between zuluDate (guesses at
current or last month) and utcDate (set when the report is decoded).

Here's the question behind this comparison: should we prefer a bulk
METAR fetch to be less chatty with the public weather servers? If
so, is that "bulk latest METAR" data all pretty recent, so that we
can use zuluDate and a little fiddling around month and year turns?

The first step is probably wiring a freshness number into the computed params,
with a resolution of minutes since report time to server time of param
computation.


Wed 21 Aug 2024 08:24:43 AM PDT

Noticing a couple of no-icao-data reports. So:

When neither report nor DB has location data, suggest on the pixie page:
https://aviationweather.gov/data/metar/?id=${location}
or possibly a MADIS lookup from there or directly?
  [NOAA MADIS](https://madis.ncep.noaa.gov/madis_metar.shtml)
"No information in database for station ${location}."
Example stations:
K1NN
KX26

Freshness looks like we could determine it right after or as part of
calling decodedToParamsForStation, passing Date.now().

oops caused a test failure by adding two lines and forgetting to
bump up the icao count.


Fri 23 Aug 2024 08:43:51 AM PDT

Yesterday: deployed the tightened pixie landing page matrix.

Thoughts:
* Could the pixie detail page be a picker for doll set and maybe units?
* "record locator" versus "unique ID" concept for doll sets? (numeric IDs ~ externally enumerable?)
* interpreter endpoint, "do" or "token", parse the token and unpack it to a pixie or image request? This would allow bookmarkable behavior while rewriting the URLs as needed.


A feature I would use:
"Click here to copy alt text to system clipboard."

Ops crisis: the National Weather Service rotated its TLS certificate, and the
signing authority cert for Go Daddy was absent from both my dev laptop cert
store and my droplet cert store.

Fixed by:
* Diagnosing the problem (certificate authority cert unrecognized).
* Finding some options, trying them out, failing (didn't have new certs).
* Finding working certs on a newer OS install, copying the Go Daddy certs, and installling them.
* Laptop: installed in main cert store; Production: added to NodeJS extra certs.

Mon 26 Aug 2024 08:37:46 AM PDT

Next Obvious Steps

- [X] Make freshness more visible. We have it in params as hours.tenths now. (Added in /compose and /pixie)

Tue 27 Aug 2024 08:49:39 AM PDT

Comments and intention revealing temp variable names in cache/clients and counters.

Wed 28 Aug 2024 08:45:22 AM PDT

Rollover Monday intentions.

- [ ] Factor doll sets into an object composed in preloads. That helps with a picker and duplicated logic across preloads, server, and composer.
    - [X] Tag usages of the dollset names and cardinality in server and composer.
    - [X] Make these calls on the preloaded dollsets resource.
    - [ ] Use the dollsets resource in new logic like a picker or displayer.
- [ ] Copy-to-clipboard functionality. Useful for URLs.

Experiment

- [ ] iFrame experiment, transcludable frame source endpoint like no-nav body of /pixie. Maybe mix up the subdomain a little bit? pixiereport.com with an iframe from www.pixiereport.com perhaps. Basically we're looking for image, alt text, and a link that opens a full page with navigation back on pixiereport.com with the iframe settings, maybe in a wizard or picker.

Tue 03 Sep 2024 09:12:51 AM PDT

Tuesday.
* Placeholder for pixel doll set page. Chose not to add the query params to /sets but maybe could use it to pre-set the chosen pixie doll set.
* Finished initial version of '/sets'. Not interactive, but shows all the doll layers.


## Weatherpixie.com Features

### Tamsin's Model Site Features
1. Pixie Creation Wizard:
    1. Geographic picker to find the nearest airport to a location, or search by continent and country. Yields an airport code.
    1. Pixie Doll Picker. Each has a description and is encoded by a small integer ID.
    1. Unit picker (mph/kph, °F/°C)
    1. Maybe other options? I don't recall
2. Pixie Preview Page:
    1. Rendered Weatherpixie.
    1. URL to embed the image on your site.
3. Site navigation
    1. "About" page, site/project background, links to resources, etc.
4. Pixie Renderer. Given an airport, a doll series, and display options, renders a scene. If there is no current METAR data for that airport, renders daytime/nighttime background and a flag.
5. Rendered Pixies served as images
6. HTTP Cookie to remember your chosen location, doll style, units.

### PixieReport ExpressJS site features:
- [ ] Pixie Creation Wizard
    - [ ] Geographic picker
    - [ ] Doll set picker
        - [ ] Which doll sets are available?
    - [ ] C/F unit picker
- [ ] Pixie Preview Page
    - [ ] Copy this URL / cookie-me this pixie / copy this embed
- [X] Site Navigation
- [ ] Pixie Renderer
    - [X] METAR code, doll series yield a scene
    - [X] No-data mode: TV static if not available
    - [ ] No-current-data mode: not yet sensitive to freshness.
- [X] Rendered Pixies served as images
    - [X] /png endpoint
- [ ] HTTP Cookie to remember your chosen location, doll style, units.

Prelaunch
- [X] Caddy or Nginx reverse proxy. (Nginx)
- [X] Certbot or similar. Certbot, but a one-off 2024-08-11. Because fedwiki occupies :80, I have to manually fetch new certs or script the down / up hooks.

## Next Step Directions

Generally:
* User-friendliness
* Dev features less obvious/obtrusive
* Mobile stylings
* Code cleanup, dev-doc system as built
* Ops friendliness

### Webapp Functions
- [X] HTTP refresh header slideshow of random pixie /random
- [X] /random - should also link individual slides and jump out of show
- [X] /png - with no args, serves as a discovered "random pixie image" feature.
- [X] Explore ICAO METAR stations (random, like Twitter PixieReport).
- [X] Instead of defaulting KSEA, random pixie via hit and redirect
- [X] Nearest other stations, based on geo-sort
- [ ] Station list view/search

### Webapp architecture
- [X] page template structure with navigation
- [X] favicon templated into every page _mostly_ (only in HTML pages, not PNG or text/plain)
- [X] Basic uptime endpoint.
- [X] Useful uptime page with stats (pixies served, uptime, maybe error count) maybe in template footer
- [X] Start an ops status / robustness / recovery list.
- [X] Most recent IP addresses requesting pages. ExpressJs request param? Look for proxy headers with actual client IP address, not "localhost".
- [ ] Replace string with URL object with template/builder behavior for links/redirects.
- [ ] Rethink URL path handlers, remove unneeded ones.
- [ ] Document which URLs are designed to be supported
- [X] Add robots.txt

### Reporting Stations
- [X] Refresh ICAO.js by grabbing a whole-set zip and using it for active stations
- [ ] Log 404s from actual METAR source, scrub candidates from ICAO.js .
- [ ] METAR stations as a queryable database; how to query? what lists? "near lat, long?"
- [ ] Pick METAR stations from a map, like FedWiki map marker plugin.

### Parity with Twitterbot pixies. See [./done](./done.md)

### Jimp Layer and Pixie Preload - done, see [./done](./done.md).

### Tasks to be Ready for Main Branch / Code Review

* Presumes "Full PixieReport Function" below (pixie sets, etc.)

- [ ] Remove unused files and functions from other versions.
- [ ] Remove neglected endpoint handlers which have served their purpose
- [ ] Remove console.log for routine operations.
- [ ] Update the prospectus document.
- [ ] Add an about/credits/source/acknowledgements page to the source.
- [ ] Consider assertions as a prelude to tests.
- [ ] Consider TheDryPrinciple for resources.
- [ ] Is there a jslint to run for suggested cleanup?
- [ ] Express.js model app format to review?
- [ ] Replace let or global with const as possible.
- [ ] Name output template strings rather than leaving nameless inline.


---

Next Logical Steps (next *notional* steps for evolutionary architecture?)
- [X] Verify the layerfile composition, maybe /layers (or echo it alongside /compose output)
- [ ] Factor out layer map into a layer locator passed from the server main program and/or export it to a resource helper.

Full PixieReport function (minus the weather report location choosing wizard) needs
- [X] Get a font matching the original WeatherPixie loaded into Jimp
- [X] Write the weather report text on the image
- [X] alt-text in the HTML page presentation using pre-existing logic
- [X] Choose a pixel doll set with UI/URL parameter
- [X] PNG output endpoint or PNG-data-img is fine. Or select just-image as ".png" or ".jpg" like http.cat ?
- [ ] Group pixie-set-specific weather layers separately from generic weather?
- [ ] Graceful error handling for missing report data or fetch failure
- [ ] Error handling for internal error cases beyond catch(console.error)? Or let-it-crash.
- [ ] Cacheable URL scheme (path params vs. query params?) responses, cache headers.

Weather Report Choosing Wizard
- [X] prototyped in fedwiki with web-linked markers on Leaflet map widget


## Operations Status, Robustness, and Recovery
From the above item:
- [X] Start an ops status / robustness / recovery list.

### Service start / restart
 - [X] start-up script? Replace "nohup node server.js", ^Z, "bg"  (pm2 below)
 - [X] daemonization, better automatic restartability. Using PM2 [pm2.io](https://pm2.io).

### Service load
 - [ ] observe load and latency (Express or Node runtime obs? PM2 builtins?)
 - [X] experiment with cache. Implemented cache.

### Pixie Rendering Flaw Reporting and Handling
Add more information in an ops page, maybe frame-in some specific logs.
 - [ ] What about rarely reporting stations? Should we refresh the active snapshot more often?
 - [ ] What about stations with an unchanging old report? (time/date detection)
 - [ ] What about stations with no geodata? Is this something loggable in the uptime/debug page?
 - [ ] What about weather conditions with no mapped image layer ("light rain showers"): loggable other than console?

### Full METAR parse from raw METAR report.
These items would enable running from a bulk METAR latest fetch.
 - [ ] Add a fromRawMetar section to debug output.
 - [ ] Include a guess at report time / freshness.
 - [ ] Reproduce the 'Decoded METAR" parsing logic for...
     - [ ] temperature
     - [ ] relative humidity based on temp/dew point/pressure (argh)
     - [ ] wind
     - [ ] sky cover
     - [ ] weather conds

