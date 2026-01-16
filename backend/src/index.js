const express = require('express');
const db = require('./config/database');
require('dotenv').config();
const helmet = require('helmet');

const reservationsRouter = require('./api/routes/reservations');
const paymentsRouter = require('./api/routes/payments');
const guestsRouter = require('./api/routes/guests');
const housekeepingRouter = require('./api/routes/housekeeping');
const maintenanceRouter = require('./api/routes/maintenance');
const staffRouter = require('./api/routes/staff');
const schedulesRouter = require('./api/routes/schedules');
const reportsRouter = require('./api/routes/reports');
const adminRouter = require('./api/routes/admin');
const usersRouter = require('./api/routes/users');
const channexRouter = require('./api/routes/channex');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Security Headers
app.use(helmet({
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://trusted.cdn.com"],
      objectSrc: ["'none'"],
    },
  },
  xFrameOptions: { action: "sameorigin" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "no-referrer-when-downgrade" },
}));

app.use('/api/reservations', reservationsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/housekeeping', housekeepingRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/staff', staffRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);
app.use('/api/channex', channexRouter);

app.get('/', (req, res) => {
  res.send('Welcome to the StaySyncGold API!');
});

// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({
      message: 'Database connection successful!',
      time: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Database connection failed!',
      error: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
