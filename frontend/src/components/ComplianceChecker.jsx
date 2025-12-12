import React from 'react';
import './ComplianceChecker.css';

function ComplianceChecker({ compliance }) {
  if (!compliance) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return '#48bb78';
      case 'fail': return '#f56565';
      case 'warning': return '#ed8936';
      default: return '#718096';
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: '#c53030',
      high: '#dd6b20',
      medium: '#d69e2e',
      low: '#38a169',
    };
    return (
      <span 
        className="severity-badge" 
        style={{ backgroundColor: colors[severity] || '#718096' }}
      >
        {severity.toUpperCase()}
      </span>
    );
  };

  const getOverallStatusColor = (status) => {
    switch (status) {
      case 'compliant': return '#48bb78';
      case 'non-compliant': return '#f56565';
      case 'needs-review': return '#ed8936';
      default: return '#718096';
    }
  };

  return (
    <div className="compliance-checker">
      <div className="compliance-header">
        <h2>🛡️ Compliance Check</h2>
        <div 
          className="overall-status"
          style={{ 
            backgroundColor: getOverallStatusColor(compliance.overallStatus),
            color: 'white',
          }}
        >
          {compliance.overallStatus.replace('-', ' ').toUpperCase()}
        </div>
      </div>

      <div className="compliance-score">
        <div className="score-circle">
          <svg viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getOverallStatusColor(compliance.overallStatus)}
              strokeWidth="10"
              strokeDasharray={`${compliance.complianceScore * 2.827} 282.7`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="score-text">
            <span className="score-number">{compliance.complianceScore}%</span>
            <span className="score-label">Compliant</span>
          </div>
        </div>

        <div className="score-details">
          <div className="score-stat">
            <span className="stat-value">{compliance.passedChecks}</span>
            <span className="stat-label">Passed</span>
          </div>
          <div className="score-stat">
            <span className="stat-value">{compliance.failedChecks}</span>
            <span className="stat-label">Failed</span>
          </div>
          <div className="score-stat">
            <span className="stat-value">{compliance.warningChecks}</span>
            <span className="stat-label">Warnings</span>
          </div>
        </div>
      </div>

      <div className="compliance-summary">
        <p>{compliance.summary}</p>
      </div>

      <div className="checks-list">
        {compliance.checks.map((check, index) => (
          <div 
            key={check.id} 
            className={`check-item ${check.status}`}
            style={{ borderLeftColor: getStatusColor(check.status) }}
          >
            <div className="check-header">
              <span className="check-icon">{getStatusIcon(check.status)}</span>
              <span className="check-name">{check.name}</span>
              {getSeverityBadge(check.severity)}
            </div>
            <p className="check-description">{check.description}</p>
            <span className="check-category">{check.category}</span>
          </div>
        ))}
      </div>

      {compliance.criticalFailed > 0 && (
        <div className="critical-alert">
          <span className="alert-icon">🚨</span>
          <div>
            <strong>Critical Issues Detected</strong>
            <p>This document requires review and correction before finalization.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplianceChecker;
