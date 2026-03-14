const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const authRoutes = require('./auth').route;
const apiRoutes = require('./routes');
const path = require('path');

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Server frontend static files
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
