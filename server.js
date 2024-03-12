const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello');
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