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
- [ ] Add weather layer logic.
- [ ] Turn composition back into a stack of optionally composed layers.


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
- [ ] alt-text in the HTML page presentation using pre-existing logic

