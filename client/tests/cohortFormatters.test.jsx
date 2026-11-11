import { formatCohortValidationMetrics } from '../utils/cohortFormatters.js';

describe('formatCohortValidationMetrics', () => {
  it('returns safe placeholders when cohortData is null', () => {
    const res = formatCohortValidationMetrics(null);
    expect(res.cohortSizeText).toBe('Cohort Size: N = —');
    expect(res.meanShiftText).toBe('—');
    expect(res.pValueText).toBe('N/A');
    expect(res.effectSizeText).toBe('N/A');
    expect(res.isoScoreText).toBe('N/A');
    expect(res.confidenceText).toBe('Pending Pairs');
  });

  it('handles insufficient paired data (N < 2) and empty ISO evaluations without hardcoded values', () => {
    const res = formatCohortValidationMetrics({
      total_participants: 94,
      pre_test_count: 94,
      post_test_count: 0,
      mean_shift: null,
      avg_pre_scores: { overall: 64.2 },
      avg_post_scores: { overall: 0 },
      statistics: {
        paired_sample_size: 1,
        t_statistic: null,
        p_value: null,
        cohens_d: null,
      },
      iso_summary: { count: 0, overall_mean: null },
    });

    expect(res.cohortSizeText).toBe('Cohort Size: N = 94');
    expect(res.meanShiftText).toBe('—');
    expect(res.pairedSampleText).toBe('N = 1');
    expect(res.pValueText).toBe('N/A');
    expect(res.effectSizeText).toBe('N/A');
    expect(res.isoScoreText).toBe('N/A');
    expect(res.confidenceText).toBe('Pending Pairs');
  });

  it('formats significant paired statistics and ISO score dynamically', () => {
    const res = formatCohortValidationMetrics({
      total_participants: 94,
      pre_test_count: 94,
      post_test_count: 29,
      mean_shift: 14.25,
      statistics: {
        paired_sample_size: 29,
        t_statistic: 4.92,
        p_value: 0.0002,
        cohens_d: 0.714,
      },
      iso_summary: { count: 2, overall_mean: 4.2 },
    });

    expect(res.cohortSizeText).toBe('Cohort Size: N = 94');
    expect(res.meanShiftText).toBe('+14.25%');
    expect(res.meanShiftSubtitle).toBe('Overall Cognitive Index ↗');
    expect(res.confidenceText).toBe('Confidence: >99.9%');
    expect(res.pairedSampleText).toBe('N = 29');
    expect(res.pValueText).toBe('p < 0.001');
    expect(res.effectSizeText).toBe('d = 0.71');
    expect(res.isoScoreText).toBe('4.20 / 5');
  });

  it('formats moderate or negative cohort shifts accurately', () => {
    const res = formatCohortValidationMetrics({
      total_participants: 12,
      pre_test_count: 10,
      post_test_count: 10,
      mean_shift: -2.5,
      statistics: {
        paired_sample_size: 10,
        t_statistic: -1.2,
        p_value: 0.24,
        cohens_d: -0.15,
      },
      iso_summary: { count: 1, overall_mean: 3.8 },
    });

    expect(res.meanShiftText).toBe('-2.50%');
    expect(res.meanShiftSubtitle).toBe('Overall Cognitive Index ↘');
    expect(res.pValueText).toBe('p = 0.240');
    expect(res.confidenceText).toBe('Confidence: 76.0%');
    expect(res.effectSizeText).toBe('d = -0.15');
    expect(res.isoScoreText).toBe('3.80 / 5');
  });
});
