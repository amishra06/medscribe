// backend/src/services/raindrop.js
const axios = require('axios');
const Groq = require('groq-sdk');

const RAINDROP_MCP_URL = 'https://raindrop-mcp.01kbqgrt5rh5jbcngt05bt9pyy.lmapp.run/mcp';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class RaindropService {
  constructor() {
    this.mcpUrl = RAINDROP_MCP_URL;
    this.useRaindrop = true;
    this.raindropAvailable = null;
  }

  async generateSOAPNote(transcript) {
    if (this.useRaindrop) {
      try {
        console.log('⚡ Attempting Raindrop SmartInference...');
        const result = await this.generateWithRaindrop(transcript);
        this.raindropAvailable = true;
        return result;
      } catch (error) {
        console.warn('⚠️  Raindrop failed:', error.message);
        console.log('🔄 Falling back to Groq...');
        this.raindropAvailable = false;
      }
    }
    return await this.generateWithGroq(transcript);
  }

  async generateWithRaindrop(transcript) {
    const prompt = `You are an expert medical scribe assistant. Generate clear, professional SOAP notes from clinical encounter transcripts.

TRANSCRIPT:
${transcript}

Generate a properly formatted SOAP note with these sections:
- SUBJECTIVE (S): Patient's complaints, symptoms, history
- OBJECTIVE (O): Vital signs, physical exam, test results
- ASSESSMENT (A): Diagnosis or clinical impression (include "Diagnosis:" keyword)
- PLAN (P): Treatment plan, medications, follow-up

Use professional medical documentation format.`;

    const response = await axios.post(this.mcpUrl, {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'smart_inference',
        arguments: {
          prompt: prompt,
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.3
        }
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const result = response.data.result;
    let soapNote = '';
    
    if (result.content && Array.isArray(result.content)) {
      soapNote = result.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
    } else if (typeof result === 'string') {
      soapNote = result;
    }

    if (!soapNote || soapNote.trim().length === 0) {
      throw new Error('Empty response from Raindrop');
    }

    console.log('✅ Generated with Raindrop SmartInference');
    return {
      success: true,
      soapNote: soapNote,
      model: 'claude-sonnet-4-20250514',
      provider: 'raindrop-mcp',
      fallback: false
    };
  }

  async generateWithGroq(transcript) {
    console.log('⚡ Generating with Groq...');
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert medical scribe assistant. Generate clear, professional SOAP notes from clinical encounter transcripts.'
        },
        {
          role: 'user',
          content: `Convert the following clinical encounter transcript into a structured SOAP note.

TRANSCRIPT:
${transcript}

Generate a properly formatted SOAP note with these sections:
- SUBJECTIVE (S): Patient's complaints, symptoms, history of present illness
- OBJECTIVE (O): Vital signs, physical examination findings, test results
- ASSESSMENT (A): Diagnosis or clinical impression
- PLAN (P): Treatment plan, medications, follow-up instructions

Use professional medical documentation format.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const soapNote = completion.choices[0].message.content;
    console.log('✅ Generated with Groq');

    return {
      success: true,
      soapNote: soapNote,
      model: completion.model,
      usage: completion.usage,
      provider: 'groq',
      fallback: true
    };
  }

  async saveNote(noteData) {
    console.log('💾 Note saved (mock storage)');
    return {
      success: true,
      noteId: `note_${Date.now()}`,
      storage: 'local-mock',
    };
  }

  async testConnection() {
    try {
      const response = await axios.post(this.mcpUrl, {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {}
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      console.log('✅ Raindrop MCP connected');
      this.raindropAvailable = true;
      return true;
    } catch (error) {
      console.error('❌ Raindrop MCP failed:', error.message);
      this.raindropAvailable = false;
      return false;
    }
  }

  getStatus() {
    return {
      raindrop: {
        enabled: this.useRaindrop,
        available: this.raindropAvailable,
        url: this.mcpUrl
      },
      groq: {
        enabled: !!process.env.GROQ_API_KEY,
        available: true
      }
    };
  }
}

module.exports = new RaindropService();
