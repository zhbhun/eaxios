const path = require('path');
const express = require('express');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.static(path.resolve(__dirname, '../dist')));

app.get('/apis/timeout', (req, res) => {
  setTimeout(() => {
    res.json({ message: 'Hello World!' });
  }, 600000);
});

app.get('/apis/error', (req, res) => {
  setTimeout(() => {
    res.status(500);
    res.send(500);
  }, 0);
});

app.get('/apis/format', (req, res) => {
  setTimeout(() => {
    res.send('Hello World!');
  }, 0);
});

app.get('/apis/failure', (req, res) => {
  setTimeout(() => {
    res.status(404);
    res.send('Not Found');
  }, 0);
});

app.get('/apis/success', (req, res) => {
  setTimeout(() => {
    res.json({ message: 'Hello World!' });
  }, 0);
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`),
);
