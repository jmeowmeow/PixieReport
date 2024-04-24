## tasks.md

Progress on expressJS server branch

Thu 14 Mar 2024 11:22:41 AM PDT

jimp composition model selfie and starry night layers

![./jimp-composed.png](./jimp-composed.png)

Pomodoro intention: engage with task flow.

Tasks

- [X] Mask the broken Jasmine test for composer (node-canvas removed).
- [X] Verify jimp Jasmine test works.
- [X] Verify jimp compose.js mini script works. `node compose.js` and compare pixie.png with above.
- [X] Verify jimp express demo works. Use `npm run dev` and see [localhost:3000/pixie/](http://localhost:3000/pixie/)
- [X] Decide on next step (decided: serve PNG pixie, use async/await for Jimp)

Pomodoros
11:24:32 AM PDT
+ Mask the broken composer test, verify other functions work.
+ Set up for pairing, try "serve PNG pixie" as interim task. Success (html/base64 png img).

Fri 15 Mar 2024 03:21:30 PM PDT
Notes for tasks.

Note: "fetch" in the in-browser-composer uses this form of refreshing the weather report:
```
curl -s https://tgftp.nws.noaa.gov/data/observations/metar/decoded/${SITE}.TXT > ${SITE}.TXT
```

Sample load-font-then-print from jimp docs:
```
Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then((font) => {
  image.print(font, 10, 10, "Hello world!");
});
```

Tasks

- [X] Write image text using Jimp. "imagetext" [jimp image.print](https://github.com/jimp-dev/jimp/tree/main/packages/jimp#writing-text)
- [X] Use the "fetch" template URL and node http client to get a METAR weather report. "proxy" [MDN fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

Pomodoros:
* [X] Get doc links, record in tasks above, and open in tabs.
* [X] Jimp imagetext

![./jimp-selfie-text.png](./jimp-selfie-text.png)

Mon 25 Mar 2024 11:16:27 AM PDT

Tasks

- [X] Parse fetched weather report to pixie param JSON.

We now have a launcher page at '/', and '/metar?location=', '/json?location=' endpoints.

Thu 28 Mar 2024 09:04:10 AM PDT

Paired work @jmeowmeow / @binhrobles

- [X] Pass parsed params to "compose" logic, decide some layers, write some text.
- [X] Unpack metadata (parsed weather params and sun angle) alongside PNG output.
- [X] Use JIMP to compose the chosen layers and write param-specific text.

* We now have `/compose?location=` with default `?location=KSEA`
* `/compose` uses live weather report information for location text and to choose day/night background.

![./hello-EGHC-day.png](./hello-EGHC-day.png)
![./hello-LIMC-night.png](./hello-LIMC-night.png)

Sat 30 Mar 2024 10:00:00 AM PDT

- [X] Add temperature-to-pixel-doll layer choice logic.
- [X] Add cloud layer logic.
- [X] Add wind flag layer logic.

![./hello-KJFK-windy-day.png](./hello-KJFK-windy-day.png)
![./hello-NZSP-cold-twilight.png](./hello-NZSP-cold-twilight.png)

Next Steps
- [X] Turn composition back into a stack of optionally composed layers.

Mon 01 Apr 2024 08:33:11 AM PDT
Pomodoro intention: factor the composition into a list of variable length
but predictable order. Maybe reintroduce the Layer class at some point.
P1, P2 : progress. We're loading and composing an arbitrary list of layers, but not yet selecting a variable number.
There are empty transparent layers which could be slipped..
P3 : rabbit-hole on top index page table presentation (useful, but not specific to intention).
P4 : factoring complete, but kept working past timer.
Next intention: add weather layer logic.

- [X] Add weather layer logic.

![./hello-KOAK-windy-rainy-day.png](./hello-KOAK-rainy-windy-day.png)

Thu 04 Apr 2024 08:47:09 AM PDT

Working with Isaac.

- [X] Restore lightning layer logic. (behind rain)

Wed 10 Apr 2024 05:52:22 PM PDT

- [X] Restore top-layer black frame under text (fixes messy fog etc).
- [X] On network error, return a no-info default report.


Fri 12 Apr 2024 10:06:36 AM PDT

Starting off net, so font tools to convert standard to bitmap are offline;
  you could hack around with a BMP font to change its color.
Accessible during bus commute: canned reports, alt text creation, pixel
  doll set choice.

Tue 16 Apr 2024 08:16:07 AM PDT

On Monday (bus and after): restored Layer class; draft alt-text composition.

Tuesday Intentions:
- [X] inspect console.log() statements; make to-dos? scrub? (Scrub.)
- [ ]  return alt-text to web output (not yet)
- [X] compose weather text, see pixie-composer/writeTextOnPixie

Tuesday intentions mostly complete.

Incidental fix re KLAN.TXT report:
- [X] Thundershowers ("light rain with thunder", "rain with thunder") now render as rain.

Wed 17 Apr 2024 08:14:07 AM PDT
Wednesday Intentions:
- [X] add alt-text to web output as alt=""
- [ ] description text varies by pixie set and/or background style (fireworks?)

Wednesday also did:
- [X] prototype vertical location text on pixie (rotate -90 deg, print, rotate +90 deg).

![./hello-KSEA-alt-text.png](./hello-KSEA-alt-text.png)

Thursday did:
* Improve image text computation, extract to a pure-function file.
* Added fallback to a saved local METAR for better offline (bus) work.

Fri 19 Apr 2024 09:36:17 AM PDT
* Fixed fallback by using a sync read and catch block.
* Checked in Thursday work.

Friday intentions: Typeface/font or pixie choice
- [X] Attempt using The Gimp to transform white typeface to green.
- [ ] Online? try transforming a monospace font to white and to green
- [ ] Choose a pixie set in the API. This may drive a preload of layers.

![green-open-sans-8.png](./green-open-sans-8.png)

Result: It looks like I might want a genuinely bitmapped font; Open Sans doesn't
do a great job at 8-point (or whatever the size unit is).

Tuesday: Or I could try a brighter but less saturated green, 7f7 instead of 0f0.

Mon 22 Apr 2024 08:21:23 AM PDT

Jimp fonts are BMFont format, see AngelCode's conversion tool. I don't
really need all the font metrics and kerning info if I'm going to use
fixed width bitmap fonts - maybe not even anti-aliasing - but I need
the font descriptor file and the image. I mean, I suppose I could sprite
a font and turn it into images and stick the character and rendered
string images into resources and do everything with image compositing.
HTML-5 Canvas and save-as-PNG are right there, and the list of characters
is present in the Jimp font XML file. They look like Unicode code points
for most of the printable characters 32-255 plus Euro Sign. It's tempting!
32-126 (US-ASCII printables), 161-255, 8364 (Euro). Checking 129-160,
129 is Euro (though maybe 129 is a problematic codepoint?), Glyphs for
codepoints 130-160 appear OK to dispense with.

Tue 23 Apr 2024 08:14:02 AM PDT

Tuesday intentions: preloads.js for resources. I suppose we could
import Jimp there because otherwise it's not clear how we get from
a loaded file to a Jimp image.

The "resources" container returned from preload includes a layer
map including pixie doll layers by type. Maybe we preload the ICAO
METAR stations as well, which sets us up for random weather station
picking and for map based lookup.

- [X] Preload and return icao.js stations as part of preloads.js
- [X] Show icao station info on pixie rendering or json page
- [ ] Preload and return weather layer map as part of preloads.js
- [ ] Preload and return one pixie set's layers.
- [ ] Preload and return all pixie sets' layers (by number and name?)

Incidentally:
- [X] Render weather text info onto bottom weather bar. Needs a good font still.

![KLAN-all-but-the-font.png](./KLAN-all-but-the-font.png)

### Next step detail breakdown
- TO ACCOMPLISH: Restoring text-on-image (station text; report text)
- [X] Open the JIMP docs for [printing text](https://github.com/jimp-dev/jimp/tree/main/packages/jimp#writing-text) to the image using bitmap fonts.
- [X] Assemble an object with the weather and station text.
- [X] Write that object to the ~~pixie compose~~ *JSON report* page text (JSON.stringify)
- [ ] Find a suitable console typeface/font for JIMP. Import it.
- [ ] Create a white fixed font resource with the necessary glyphs.
- [ ] Create a green fixed font resource with the necessary glyphs.
- [X] Investigate rotating text 90 degrees left for station name
- [ ] Write white and green weather text from the assembled text object.
- [ ] Refer to the pre-existing station name process (green fg, pink bg).
- [ ] Write the vertical text for the station name.
- [ ] THEREBY: Restoring text-on-image (station text; report text)

### Alt text creation breakdown
- TO ACCOMPLISH: Creating alt-text describing an image.
- [X] Introduce Layer class following the pattern for Layer, mainLayerDefs in pixie-composer.js .
- [X] Add an alt-text composer based on computeSceneText (layer.desc), computeAltText.
- [X] Put the alt text in the alt= attribute of the composed image.
- [X] THEREBY: Restoring alt-text generation.

### Jimp Layer and Pixie Preload breakdown
- [ ] Create resources.js to preload image/desc layers and fonts, like pixie-composer.js .
- [ ] Refer to resources in composer, removing layer metadata, text, and image loads.
- [ ] THEREBY: preloading local resources to simplify composition stage

## Next Step Directions
- [ ] Restore pixel doll sets (random; chosen by URL) see above Pixie Preload with text
- [ ] Explore ICAO METAR stations (random, like Twitter PixieReport).
- [ ] METAR stations as a queryable database; how to query? what lists?
- [ ] Pick METAR stations from a map, like FedWiki map marker plugin.

---

Next Logical Steps (next *notional* steps for evolutionary architecture?)
- [ ] Factor out layer map into a layer locator passed from the server main program and/or export it to a resource helper.
- [ ] Verify the layerfile composition, maybe /layers (or echo it alongside /compose output)

Full PixieReport function (minus the weather report location choosing wizard) needs
- [ ] Get a font matching the original WeatherPixie loaded into Jimp
- [ ] Write the weather report text on the image
- [ ] Choose a pixel doll set with UI/URL parameter
- [ ] Organize pixie-set-specific layers separately from generic weather layers?  .
- [ ] PNG output endpoint or PNG-data-img is fine. Or select just-image as ".png" or ".jpg" like http.cat ?
- [ ] Graceful error handling for missing report data or fetch failure
- [X] alt-text in the HTML page presentation using pre-existing logic

Weather Report Choosing Wizard
- [X] prototyped in fedwiki with web-linked markers on Leaflet map widget

