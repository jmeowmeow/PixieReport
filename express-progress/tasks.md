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
"Click here to copy alt text to system clipboard." (see: MDN Clipboard API)

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
    - [X] Use the dollsets resource in new logic like a picker or displayer. _Displayer_. See '/sets'.
- [ ] Copy-to-clipboard functionality. Useful for URLs.

Experiment

- [ ] iFrame experiment, transcludable frame source endpoint like no-nav body of /pixie. Maybe mix up the subdomain a little bit? pixiereport.com with an iframe from www.pixiereport.com perhaps. Basically we're looking for image, alt text, and a link that opens a full page with navigation back on pixiereport.com with the iframe settings, maybe in a wizard or picker.

Tue 03 Sep 2024 09:12:51 AM PDT

Tuesday.
* Placeholder for pixel doll set page. Chose not to add the query params to /sets but maybe could use it to pre-set the chosen pixie doll set.
* Finished initial version of '/sets'. Not interactive, but shows all the doll layers.

Wed 04 Sep 2024 09:03:04 AM PDT

- [X] Need a push and redeploy for /sets while crossing the UW wi-fi bubble.
- Copy-to-clipboard feels like a soon-ish thing, and some sort of geographic picker.
    - Note that clipboard.write() and clipboard.writeText() supposedly only work in a secure context and how do I even?
    - But MDN's example is pretty straightforward, and one could catch and alert or whatever.
    - [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard)
- Styling for mobile browsers is still pretty terrible.

Mon 09 Sep 2024 08:52:13 AM PDT

Can I whip up a picker? Let's start by passing the location and doll set a la the other
navigation targets.


Mon 16 Sep 2024 08:54:12 AM PDT

Okay where were we? Did I leave a breaking test as a prompt? (No.)

Tempted to fool with the TV static image. There are three more versions from an easy vertical and/or horizontal mirror operation. It could also be an example of a pick-one-from-set operation when grouping image options.

More to the point is the picker. Fiddling with picker result URLs to start.

