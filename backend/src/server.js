const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const transcribeRoute = require('./routes/transcribe');
const notesRoute = require('./routes/notes');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MedScribe backend is running',
    deepgram: !!process.env.DEEPGRAM_API_KEY ? 'configured' : 'not configured',
    raindrop: !!process.env.LM_API_KEY ? 'configured' : 'not configured',
  });
});

// API routes
app.use('/api/transcribe', transcribeRoute);
app.use('/api/notes', notesRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MedScribe backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎤 Transcription: http://localhost:${PORT}/api/transcribe`);
  console.log(`📝 Generate note: http://localhost:${PORT}/api/notes/generate`);
  console.log(`💾 Save note: http://localhost:${PORT}/api/notes/save`);
  
  // Check environment variables
  if (!process.env.DEEPGRAM_API_KEY) {
    console.warn('⚠️  Warning: DEEPGRAM_API_KEY not set');
  } else {
    console.log('✅ Deepgram configured');
  }
  
  if (!process.env.LM_API_KEY) {
    console.warn('⚠️  Warning: LM_API_KEY (Raindrop) not set');
  } else {
    console.log('✅ Raindrop configured');
  }
});

module.exports = app;
