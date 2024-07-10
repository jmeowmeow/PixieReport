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


**Cache Thoughts**

Extracted to [./cache.md](./cache.md)

## Next Step Directions

### Webapp Functions
- [X] HTTP refresh header slideshow of random pixie /random
- [X] /random - should also link individual slides and jump out of show
- [X] Explore ICAO METAR stations (random, like Twitter PixieReport).
- [X] Instead of defaulting KSEA, random pixie via hit and redirect
- [ ] Nearest other stations, based on geo-sort?
- [ ] Station list view/search

### Webapp architecture
- [X] page template structure with navigation
- [X] favicon templated into every page _mostly_ (only in HTML pages, not PNG or text/plain)
- [X] Basic uptime endpoint.
- [ ] Useful uptime page with stats (pixies served, uptime, error count?) or in template footer
- [ ] Rethink URL path handlers, remove unneeded ones.
- [ ] Replace string with URL object with template/builder behavior for links/redirects.
- [X] Start an ops status / robustness / recovery list.

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
- [ ] Cacheable URL scheme (path params vs. query params?) responses, cache headers.

Weather Report Choosing Wizard
- [X] prototyped in fedwiki with web-linked markers on Leaflet map widget


## Operations Status, Robustness, and Recovery
From the above item:
- [X] Start an ops status / robustness / recovery list.

### Service start / restart
 - [ ] start-up script
 - [ ] daemonization, better automatic restartability. Consider PM2

### Service load
 - [ ] observe load and latency
 - [ ] experiment with cache

### Pixie Rendering Flaw Reporting and Handling
 - [ ] What about rarely reporting stations? Should we refresh the active snapshot more often?
 - [ ] What about stations with an unchanging old report?
 - [ ] What about stations with no geodata? Is this something loggable in the uptime/debug page?
 - [ ] What about weather conditions with no mapped image layer ("light rain showers"): loggable other than console?

### Full METAR parse from raw METAR report.
 - [ ] Add a fromRawMetar section to debug output.
 - [ ] Reproduce the 'Decoded METAR" parsing logic for...
     - [ ] temperature
     - [ ] humidity (argh)
     - [ ] wind
     - [ ] sky cover
     - [ ] weather conds

