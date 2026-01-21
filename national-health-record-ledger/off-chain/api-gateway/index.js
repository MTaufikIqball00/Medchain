const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Routes
const patientRoutes = require('./src/controllers/patientController');
const recordRoutes = require('./src/controllers/recordController');
const accessRoutes = require('./src/controllers/accessController');

app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/access', accessRoutes);

app.get('/', (req, res) => {
    res.send('National Health Record Ledger Gateway is Running');
});

app.listen(port, () => {
    console.log(`API Gateway listening at http://localhost:${port}`);
});
