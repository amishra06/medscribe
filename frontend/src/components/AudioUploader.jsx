import API_URL from '../config/api';
import React, { useState } from 'react';
import './AudioUploader.css';

function AudioUploader({ onTranscriptReceived }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
      setError('Please upload a valid audio file (mp3, wav, m4a, ogg)');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', file);

      const transcribeResponse = await fetch(`${API_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcribeData = await transcribeResponse.json();

      if (!transcribeData.success) {
        throw new Error(transcribeData.error || 'Transcription failed');
      }

      // Step 2: Generate SOAP note
      const noteResponse = await fetch(`${API_URL}/api/notes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcribeData.transcript,
        }),
      });

      if (!noteResponse.ok) {
        throw new Error('SOAP note generation failed');
      }

      const noteData = await noteResponse.json();

      if (!noteData.success) {
        throw new Error(noteData.error || 'SOAP note generation failed');
      }

      // Pass data back to parent
      onTranscriptReceived({
        transcript: transcribeData.transcript,
        soapNote: noteData.soapNote,
	compliance: noteData.compliance,
        confidence: transcribeData.confidence,
        duration: transcribeData.duration,
      });

    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audio-uploader">
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="audio-input"
          accept="audio/*"
          onChange={handleChange}
          disabled={loading}
          style={{ display: 'none' }}
        />
        
        {!file ? (
          <label htmlFor="audio-input" className="upload-label">
            <div className="upload-icon">🎤</div>
            <p className="upload-text">
              Drag & drop audio file here<br />
              or click to browse
            </p>
            <p className="upload-hint">
              Supports MP3, WAV, M4A, OGG
            </p>
          </label>
        ) : (
          <div className="file-info">
            <div className="file-icon">🎵</div>
            <div className="file-details">
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {!loading && (
              <button onClick={() => setFile(null)} className="remove-btn">
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {file && !loading && (
        <button onClick={handleUpload} className="upload-button">
          🚀 Process Audio
        </button>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Processing audio... This may take a moment.</p>
        </div>
      )}
    </div>
  );
}

export default AudioUploader;
