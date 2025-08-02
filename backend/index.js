require('dotenv').config();

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const recommendRoute = require('./routes/recommend')
const userRoute = require('./routes/user')

const app = express()

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_ORIGIN, // 'https://card-optimizer.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.options('*', cors());
app.use(bodyParser.json());

// Routes
app.use('/api/recommend-card', recommendRoute);
app.use('/api/user-cards', userRoute);

// Root ping
app.get('/', (req, res) => {
    console.log('Received GET /');
    res.send('Backend running');
});

// Start server
module.exports = app;
// // local tested
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });