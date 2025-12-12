const { createClient } = require('@deepgram/sdk');

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

async function transcribeAudio(audioFilePath) {
  try {
    console.log('Starting transcription for:', audioFilePath);
    
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      require('fs').readFileSync(audioFilePath),
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        paragraphs: true,
        utterances: true,
      }
    );

    if (error) {
      throw error;
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;
    console.log('Transcription successful, length:', transcript.length);
    
    return {
      success: true,
      transcript: transcript,
      confidence: result.results.channels[0].alternatives[0].confidence,
      duration: result.metadata.duration,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { transcribeAudio };
