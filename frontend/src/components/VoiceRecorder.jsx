import API_URL from '../config/api';
import React, { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import './VoiceRecorder.css';

function VoiceRecorder({ onRecordingComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ 
    audio: true,
    askPermissionOnMount: false,
  });

  const handleStartRecording = async () => {
    setError(null);
    clearBlobUrl();
    try {
      await startRecording();
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleProcess = async () => {
    if (!mediaBlobUrl) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert blob URL to actual blob
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const audioFile = new File([blob], 'recording.wav', { type: 'audio/wav' });

      // Step 1: Transcribe
      const formData = new FormData();
      formData.append('audio', audioFile);

      const transcribeResponse = await fetch('${API_URL}/api/transcribe', {
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
      const noteResponse = await fetch('${API_URL}/api/notes/generate', {
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
      onRecordingComplete({
        transcript: transcribeData.transcript,
        soapNote: noteData.soapNote,
        compliance: noteData.compliance,
        confidence: transcribeData.confidence,
        duration: transcribeData.duration,
      });

      // Clear the recording
      clearBlobUrl();

    } catch (err) {
      setError(err.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [recordingTime, setRecordingTime] = useState(0);

  React.useEffect(() => {
    let interval;
    if (status === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="voice-recorder">
      <div className="recorder-container">
        <div className={`recording-indicator ${status === 'recording' ? 'active' : ''}`}>
          {status === 'recording' && (
            <>
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </>
          )}
          <div className="mic-icon">🎙️</div>
        </div>

        <div className="recorder-info">
          {status === 'idle' && (
            <>
              <h3>Ready to Record</h3>
              <p>Click the button below to start recording the clinical encounter</p>
            </>
          )}
          {status === 'recording' && (
            <>
              <h3>Recording...</h3>
              <p className="recording-time">{formatTime(recordingTime)}</p>
            </>
          )}
          {status === 'stopped' && mediaBlobUrl && (
            <>
              <h3>Recording Complete</h3>
              <audio src={mediaBlobUrl} controls className="audio-player" />
            </>
          )}
        </div>

        <div className="recorder-controls">
          {status === 'idle' && (
            <button onClick={handleStartRecording} className="btn-record">
              ⏺ Start Recording
            </button>
          )}
          
          {status === 'recording' && (
            <button onClick={handleStopRecording} className="btn-stop">
              ⏹ Stop Recording
            </button>
          )}

          {status === 'stopped' && mediaBlobUrl && !isProcessing && (
            <div className="post-record-actions">
              <button onClick={handleStartRecording} className="btn-retry">
                🔄 Record Again
              </button>
              <button onClick={handleProcess} className="btn-process">
                🚀 Process Recording
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Processing your recording...</p>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="recorder-tips">
        <h4>💡 Recording Tips:</h4>
        <ul>
          <li>Speak clearly and at a normal pace</li>
          <li>Minimize background noise</li>
          <li>Include patient complaints, exam findings, and treatment plan</li>
          <li>Mention vital signs if available</li>
        </ul>
      </div>
    </div>
  );
}

export default VoiceRecorder;
