function createSOAPPrompt(transcript) {
  return `You are a medical scribe assistant. Convert the following clinical encounter transcript into a structured SOAP note.

TRANSCRIPT:
${transcript}

Generate a properly formatted SOAP note with these sections:
1. SUBJECTIVE (S): Patient's complaints, symptoms, history
2. OBJECTIVE (O): Vital signs, physical examination findings, test results
3. ASSESSMENT (A): Diagnosis or clinical impression
4. PLAN (P): Treatment plan, medications, follow-up instructions

Format the output as clean, professional medical documentation. Be concise and use standard medical terminology.

SOAP NOTE:`;
}

module.exports = { createSOAPPrompt };
