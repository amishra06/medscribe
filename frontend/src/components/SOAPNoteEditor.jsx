import API_URL from '../config/api';
import React, { useState } from 'react';
import './SOAPNoteEditor.css';

function SOAPNoteEditor({ initialNote, onSave, transcript, compliance: initialCompliance, onComplianceUpdate }) {
  const [note, setNote] = useState(initialNote);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setNote(initialNote);
    setIsEditing(false);
  };

  const handleReCheckCompliance = async () => {
    setIsCheckingCompliance(true);

    try {
      const response = await fetch(`${API_URL}/api/notes/check-compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soapNote: note,
          transcript: transcript,
        }),
      });

      const data = await response.json();

      if (data.success && onComplianceUpdate) {
        onComplianceUpdate(data.compliance);
      }
    } catch (error) {
      console.error('Compliance check error:', error);
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // First re-check compliance with edited note
      const complianceResponse = await fetch(`${API_URL}/api/notes/check-compliance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soapNote: note,
          transcript: transcript,
        }),
      });

      const complianceData = await complianceResponse.json();
      const updatedCompliance = complianceData.success ? complianceData.compliance : initialCompliance;

      // Update compliance in parent
      if (onComplianceUpdate) {
        onComplianceUpdate(updatedCompliance);
      }

      // Then save the note
      const response = await fetch(`${API_URL}/api/notes/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soapNote: note,
          transcript: transcript,
          compliance: updatedCompliance,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveSuccess(true);
        setIsEditing(false);
        if (onSave) {
          onSave(data);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save note: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = note.split(/\s+/).length;
  const charCount = note.length;

  return (
    <div className="soap-note-editor">
      <div className="editor-header">
        <h2>⚕️ SOAP Note</h2>
        <div className="editor-actions">
          {!isEditing ? (
            <button onClick={handleEdit} className="btn-edit">
              ✏️ Edit
            </button>
          ) : (
            <>
              <button 
                onClick={handleReCheckCompliance} 
                className="btn-recheck"
                disabled={isCheckingCompliance}
              >
                {isCheckingCompliance ? '⏳ Checking...' : '🔄 Re-check Compliance'}
              </button>
              <button onClick={handleCancel} className="btn-cancel">
                ✕ Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="btn-save"
                disabled={isSaving}
              >
                {isSaving ? '💾 Saving...' : '✓ Save & Finalize'}
              </button>
            </>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="save-success">
          ✅ Note saved successfully with updated compliance check!
        </div>
      )}

      {isEditing ? (
        <div className="editor-container">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="soap-textarea"
            placeholder="Edit SOAP note..."
          />
          <div className="editor-stats">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
          <div className="edit-hint">
            💡 Tip: After editing, click "Re-check Compliance" to update compliance status before saving
          </div>
        </div>
      ) : (
        <div className="soap-display">
          <pre className="soap-content">{note}</pre>
        </div>
      )}
    </div>
  );
}

export default SOAPNoteEditor;
