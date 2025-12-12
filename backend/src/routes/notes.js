// backend/src/routes/notes.js
const express = require('express');
const raindropService = require('../services/raindrop');
const { checkCompliance } = require('../services/compliance');

const router = express.Router();

// POST /api/notes/generate
router.post('/generate', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required',
      });
    }

    console.log('📝 Received transcript, length:', transcript.length);

    // Generate SOAP note (with automatic fallback)
    const result = await raindropService.generateSOAPNote(transcript);
    
    if (result.success) {
      // Run compliance checks
      const compliance = checkCompliance(result.soapNote, transcript);

      // Add provider info to response
      const response = {
        success: true,
        soapNote: result.soapNote,
        model: result.model,
        provider: result.provider,
        compliance: compliance,
      };

      // Add fallback warning if applicable
      if (result.fallback) {
        response.warning = 'Generated using fallback provider (Groq)';
        console.log('⚠️  Response generated with fallback provider');
      } else {
        console.log('✅ Response generated with primary provider (Raindrop)');
      }

      res.json(response);
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Generate note error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/notes/check-compliance
router.post('/check-compliance', async (req, res) => {
  try {
    const { soapNote, transcript } = req.body;
    
    if (!soapNote || soapNote.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'SOAP note is required',
      });
    }

    console.log('🔍 Re-checking compliance for edited note...');

    // Run compliance checks
    const compliance = checkCompliance(soapNote, transcript || '');

    res.json({
      success: true,
      compliance: compliance,
    });
  } catch (error) {
    console.error('❌ Compliance check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/notes/save
router.post('/save', async (req, res) => {
  try {
    const { soapNote, transcript, patientInfo, compliance } = req.body;
    
    if (!soapNote) {
      return res.status(400).json({
        success: false,
        error: 'SOAP note is required',
      });
    }

    // Save note (with automatic fallback)
    const result = await raindropService.saveNote({
      soapNote,
      transcript,
      patientInfo,
      compliance
    });

    // Add fallback info to response
    if (result.fallback) {
      result.warning = 'Saved using fallback storage (local mock)';
      console.log('⚠️  Note saved with fallback storage');
    } else {
      console.log('✅ Note saved to SmartBuckets');
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Save note error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/notes/raindrop-status - Test connection and show fallback status
router.get('/raindrop-status', async (req, res) => {
  try {
    console.log('🔍 Testing Raindrop MCP connection...');
    
    const isConnected = await raindropService.testConnection();
    const status = raindropService.getStatus();

    res.json({
      success: true,
      raindrop: {
        status: isConnected ? 'connected' : 'disconnected',
        message: isConnected 
          ? 'Raindrop MCP is operational' 
          : 'Raindrop MCP unavailable - using Groq fallback',
        ...status.raindrop
      },
      fallback: {
        provider: 'groq',
        status: status.groq.enabled ? 'available' : 'not configured',
        ...status.groq
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

// GET /api/notes/health - Quick health check
router.get('/health', (req, res) => {
  const status = raindropService.getStatus();
  
  res.json({
    status: 'ok',
    services: {
      raindrop: status.raindrop.available !== false ? 'operational' : 'degraded',
      groq: status.groq.enabled ? 'operational' : 'not configured'
    },
    mode: status.raindrop.available !== false ? 'primary' : 'fallback'
  });
});

module.exports = router;
