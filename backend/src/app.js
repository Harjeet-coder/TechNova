const express = require('express');
const cors = require('cors');

const whistleblowerRoutes = require('./routes/whistleblower.routes');
const investigatorRoutes = require('./routes/investigator.routes');
const adminRoutes = require('./routes/admin.routes');
const authorityRoutes = require('./routes/authority.routes');
const revealRoutes = require('./routes/reveal.routes');
const authRoutes = require('./routes/auth.routes');
const communicationRoutes = require('./routes/communication.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/evidence', whistleblowerRoutes);
app.use('/api/case', whistleblowerRoutes);
app.use('/api/zk', whistleblowerRoutes);

app.use('/api/investigator', investigatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/authority', authorityRoutes);
app.use('/api/reveal', revealRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/communication', communicationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = app;