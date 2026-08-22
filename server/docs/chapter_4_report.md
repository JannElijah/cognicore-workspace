# Chapter 4 Statistical Verification Report

*Generated on: 2026-08-19 16:52:04*

This report provides automated statistical evaluations matching Chapter 4 manuscript requirements. A Paired t-test is applied over the 30 clinical cohort subjects to verify cognitive improvement, along with micro-behavioral Pearson correlation coefficients.

## 1. Pretest-Posttest Empirical Performance Analysis (Pillar 1)

Below is the Paired t-test summary comparing pre-intervention baselines against post-intervention training sessions:

| Performance Metric | Sample Size (N) | Pretest Mean (SD) | Posttest Mean (SD) | Mean Difference | t-Statistic | p-value | Cohen's d | Effect Magnitude |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Accuracy Rate (%)** | 30 | 59.95% (2.97) | 94.63% (1.24) | +34.67% | 60.9929 | 0.000000 | 11.1357 | LARGE |
| **Reaction Time (ms)** | 30 | 1102.97 ms (70.81) | 334.56 ms (21.24) | +768.41 ms | 56.8269 | 0.000000 | 10.3751 | LARGE |

> **Interpretation:** A statistically significant accuracy improvement is detected ($t(29) = 60.993$, $p < 0.05$) with a **large** effect size ($d = 11.136$). Similarly, a statistically significant processing latency speedup is observed ($t(29) = 56.827$, $p < 0.05$) with a **large** effect size ($d = 10.375$).

## 2. Micro-Behavioral Telemetry Correlation Matrix (Pillar 2)

Pearson correlation analysis of micro-behavioral metrics captured during game executions:

| Variable 1 (X) | Variable 2 (Y) | Correlation Coefficient ($r$) | Coefficient of Determination ($R^2$) | p-value | Significance | Interpretation |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| Rule-Shift Latency | Spam Click Count | 0.8480 | 0.7191 | 3.762602e-84 | Significant (p < 0.05) | There is a strong positive correlation. |
| Hesitation (ms) | Reaction Time (ms) | 0.5009 | 0.2509 | 1.022178e-165 | Significant (p < 0.05) | There is a moderate positive correlation. |

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
