import React, { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../utils/apiClient.js';

export const ISO_CRITERIA = [
  {
    key: 'functionality_score',
    avgKey: 'avg_functionality',
    label: 'Functional Suitability',
    description: 'Completeness and correctness of cognitive training modules and DDA adaptation.'
  },
  {
    key: 'usability_score',
    avgKey: 'avg_usability',
    label: 'Usability & Learnability',
    description: 'Clarity of interface layout, game instructions, and navigation flow.'
  },
  {
    key: 'reliability_score',
    avgKey: 'avg_reliability',
    label: 'Reliability & Stability',
    description: 'Session persistence, error resilience, and telemetry synchronization accuracy.'
  },
  {
    key: 'efficiency_score',
    avgKey: 'avg_efficiency',
    label: 'Performance Efficiency',
    description: 'Responsiveness of interactive game loops, timers, and analytics charts.'
  },
  {
    key: 'ux_score',
    avgKey: 'avg_ux',
    label: 'Overall User Experience',
    description: 'Engagement, visual polish, and overall satisfaction with CogniCore.'
  }
];

const LIKERT_VALUES = [1, 2, 3, 4, 5];

const DEFAULT_SCORES = ISO_CRITERIA.reduce((acc, criterion) => {
  acc[criterion.key] = 5;
  return acc;
}, {});

function IsoEvaluationModal({ isOpen, onClose, onSubmitted }) {
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const response = await fetch(`${API_BASE}/api/iso-evaluations/summary`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data.status === 'success' && data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load ISO 25010 summary', err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setSuccessMessage('');
    loadSummary();
  }, [isOpen, loadSummary]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) {
    return null;
  }

  const handleScoreChange = (fieldKey, value) => {
    setScores((prev) => ({
      ...prev,
      [fieldKey]: value
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/iso-evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scores)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || `Submission failed (HTTP ${response.status}).`);
      }

      setSuccessMessage(data.message || 'ISO 25010 evaluation recorded successfully.');
      await loadSummary();
      onSubmitted?.();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record ISO 25010 evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const overallMean = summary && summary.count > 0
    ? (
        (
          Number(summary.avg_functionality || 0) +
          Number(summary.avg_usability || 0) +
          Number(summary.avg_reliability || 0) +
          Number(summary.avg_efficiency || 0) +
          Number(summary.avg_ux || 0)
        ) / 5
      ).toFixed(2)
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="iso-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div>
            <h2 id="iso-modal-title" style={{ color: '#f8fafc', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              ISO 25010 Software Quality Evaluation
            </h2>
            <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.82rem' }}>
              Rate each dimension from 1 (Poor) to 5 (Excellent).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ISO evaluation modal"
            disabled={submitting}
            style={{
              background: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '8px',
              color: '#cbd5e1',
              fontSize: '0.9rem',
              padding: '0.35rem 0.65rem',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ color: '#bae6fd', fontWeight: 600 }}>
              {loadingSummary && !summary
                ? 'Loading live ISO 25010 summary...'
                : summary && summary.count > 0
                  ? `Cohort Mean: ${overallMean} / 5.00 (${summary.count} evaluation${summary.count === 1 ? '' : 's'})`
                  : 'No ISO 25010 evaluations recorded yet.'}
            </span>
          </div>

          <form id="iso-evaluation-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {ISO_CRITERIA.map((criterion) => {
              const selectedValue = scores[criterion.key];
              const avgValue = summary && summary.count > 0 ? Number(summary[criterion.avgKey] || 0).toFixed(2) : null;

              return (
                <div
                  key={criterion.key}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(148, 163, 184, 0.14)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.92rem' }}>
                        {criterion.label}
                      </span>
                      {avgValue !== null && (
                        <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                          Avg: {avgValue}/5
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      {criterion.description}
                    </div>
                  </div>

                  <div
                    role="group"
                    aria-label={criterion.label}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {LIKERT_VALUES.map((val) => {
                      const isSelected = selectedValue === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          aria-label={`${criterion.label} ${val} out of 5`}
                          aria-pressed={isSelected}
                          onClick={() => handleScoreChange(criterion.key, val)}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: isSelected
                              ? '1px solid #38bdf8'
                              : '1px solid rgba(148, 163, 184, 0.25)',
                            background: isSelected ? '#38bdf8' : 'rgba(15, 23, 42, 0.8)',
                            color: isSelected ? '#0f172a' : '#cbd5e1',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {errorMessage && (
              <div
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.14)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem'
                }}
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                style={{
                  background: 'rgba(74, 222, 128, 0.14)',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                  color: '#86efac',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem'
                }}
              >
                {successMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.28)',
                  background: 'transparent',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: submitting ? 'rgba(56, 189, 248, 0.5)' : '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default IsoEvaluationModal;
