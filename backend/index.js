const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const recommendRoute = require('./routes/recommend')
const userRoute = require('./routes/user')

const app = express()
const PORT = 4000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

// Routes
app.use('/api/recommend-card', recommendRoute);
app.use('/api/user-cards', userRoute);

// Root ping
app.get('/', (req, res) => {
    res.send('Backend running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});