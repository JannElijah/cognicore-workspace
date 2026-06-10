# Chapter 4 Statistical Verification Report

*Generated on: 2026-06-10 22:23:11*

This report provides automated statistical evaluations matching Chapter 4 manuscript requirements. A Paired t-test is applied over the 30 clinical cohort subjects to verify cognitive improvement, along with micro-behavioral Pearson correlation coefficients.

## 1. Pretest-Posttest Empirical Performance Analysis (Pillar 1)

Below is the Paired t-test summary comparing pre-intervention baselines against post-intervention training sessions:

| Performance Metric | Sample Size (N) | Pretest Mean (SD) | Posttest Mean (SD) | Mean Difference | t-Statistic | p-value | Cohen's d | Effect Magnitude |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Accuracy Rate (%)** | 30 | 59.64% (2.50) | 95.52% (1.33) | +35.88% | 73.5419 | 0.000000 | 13.4268 | LARGE |
| **Reaction Time (ms)** | 30 | 1114.76 ms (69.21) | 330.58 ms (27.53) | +784.18 ms | 58.8897 | 0.000000 | 10.7517 | LARGE |

> **Interpretation:** A statistically significant accuracy improvement is detected ($t(29) = 73.542$, $p < 0.05$) with a **large** effect size ($d = 13.427$). Similarly, a statistically significant processing latency speedup is observed ($t(29) = 58.890$, $p < 0.05$) with a **large** effect size ($d = 10.752$).

## 2. Micro-Behavioral Telemetry Correlation Matrix (Pillar 2)

Pearson correlation analysis of micro-behavioral metrics captured during game executions:

| Variable 1 (X) | Variable 2 (Y) | Correlation Coefficient ($r$) | Coefficient of Determination ($R^2$) | p-value | Significance | Interpretation |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| Rule-Shift Latency | Spam Click Count | 0.8279 | 0.6855 | 7.950304e-77 | Significant (p < 0.05) | There is a strong positive correlation. |
| Hesitation (ms) | Reaction Time (ms) | 0.5509 | 0.3035 | 1.383385e-154 | Significant (p < 0.05) | There is a moderate positive correlation. |

## 3. Generated Chapter 4 Figures

The following figures have been rendered to `server/thesis_plots/` for manuscript insertion:

### Figure 1: Clinical Cohort Pre- vs Post-Intervention Improvement
![Pretest vs Posttest Scores Comparison](thesis_plots/pretest_posttest_comparison.png)

### Figure 2: Micro-behavioral Friction Scatter Plot
![Behavioral Metric Correlation](thesis_plots/behavioral_correlation.png)

### Figure 3: Longitudinal Learning Curves
![Longitudinal Learning Curves Comparison](thesis_plots/learning_curves.png)

### Figure 4: Classified Cognitive Archetype Distributions
![Classified Archetype Distribution](thesis_plots/cognitive_archetypes_dist.png)
