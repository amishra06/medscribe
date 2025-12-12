import React, { useState } from 'react';
import AudioUploader from './components/AudioUploader';
import VoiceRecorder from './components/VoiceRecorder';
import SOAPNoteEditor from './components/SOAPNoteEditor';
import ComplianceChecker from './components/ComplianceChecker';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('record');
  const [currentCompliance, setCurrentCompliance] = useState(null);

  const handleDataReceived = (data) => {
    setResult(data);
    setCurrentCompliance(data.compliance);
  };

  const handleNoteSaved = (saveData) => {
    console.log('Note saved:', saveData);
  };

  const handleComplianceUpdate = (newCompliance) => {
    setCurrentCompliance(newCompliance);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏥 MedScribe</h1>
        <p className="subtitle">Ambient Clinical Scribe & Compliance Assistant</p>
      </header>

      <main className="App-main">
        <div className="input-tabs">
          <button
            className={`tab-button ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => setActiveTab('record')}
          >
            🎙️ Record Live
          </button>
          <button
            className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📁 Upload File
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'record' ? (
            <VoiceRecorder onRecordingComplete={handleDataReceived} />
          ) : (
            <AudioUploader onTranscriptReceived={handleDataReceived} />
          )}
        </div>

        {result && (
          <div className="results-container">
            <div className="result-card">
              <h2>📝 Transcript</h2>
              <div className="transcript-content">
                {result.transcript}
              </div>
              <div className="metadata">
                <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                <span>Duration: {result.duration?.toFixed(1)}s</span>
              </div>
            </div>

            <SOAPNoteEditor 
              initialNote={result.soapNote}
              transcript={result.transcript}
              compliance={result.compliance}
              onSave={handleNoteSaved}
              onComplianceUpdate={handleComplianceUpdate}
            />

            {currentCompliance && (
              <ComplianceChecker compliance={currentCompliance} />
            )}
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Built for The AI Champion Ship 🏆</p>
      </footer>
    </div>
  );
}

export default App;