From the Recurse Center gamedev topic: [Derek Yu's Pixel Art Tutorial](https://derekyu.com/makegames/pixelart.html) with drawing stages for a 96x96 and 32x32 character sprite. He recommends a drawing tablet and just-about-any pixel paint program (Paint, Aseprite, others).

How about this general thought:
* A call to the pixie generator is a query rendered by endpoint and params.
* The query operates on a time-varying database (the latest METAR report per station).
* The query may return multiple results in one or more ways, to wit:
    * A list-formed query returns a result set. Some list items may be "choose a random station."
    * A "locations" query returns a result set ordered by nearness to a station or lat/long.
    * A "favorites" query is a bookmarked list query.
* A query may return varying results for subsequent calls.
    * Unspecified parameters are bound randomly (station, doll set); the /random endpoint.
    * An upstream weather report update.
    * A cached image expires, the new image rebinds unbound params. Cache key includes params.

Tue 17 Sep 2024 06:45:30 PM PDT

We now have a draft picker at /make which forwards the dollset from the query parameters
into the dollset radio button, which includes a "none set" option illustrated by '?' for
the doll images.

Probably the picker should have a little JS to re-read units, dollset, and location and
rebuild the URL locally on a form change. IDK how to do a site picker. Maybe imagemap
of the world with a couple levels of zoom, getting "stations near click" as a list, or
enter a METAR station code and "validate" to look up.


Thu 19 Sep 2024 08:52:41 AM PDT

Arrgh, Talk Like A Pirate Day. Missed opportunity for some pirate and/or parrot art.

/make, Station picker: Or "stations near initial location" and provide some seed
locations as a list to orient on. Or put THOSE seed locations on the front page.
North America, South America, Europe, Mediterranean, Africa, etc.

But first let's get the cycle working with form widgets to model URL.

Rather hacky approach:
* onLoad picks up the current location, set, and units
* onChange substitutes the changed parameter and calls document.location = (new relative URL)
* Let's try that last bit all by itself! (thanks to E. for the suggestion)
* In the console: document.location='/compose?location=LIMC&set=1' : totally works!

Other hacky approach (for doll set, for units; leaving station name aside):
* Each chooser has a GET URL link which is preloaded with that substitution to the source URL.
* No Javascript needed at all, and you already have withQueryParmas(baseUrl, props) to build
  the relative URL from '/make'.


Mon 23 Sep 2024 04:58:24 PM PDT

/make : proceeding on the GET URL approach which requires no widgets or javascript.
* Added dollset/set chooser with URLs for dollset 0,1,2,3 and none.
* Added spec/imageTextSpec.js for useMetric() from pixifier/compute-image-text.js
* Added units='C|F|undefined' as part of the URL, overriding useMetric based on station code.
* Added three options for "&units=C", "&units=F", and absent.
* When should units be part of the image cache key? (edited)
    * Only when the unit type disagrees with the unit type of the station locale.

(on bus: managed to lose my grip on the laptop when my backpack slid forward, and the laptop
shot forward under the next forward-facing seat. But all seems well! Thanks, Lenovo ThinkPad)

Tue 24 Sep 2024 06:53:43 PM PDT

/make: GET URL approach working for doll set and C/F units.

Pixie image cache key includes units=C or units=F when different from default units.
Navigation link building naively supports units by including the entire query string.

Goodness, now I need a station picker wizard, but how? Map? Text prefix?
I guess I already have the latitude and longitude sorted active server lists, so
that could be something to start from.

Thu 26 Sep 2024 08:35:52 AM PDT

/make: Pushed the latest chooser on Wednesday. It behaves reasonably on being passed no arguments.

Time to adjust the "done" list, if needed.

Now for something of a different cardinality. We probably want to base the pick list on the overlap
of active stations having geodata entries.

Wed 02 Oct 2024o

Successful experiment downloading gzipped metars.cache.csv and importing into an sqlite3 DB.

In brief:
* Download and unzip.
* Edit csv file to rename duplicated sky cover columns with 2, 3, 4.
* sqlite3 metars.db
* .mode csv
* .import metars.cache.csv snapshot
* .schema snapshot
* start querying, SELECT etc.


Thu 03 Oct 2024 08:50:44 AM PDT

Picker needs a fix for "set 0". I made a mistake probably on the JS falsy value.
Did a messy fix.


Tue 08 Oct 2024 08:47:16 PM PDT

Trying out a base map. I want to see if I can use this with the span of
stations in the "nearby" page (/stations) and clip to that size.  
It will be pretty weird for the neighborhood around NZSP.

Wed 09 Oct 2024 08:54:09 AM PDT

Of course for /stations I could just start with an SVG and lat/long lines and
dot the stations in by code and lat/long.

Looking at the console:
  didn't find haze in namedLayers
  no weather layer defined for haze
maybe haze can be a yellowish vertically flipped version of mist/fog?


Thu 05 Dec 2024 09:44:19 AM PST

Wow, PixieReport has been pretty stable. Look at the uptime!

I've renewed the domain cert a couple of times with Certbot.

I find myself capturing the "Nearby" array as a single screencap, so maybe
I should go ahead and create a composed version and see how that looks. This
will change the dynamics, where the current one is a patchwork of individual
image loads in the browser.

I find myself capturing the alt text for an individual pixie image. Having a
click to copy to clipboard would be handy.

Image features:
* Composed nearby image, maybe a specific URL
* Extending this rendering style to an image quilt from a list of stations.

Mon 09 Dec 2024 06:17:21 PM PST

Clipboard
* Click to copy alt text to clipboard. 
    * So far this has been pretty awkward to test using clipboard.readText() etc.
    * It requires permission in a local file context.
    * readText() and writeText() are Promise based. I've tried using setTimeout() but the combo of asking in the
      browser client context for permission to touch the clipboard and some possible background call which setTimeout(resolve, 0)
      have left me scratching my head about.

https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

Wed 18 Dec 2024 09:14:24 AM PST

OK it's been a little slow on the mark for clipboard work and the PixieReport
runtime is clicking up into the high triple digits of hours. But I copied a
little script from the VPN setup at work and hopefully that can be a working
example of writing to the clipboard from the page. Reading from the clipboard
is more a vector for an exfiltration attack, depending on what's in the cb,
notably account numbers and passwords.

Initial copy-alt-text-to-clipboard in /compose = devpixie page.

Thu 19 Dec 2024 09:27:01 AM PST

Initial copy-alt-text-to-clipboard on regular pixie page.
No visual signal of the copy affordance like a tool tip or onHover yet.
Other things that want tweaking:
* /stations map, all stations aren't in the box. (where are they? off the top? can we fix?)
* can we make the SVG nodes for stations clickable?

ARGH we are having the problem of embedding an onClick that has single / double / single quotes nested.
I couldn't make the regexp do the job I was hoping of escaping quotes with backslashes or apostrophers.

Punt for now.

Mon 23 Dec 2024 08:54:02 AM PST

Picking up, looks like I need a get-by-id, get-inner-text. Done.

Noticing that random-pixie does not honor the pixie set. That seems broken.
Except that the /random endpoint accepts ?set=2 and works!

Tue 31 Dec 2024 09:10:08 AM PST
Adding night fireworks background a beat late.

Mon 06 Jan 2025 09:52:50 AM PST

Need a test for decoded-metar-parser.js#hoursSince including
a possible refactor to pass dtNow rather than using Date.now().

This may require some reconstruction around month and year
boundaries to recognize and avoid naive negative "hoursSince",
since METAR compresses dates by reporting only the day of
month in the short METAR report, and depending on context.

Thu 23 Jan 2025 08:59:29 AM PST

Reviewing from the commute bus to Bellevue.

2-mo certbot renewal for site performed last week (as I recall)

Might be time to review the "done.md" doc and/or move old notes
here to archive.

Watching the local console suggested two improvements to weather not found
reporting.
- [X] Add the station name to the console error
- [X] Add the weather-not-found name to the JSON seen in /devpixie

Take The Small Win! Accomplished during commute.

Tue 02 Jan 2025 05:30:00 PM PST

Added a stretch-to-fit width experiment for the /stations handler
image using display: flex and similar flexbox and object-fit attributes.

I think it's a success for mobile screens but a little alarming for
wide aspects.

Mon 24 Mar 2025 09:26:41 AM PDT

Tweaked max-width for flexbox /stations holder div.

Tue 06 May 2025 08:51:14 AM PDT

Launched Curi Lagann's Hedgehog On A Stroll as pixie set=4
but set=4 doesn't seem to parse correctly and select the set.
Aha, here's the problem:
  redirectToSetLocation overwrites the set rather than preserving it.

Sun 18 May 2025 08:12:52 AM PDT

Deployed logic to preserve ?set= query param so that /make works without a
location set.

Curi Lagann's second set, Witch On A Broom, has been delivered.
I added PNG metadata for the Author field, "Curi Lagann, curilagann.art"

Change in composition to move wind flags behind the pixie image in the layer
stack, so that the witch sprite is in front of the high wind flagpole.

Flexbox continues to be alarming for wide aspects.

Deployed Witch On A Broom to PixieReport.com

Two small changes might be useful:
1. The preview image in the /make picker should probably include the random location, and be consistent with /random.
2. The "stations nearby" should honor the pixie set for (at least?) the first image in the array.


Wed 28 May 2025 06:07:57 PM PDT

Let's see if we can do the things as above.
- [X]  /make preview image now clicks through to a pixie page with navigation like /random.
- [X]  "stations nearby" /stations makes dollset sticky for first link, round-trips.


Wed 04 Jun 2025 09:13:36 AM PDT

Third set from Curi Lagann on the way.

I'm wondering if editing in VSCode might be useful for operating more fluidly /
fluently with refactoring Javascript, esp. server.js.

Ideas about the picker. The /stations logic already has a doubly indexed
lat/long list. Do we filter it for our active list? We could try just a picker.
What might that look like? We already have a world map which could give us a
starting lat/long as an image map.

Maybe even have the world map as a picker on the nearby stations page.
especially if there's no specific station chosen.

Sun 08 Jun 2025 08:44:47 AM PDT
KU52 https://beaverutah.net/community/beaver-city-airport/

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
    - [X] Preview of choices
    - [X] Doll set picker
        - [X] Which doll sets are available?
    - [X] C/F unit picker
    - [ ] Geographic picker
    - [ ] Widget to: Copy this URL / cookie-me this pixie / copy this embed / bookmark this URL
- [X] Site Navigation
- [ ] Pixie Renderer
    - [X] METAR code, doll series yield a scene
    - [X] No-data mode: TV static if not available
    - [ ] No-current-data mode: page shows hours since report, but image not sensitive to freshness.
- [X] Rendered Pixies served as images
    - [X] /png endpoint
- [ ] HTTP Cookie to remember your chosen location, doll style, units.

Prelaunch
- [X] Caddy or Nginx reverse proxy. (Nginx)
- [X] Certbot or similar. Certbot, but a one-off 2024-08-11, repeated manually. Because fedwiki occupies :80, I have to manually fetch new certs or script the down / up hooks.

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
- [ ] /make - pick doll set, units, station; copy to system clipboard.
    - [X] Units picker (C/F/use station locale)
    - [X] Doll set picker (display, choose)
    - [X] Preview results
    - [ ] Copy URL(s) to clipboard
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

- [ ] Consider TheDryPrinciple for code blobs and resources.
- [X] Remove unused files and functions from other versions.
- [ ] Remove neglected endpoint handlers which have served their purpose
- [X] Remove console.log for routine operations.
- [X] Update the prospectus document.
- [ ] Add an about/credits/source/acknowledgements page to the source.
- [ ] Consider assertions as a prelude to tests.
- [ ] Is there a jslint to run for suggested cleanup?
- [ ] Express.js model app format to review?
- [ ] Replace let or global with const as possible.
- [ ] Name output template strings rather than leaving nameless inline.


---

Next Logical Steps (next *notional* steps for evolutionary architecture?)
- [X] Verify the layerfile composition, maybe /layers (or echo it alongside /compose output)
- [X] Factor out layer map into a layer locator passed from the server main program
- [ ] Enhance layer locator to allow indirection / context by pixie set or other style choices.

Full PixieReport function (minus the weather report location choosing wizard) needs
- [X] Get a font matching the original WeatherPixie loaded into Jimp
- [X] Write the weather report text on the image
- [X] alt-text in the HTML page presentation using pre-existing logic
- [X] Choose a pixel doll set with UI/URL parameter
- [X] PNG output endpoint or PNG-data-img is fine. Or select just-image as ".png" or ".jpg" like http.cat ?
- [X] Graceful error handling for missing report data or fetch failure (TV static image) call it done.
- [ ] Group pixie-set-specific weather layers separately from generic weather?
- [ ] Error handling for internal error cases beyond catch(console.error)? Or let-it-crash.
- [ ] Cacheable URL scheme (path params vs. query params?) responses, cache headers.

Weather Report Choosing Wizard
- [X] prototyped in fedwiki with web-linked markers on Leaflet map widget
- [X] units and dollset chooser active as GET options in '/make'
- [ ] Weather station chooser. How do we navigate / wizard our way to a choice?


## Operations Status, Robustness, and Recovery
From the above item:
- [X] Start an ops status / robustness / recovery list.

### Service start / restart
 - [X] start-up script? Replace "nohup node server.js", ^Z, "bg"  (pm2 below)
 - [X] daemonization, better automatic restartability. Using PM2 [pm2.io](https://pm2.io).

### Service usage and load
 - [ ] observe load and latency (Express or Node runtime obs? PM2 builtins?)
 - [X] experiment with cache. Implemented cache.
 - [X] "callers" and "robots" list of very recently callers by IP address.
     *  Note that Hurricane Electric has a lookup page. (bookmarked in browser)

### Pixie Rendering Flaw Reporting and Handling
Add more information in an ops page or subtly in pixie page, maybe frame-in some specific logs.
 - [X] What about weather conditions with no mapped image layer ("light rain showers"): loggable in devpixie json?
 - [ ] What about rarely reporting stations? Should we refresh the active snapshot more often?
 - [ ] What about stations with an unchanging old report? (time/date detection)
 - [ ] What about stations with no geodata? Is this something loggable in the uptime/debug page?

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

