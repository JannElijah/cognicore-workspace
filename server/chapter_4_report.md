# Chapter 4 Statistical Verification Report

*Generated on: 2026-06-07 20:53:00*

This report provides automated statistical evaluations matching Chapter 4 manuscript requirements. A Paired t-test is applied over the 30 clinical cohort subjects to verify cognitive improvement, along with micro-behavioral Pearson correlation coefficients.

## 1. Pretest-Posttest Empirical Performance Analysis (Pillar 1)

Below is the Paired t-test summary comparing pre-intervention baselines against post-intervention training sessions:

| Performance Metric | Sample Size (N) | Pretest Mean (SD) | Posttest Mean (SD) | Mean Difference | t-Statistic | p-value | Cohen's d | Effect Magnitude |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Accuracy Rate (%)** | 30 | 59.22% (2.90) | 94.30% (1.29) | +35.08% | 57.3595 | 0.000000 | 10.4724 | LARGE |
| **Reaction Time (ms)** | 30 | 1109.40 ms (60.96) | 334.41 ms (21.21) | +774.99 ms | 63.5618 | 0.000000 | 11.6047 | LARGE |

> **Interpretation:** A statistically significant accuracy improvement is detected ($t(29) = 57.359$, $p < 0.05$) with a **large** effect size ($d = 10.472$). Similarly, a statistically significant processing latency speedup is observed ($t(29) = 63.562$, $p < 0.05$) with a **large** effect size ($d = 11.605$).

## 2. Micro-Behavioral Telemetry Correlation Matrix (Pillar 2)

Pearson correlation analysis of micro-behavioral metrics captured during game executions:

| Variable 1 (X) | Variable 2 (Y) | Correlation Coefficient ($r$) | Coefficient of Determination ($R^2$) | p-value | Significance | Interpretation |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| Rule-Shift Latency | Spam Click Count | 0.8619 | 0.7429 | 6.632582e-90 | Significant (p < 0.05) | There is a strong positive correlation. |
| Hesitation (ms) | Reaction Time (ms) | 0.5756 | 0.3314 | 2.538587e-158 | Significant (p < 0.05) | There is a moderate positive correlation. |

## 3. Generated Chapter 4 Figures

The following figures have been rendered to `server/thesis_plots/` for manuscript insertion:

### Figure 1: Clinical Cohort Pre- vs Post-Intervention Improvement
![Pretest vs Posttest Scores Comparison](file:///d:/cognicore-workspace/server/thesis_plots/pretest_posttest_comparison.png)

### Figure 2: Micro-behavioral Friction Scatter Plot
![Behavioral Metric Correlation](file:///d:/cognicore-workspace/server/thesis_plots/behavioral_correlation.png)

### Figure 3: Longitudinal Learning Curves
![Longitudinal Learning Curves Comparison](file:///d:/cognicore-workspace/server/thesis_plots/learning_curves.png)

### Figure 4: Classified Cognitive Archetype Distributions
![Classified Archetype Distribution](file:///d:/cognicore-workspace/server/thesis_plots/cognitive_archetypes_dist.png)
