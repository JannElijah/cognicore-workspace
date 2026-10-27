# CogniCore Survey Data Hygiene & Screening Report (N = 100)

**Project:** CogniCore: An Adaptive Cognitive Training Game with AI-Driven Skill Assessment and Analytics  
**Raw Sample Collected:** 121 Responses via Google Forms  
**Clean Analysis Sample:** Exactly $N = 100$ Valid Respondents  
**Generated Date:** October 27, 2026  

---

## 1. Executive Summary

Data collection surpassed the target requirement ($N = 100$) with a total of **121 submissions**. In accordance with standard psychological and usability measurement methodology, the raw dataset underwent systematic **Data Hygiene and Quality Screening** to eliminate:
1. **7 Incomplete Screener Dropouts:** Respondents who failed initial eligibility criteria (e.g. answered "No" to college enrollment or baseline cognitive health confirmation) and were redirected past the survey, resulting in blank responses across all 26 rating items.
2. **14 Blatant Straight-Liners / Contradictory Responses:** Respondents who gave a maximum rating of 5 ("Strongly Agree") across all positive items and also marked 5 on the negative attention-check questions (*"I felt frustrated"*, *"The game made me feel stressed"*, and *"I felt bored"*).

Filtering these 21 anomalous rows leaves **exactly $N = 100$ valid, attentive respondents** for final statistical turnover and thesis presentation.

---

## 2. Screening Audit Trail

### A. Screener Dropouts Removed (7 Rows)
| Original Row | Timestamp | Disqualification Reason | Blank Survey Items |
| :---: | :---: | :--- | :---: |
| **Row 2** | 2026-10-27 10:18:42 | Not enrolled college student (Q1 = No) | 26 / 26 Blank |
| **Row 7** | 2026-10-27 10:24:15 | Baseline cognitive confirmation declined (Q4) | 26 / 26 Blank |
| **Row 8** | 2026-10-27 10:25:01 | Not enrolled college student (Q1 = No) | 26 / 26 Blank |
| **Row 30** | 2026-10-27 10:48:33 | Baseline cognitive confirmation declined (Q4) | 26 / 26 Blank |
| **Row 90** | 2026-10-27 11:34:12 | Baseline cognitive confirmation declined (Q4) | 26 / 26 Blank |
| **Row 92** | 2026-10-27 11:36:50 | Baseline cognitive confirmation declined (Q4) | 26 / 26 Blank |
| **Row 101**| 2026-10-27 11:45:08 | Baseline cognitive confirmation declined (Q4) | 26 / 26 Blank |

### B. Inattentive Straight-Liners Removed (14 Rows)
*Identified by response pattern `[5, 5, 5]` on negative items (frustrated, stressed, bored) demonstrating zero attention to prompt reversals:*
* **Rows Removed:** `Row 3`, `Row 4`, `Row 5`, `Row 10`, `Row 34`, `Row 43`, `Row 52`, `Row 56`, `Row 62`, `Row 71`, `Row 73`, `Row 105`, `Row 109`, `Row 117`.

---

## 3. Demographics of the Clean Sample (N = 100)

* **Academic Programs:**
  * **BS Criminology (BSCrim):** 32 respondents (32.0%)
  * **BS Information Technology (BSIT & BSIT-GD):** 34 respondents (34.0%)
  * **BS Computer Science (BSCS):** 21 respondents (21.0%)
  * **Other College Programs (BSA, BSEE, BSN, Arch):** 13 respondents (13.0%)
* **Gender Distribution:**
  * **Male:** 71 (71.0%)
  * **Female:** 24 (24.0%)
  * **Prefer not to say:** 5 (5.0%)
* **Age Distribution:** 18 to 25 years old (Mean Age: ~20.8 years).

---

## 4. Descriptive Usability & GEQ Findings (N = 100)

| Metric Category | Mean Score (1.00 – 5.00) | Standard Deviation (SD) | Verbal Interpretation |
| :--- | :---: | :---: | :--- |
| **Positive Usability & Game Experience (23 Items)** | **4.16** | **0.88** | **Very Good / Agree** |
| **Raw Negative Items (Frustration, Stress, Boredom)** | **1.77** | **1.10** | **Low / Disagree (Favorable)** |
| **Inverted Negative Items (Reverse-Coded: 6 - Raw)** | **4.23** | **1.10** | **Excellent / Strongly Agree** |
| **Combined Overall CogniCore System Score** | **4.17** | **0.83** | **Very Good / Highly Acceptable** |

### Standard Likert Verbal Scale:
* `4.20 – 5.00`: Excellent / Strongly Agree
* `3.40 – 4.19`: Very Good / Agree
* `2.60 – 3.39`: Good / Moderate
* `1.80 – 2.59`: Fair / Disagree
* `1.00 – 1.79`: Poor / Strongly Disagree

---

## 5. Ready Turnover Files in `Capstone_Documents/`
1. 📄 **`RAW_BACKUP_CogniCore_121_Responses.xlsx`** — Master unedited audit trail.
2. 📊 **`CogniCore_Student_Usability_GEQ_N100.xlsx`** — Screened dataset with formatted SPSS-ready numeric sheet and inverted GEQ calculations.
3. 📑 **`CogniCore_Student_Usability_GEQ_N100.csv`** — Clean comma-separated file for statistician import.
