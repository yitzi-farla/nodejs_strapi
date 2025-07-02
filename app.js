const express = require('express');
const path = require('path');

const indexRouter = require('./routes/index');
const pdfRouter = require('./routes/pdf');
const htmlRouter = require('./routes/html');

const app = express();

// Use Railway-assigned port if present, fallback to 3000 for local
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route handlers
app.use('/', indexRouter);
app.use('/pdf', pdfRouter);
app.use('/html', htmlRouter);

// Catch-all 404 route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
