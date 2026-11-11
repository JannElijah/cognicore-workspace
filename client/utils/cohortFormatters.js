/**
 * Format live cohort analytics API responses into safe display strings and colors.
 */
export function formatCohortValidationMetrics(cohortData) {
  if (!cohortData) {
    return {
      cohortSizeText: 'Cohort Size: N = —',
      meanShiftText: '—',
      meanShiftSubtitle: 'Awaiting Cohort Data',
      meanShiftSubtitleColor: '#94a3b8',
      confidenceText: 'Pending Pairs',
      confidenceColor: '#94a3b8',
      pairedSampleText: 'N = 0',
      pValueText: 'N/A',
      pValueColor: '#94a3b8',
      effectSizeText: 'N/A',
      effectSizeColor: '#94a3b8',
      isoScoreText: 'N/A',
      isoScoreColor: '#94a3b8',
    };
  }

  const totalParticipants = cohortData.total_participants ?? 0;
  const hasPre = (cohortData.pre_test_count ?? 0) > 0;
  const hasPost = (cohortData.post_test_count ?? 0) > 0;

  let shiftNum = null;
  if (cohortData.mean_shift !== undefined && cohortData.mean_shift !== null) {
    shiftNum = Number(cohortData.mean_shift);
  } else if (hasPre && hasPost) {
    const preOverall = Number(cohortData.avg_pre_scores?.overall ?? 0);
    const postOverall = Number(cohortData.avg_post_scores?.overall ?? 0);
    shiftNum = Number((postOverall - preOverall).toFixed(2));
  }

  let meanShiftText = '—';
  let meanShiftSubtitle = 'Awaiting Pre/Post Pairs';
  let meanShiftSubtitleColor = '#94a3b8';
  if (shiftNum !== null && Number.isFinite(shiftNum)) {
    const sign = shiftNum > 0 ? '+' : '';
    meanShiftText = `${sign}${shiftNum.toFixed(2)}%`;
    meanShiftSubtitle = shiftNum >= 0 ? 'Overall Cognitive Index ↗' : 'Overall Cognitive Index ↘';
    meanShiftSubtitleColor = shiftNum >= 0 ? '#4ade80' : '#ef4444';
  }

  const stats = cohortData.statistics || {};
  const pairedN = stats.paired_sample_size ?? 0;
  const pVal = stats.p_value;
  const cohensD = stats.cohens_d;

  let confidenceText = 'Pending Pairs';
  let confidenceColor = '#94a3b8';
  let pValueText = 'N/A';
  let pValueColor = '#94a3b8';
  if (pVal !== null && pVal !== undefined && pairedN >= 2) {
    const pNum = Number(pVal);
    pValueText = pNum < 0.001 ? 'p < 0.001' : `p = ${pNum.toFixed(3)}`;
    if (pNum < 0.001) {
      confidenceText = 'Confidence: >99.9%';
      confidenceColor = '#4ade80';
      pValueColor = '#4ade80';
    } else if (pNum < 0.05) {
      confidenceText = `Confidence: ${((1 - pNum) * 100).toFixed(1)}%`;
      confidenceColor = '#4ade80';
      pValueColor = '#4ade80';
    } else {
      confidenceText = `Confidence: ${Math.max(0, (1 - pNum) * 100).toFixed(1)}%`;
      confidenceColor = '#f59e0b';
      pValueColor = '#f59e0b';
    }
  }

  const hasEffect = cohensD !== null && cohensD !== undefined && pairedN >= 2;
  const effectSizeText = hasEffect ? `d = ${Number(cohensD).toFixed(2)}` : 'N/A';
  const effectSizeColor = hasEffect ? '#f59e0b' : '#94a3b8';

  const isoMean = cohortData.iso_summary?.overall_mean;
  const hasIso = isoMean !== null && isoMean !== undefined && (cohortData.iso_summary?.count ?? 0) > 0;
  const isoScoreText = hasIso ? `${Number(isoMean).toFixed(2)} / 5` : 'N/A';
  const isoScoreColor = hasIso ? '#c084fc' : '#94a3b8';

  return {
    cohortSizeText: `Cohort Size: N = ${totalParticipants}`,
    meanShiftText,
    meanShiftSubtitle,
    meanShiftSubtitleColor,
    confidenceText,
    confidenceColor,
    pairedSampleText: `N = ${pairedN}`,
    pValueText,
    pValueColor,
    effectSizeText,
    effectSizeColor,
    isoScoreText,
    isoScoreColor,
  };
}
