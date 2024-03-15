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

Candidate tasks

- [ ] Write image text using Jimp. "imagetext" [jimp image.print](https://github.com/jimp-dev/jimp/tree/main/packages/jimp#writing-text)
- [ ] Use the "fetch" template URL and node http client to get a METAR weather report. "proxy" [MDN fetch]()

Pomodoros:
* Get doc links, record in tasks above, and open in tabs.
* ? Jimp imagetext

