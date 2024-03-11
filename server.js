const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello');
});

// parameters: airport code, C/F, which pixie set; optional!
app.get('/pixie', (req, res) => {
  const location = req.query.location; // ?location=KSEA (a METAR station)
  const tempUnit = req.query.temp; // ?temp=30
  res.setHeader('Content-Type', 'text/plain');
  res.send(`Hello from ${location}
The temperature is 30 ${tempUnit}`)
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});