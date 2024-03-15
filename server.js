const express = require('express');
const app = express();
const port = 3000;
const {compose, Jimp} = require('./compose-async');

app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/compose', async (req, res) => {
  var pixie = await compose().catch(console.error);
  // 8 or 16
  await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then((font) => {
    pixie.print(font, 10, 10, "Hello world!");
  });
  pixie.getBase64(Jimp.MIME_PNG, (err, src) => { res.send(`<img src="${src}" />`) });
});

// parameters: airport code, C/F, which pixie set; optional!
app.get('/pixie', (req, res) => {
  // if either location or temp is not provided, redirect to /pixie?location=KSEA&temp=F
  const location = req.query.location; // ?location=KSEA (a METAR station)
  const tempUnit = req.query.temp; // ?temp=F
  if (location === undefined || tempUnit === undefined) {
    res.redirect('/pixie?location=KSEA&temp=F');
    return;
  }
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Hello from ${location}
The temperature is 30 ${tempUnit}`)
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});