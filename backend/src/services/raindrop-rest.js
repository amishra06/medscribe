const axios = require('axios');

async function generateSOAPWithRaindrop(transcript) {
  try {
    console.log('Calling Raindrop SmartInference API...');
    
    const response = await axios.post('https://api.liquidmetal.ai/v1/smart-inference', {
      prompt: `You are a medical scribe assistant. Convert the following clinical encounter transcript into a structured SOAP note.

TRANSCRIPT:
${transcript}

Generate a properly formatted SOAP note with these sections:
- SUBJECTIVE (S): Patient's complaints, symptoms, history
- OBJECTIVE (O): Vital signs, physical examination findings, test results
- ASSESSMENT (A): Diagnosis or clinical impression  
- PLAN (P): Treatment plan, medications, follow-up instructions

Format as clean, professional medical documentation.`,
      max_tokens: 2000,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.LM_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    return {
      success: true,
      soapNote: response.data.result || response.data.text || response.data.completion,
    };
  } catch (error) {
    console.error('Raindrop API error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { generateSOAPWithRaindrop };
