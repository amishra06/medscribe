/**
 * Medical Compliance Checker
 * Validates SOAP notes for completeness and medical documentation standards
 */

function checkCompliance(soapNote, transcript) {
  const checks = [];
  const content = soapNote.toLowerCase();
  const transcriptContent = transcript.toLowerCase();

  // Helper function to normalize markdown and check if section exists with content
  const hasSectionWithContent = (sectionName, contentPatterns) => {
    // Match section headers with various formats:
    // SUBJECTIVE, **SUBJECTIVE**, SUBJECTIVE:, **SUBJECTIVE (S):**
    const sectionRegex = new RegExp(
      `(^|\\n)\\s*\\*{0,2}\\s*${sectionName}\\s*(\\([a-z]\\))?\\s*[:*\\s]*\\*{0,2}`,
      'i'
    );
    
    if (!sectionRegex.test(content)) return false;
    
    // Extract content after section header (up to next section or 500 chars)
    const sectionMatch = content.match(new RegExp(
      `${sectionName}[\\s\\S]{0,800}`,
      'i'
    ));
    
    if (!sectionMatch) return false;
    
    const sectionContent = sectionMatch[0];
    
    // Check if any content pattern exists in this section
    return contentPatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(sectionContent);
    });
  };

  // Check 1: Subjective Section Present
  checks.push({
    id: 'subjective_present',
    name: 'Chief Complaint Documented',
    description: 'Patient\'s primary complaint must be documented in Subjective section',
    status: hasSectionWithContent('subjective', [
      'patient', 'complaint', 'presenting', 'history', 'reports', 'states', 
      'describes', 'year[- ]old', 'male|female', 'chest pain', 'shortness',
      'day', 'week', 'month', 'present'
    ]) ? 'pass' : 'fail',
    severity: 'critical',
    category: 'completeness',
  });

  // Check 2: Objective Section with Clinical Findings
  checks.push({
    id: 'objective_present',
    name: 'Clinical Findings Documented',
    description: 'Objective findings (vitals, physical exam, or test results) must be present',
    status: hasSectionWithContent('objective', [
      'vital', 'exam', 'test', 'finding', 'blood pressure', 'heart rate', 
      'temperature', 'bp', 'hr', 'physical', 'lung', 'heart',
      'pending', 'clear', 'normal', 'order', 'available', 'chest x-ray',
      'ekg', 'ecg', 'placed', 'not available'
    ]) ? 'pass' : 'fail',
    severity: 'critical',
    category: 'completeness',
  });

  // Check 3: Assessment/Diagnosis Present
  const hasAssessment = hasSectionWithContent('assessment', [
    'diagnosis', 'impression', 'condition', 'presentation', 'suggest',
    'acute', 'chronic', 'chest pain', 'cardiac', 'pulmonary', 
    'rule out', 'differential', 'possible', 'likely', 'suspect',
    'syndrome', 'embolism', 'coronary', 'underlying', 'clinical',
    'evaluation', 'necessary', 'origin'
  ]);
  
  checks.push({
    id: 'assessment_present',
    name: 'Diagnosis or Assessment',
    description: 'Clinical assessment or working diagnosis must be documented',
    status: hasAssessment ? 'pass' : 'fail',
    severity: 'critical',
    category: 'completeness',
  });

  // Check 4: Treatment Plan Present
  checks.push({
    id: 'plan_present',
    name: 'Treatment Plan Documented',
    description: 'Plan section must include treatment, medications, or follow-up instructions',
    status: hasSectionWithContent('plan', [
      'order', 'test', 'x-ray', 'ekg', 'ecg', 'lab', 'diagnostic',
      'follow', 'return', 'monitor', 'instruct', 'advise', 'seek',
      'medication', 'prescribe', 'treatment', 'management', 'patient will'
    ]) ? 'pass' : 'fail',
    severity: 'critical',
    category: 'completeness',
  });

  // Check 5: Medication Dosage
  // Look for actual prescription patterns (prescribing WITH dosage)
  const prescriptionPatterns = [
    /prescrib(e|ed|ing)\s+[\w\s]+\d+\s*mg/i,
    /start(ing)?\s+(patient\s+on)?\s*\w+\s*\d+\s*mg/i,
    /give\s+\w+\s*\d+\s*mg/i,
    /administer(ing)?\s+\w+\s*\d+\s*mg/i,
  ];
  
  const hasMedicationPrescribed = prescriptionPatterns.some(pattern => pattern.test(content));
  
  // Look for "no medications" or "medications pending" patterns
  const noMedicationPatterns = [
    /no\s+medication(s)?\s+(have\s+been\s+)?prescribed/i,
    /no\s+medication(s)?\s+at\s+this\s+time/i,
    /medication(s)?\s*:?\s*(no|none|pending)/i,
    /medication(s)?.*pending.*result/i,
    /pending.*medication/i,
    /hold.*medication/i,
    /withhold.*medication/i,
    /defer.*medication/i,
  ];
  
  const medicationAppropriatelyPending = noMedicationPatterns.some(pattern => pattern.test(content));
  
  // Check for OTC/PRN recommendations (acceptable without prescription)
  const hasOTCRecommendation = content.match(/may\s+use|can\s+take|over[\s-]the[\s-]counter|otc|advised\s+to\s+use/i);
  
  if (hasMedicationPrescribed) {
    // Actually prescribing medication - must have dosage
    const hasDosage = content.match(/\d+\s*(mg|ml|mcg|units|tablets|capsules)/i);
    checks.push({
      id: 'medication_dosage',
      name: 'Medication Dosage Specified',
      description: 'Prescribed medications must include specific dosage',
      status: hasDosage ? 'pass' : 'fail',
      severity: 'high',
      category: 'safety',
    });
  } else if (medicationAppropriatelyPending || hasOTCRecommendation) {
    // Appropriately documented as no medications or pending
    checks.push({
      id: 'medication_dosage',
      name: 'Medication Plan Documented',
      description: 'Medication status appropriately documented (no medications prescribed or pending results)',
      status: 'pass',
      severity: 'high',
      category: 'safety',
    });
  }
  // If no medication mentioned at all, skip this check

  // Check 6: Follow-up Instructions
  checks.push({
    id: 'followup_present',
    name: 'Follow-up Instructions',
    description: 'Follow-up plan or return instructions should be documented',
    status: content.match(/follow[\s\-]?up|return|revisit|re[\s-]?visit|appointment|if\s+symptoms|should\s+symptoms|call\s+if|seek.*medical|contact.*if/i) ? 'pass' : 'warning',
    severity: 'medium',
    category: 'continuity',
  });

  // Check 7: Patient Safety - Red Flags
  const redFlags = ['chest pain', 'shortness of breath', 'severe pain', 'bleeding', 'unconscious'];
  const hasRedFlag = redFlags.some(flag => transcriptContent.includes(flag) || content.includes(flag));
  
  if (hasRedFlag) {
    const hasUrgentPlan = content.match(/diagnostic|x[\s-]?ray|ekg|ecg|ct\s+scan|cardiac|enzyme|test|order|immediate|urgent|emergency|monitor|admit/i);
    checks.push({
      id: 'red_flag_addressed',
      name: 'Critical Symptoms Addressed',
      description: 'Urgent symptoms require immediate diagnostic or treatment plan',
      status: hasUrgentPlan ? 'pass' : 'fail',
      severity: 'critical',
      category: 'safety',
    });
  }

  // Calculate compliance score
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.status === 'pass').length;
  const failedChecks = checks.filter(c => c.status === 'fail').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;
  const criticalFailed = checks.filter(c => c.status === 'fail' && c.severity === 'critical').length;

  const complianceScore = Math.round((passedChecks / totalChecks) * 100);
  
  // Overall status
  let overallStatus = 'compliant';
  if (criticalFailed > 0) {
    overallStatus = 'non-compliant';
  } else if (failedChecks > 0 || warningChecks > 1) {
    overallStatus = 'needs-review';
  }

  return {
    overallStatus,
    complianceScore,
    totalChecks,
    passedChecks,
    failedChecks,
    warningChecks,
    criticalFailed,
    checks,
    summary: generateSummary(overallStatus, complianceScore, checks),
  };
}

function generateSummary(status, score, checks) {
  const failedCritical = checks.filter(c => c.status === 'fail' && c.severity === 'critical');
  const failed = checks.filter(c => c.status === 'fail');
  
  if (status === 'compliant') {
    return `Documentation meets all compliance requirements (${score}% compliant).`;
  } else if (status === 'non-compliant') {
    const issues = failedCritical.map(c => c.name).join(', ');
    return `Critical compliance issues detected: ${issues}. Document requires review before finalization.`;
  } else {
    const issues = failed.map(c => c.name).join(', ');
    return `Documentation needs review. Issues found: ${issues}.`;
  }
}

module.exports = { checkCompliance };
