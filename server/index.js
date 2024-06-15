const express = require('express');
const path = require('path');
const cors = require('cors');

const PORT = 5000;

const app = express();
// app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
