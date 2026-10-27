# **GUIDELINES FOR WRITING CHAPTER 3 AND CHAPTER 4**

## **General Writing Principle**

Chapter 3 presents, analyzes, and discusses the evidence obtained from the developed system, testing activities, evaluation instruments, and statistical procedures.

The chapter should answer:

1. **What was developed?**  
2. **How was the system structured?**  
3. **How was the system tested?**  
4. **What were the testing results?**  
5. **How well did the system perform?**  
6. **How did users evaluate the system?**  
7. **If AI/ML was used, how accurately and reliably did the model perform?**  
8. **Was the system effective based on the selected measures?**  
9. **What do the findings mean in relation to the research objectives and previous studies?**

Do not simply present screenshots, tables, or numerical results. Every major result should be followed by an explanation and interpretation.

### **Recommended Results-and-Discussion Pattern**

For every major result, use this sequence:

**1\. Present → 2\. Describe → 3\. Interpret → 4\. Discuss → 5\. Relate to objectives/literature**

Example:

> **Present:** The system obtained an overall functionality mean of 4.48.

> **Describe:** This indicates that respondents rated the system highly in terms of its ability to perform its intended functions.

> **Interpret:** The result falls within the "Excellent" interpretation based on the adopted evaluation scale.

> **Discuss:** The high rating may be attributed to the implementation of clearly defined functional requirements and systematic testing of the major modules.

> **Relate:** This finding supports the objective of developing a functional and usable system and is consistent with previous research emphasizing the importance of functional suitability in software quality evaluation.

---

# **CHAPTER 3**

# **RESULTS AND DISCUSSION**

## **Introduction to Chapter 3**

Begin Chapter 3 with a short paragraph explaining what the chapter contains.

### **Suggested Content**

The introduction should mention:

* presentation of the developed system;  
* system structure and interfaces;  
* system testing;  
* AI/ML evaluation, if applicable;  
* software quality evaluation;  
* user acceptability;  
* effectiveness evaluation;  
* statistical analysis; and  
* interpretation and discussion of findings.

### **Recommended Introduction**

> This chapter presents the results and discussion of the developed system based on the objectives of the study. It describes the implemented system, its structure, major interfaces, and functional components. The chapter also presents the results of system testing, including functional, database, API, performance, security, compatibility, usability, and software quality testing. For studies involving Artificial Intelligence and Machine Learning, the chapter further presents the dataset characteristics, model configuration, training and testing performance, classification results, error analysis, and model validation. The results of the user evaluation, acceptability assessment, and pretest-posttest evaluation are likewise presented and statistically analyzed. The findings are interpreted in relation to the research objectives, evaluation criteria, and relevant literature.

---

# **3.1 Project Description**

## **Purpose**

Describe the completed system as an implemented research output.

## **Include**

* project/system name;  
* purpose of the system;  
* intended users;  
* problem addressed;  
* major modules;  
* major functions;  
* technologies used;  
* AI/ML components, if applicable;  
* database;  
* external services/APIs;  
* major innovations/features.

## **Recommended Presentation**

Start with a general description, followed by the major modules.

### **Suggested Structure**

**3.1.1 System Overview**

Explain what the system does.

**3.1.2 Target Users**

Identify who uses the system.

**3.1.3 Major Features**

List and briefly explain the major features.

**3.1.4 Technologies Used**

Present the frontend, backend, database, APIs, AI/ML framework, hosting, and other technologies.

### **Important Rule**

Do not turn this section into a long programming tutorial.

Explain the **implemented research system**, not every line of source code.

---

# **3.2 Project Structure**

This section explains how the system is organized and how users interact with it.

## **Include**

### **A. System Architecture**

Show:

**User → Interface → Application/Backend → Database/API/AI Model → Results**

### **B. Site Map**

Show the navigation structure.

Example:

Login  
│  
├── Dashboard  
│   ├── Profile  
│   ├── Main Feature  
│   ├── History  
│   └── Reports  
│  
├── Evaluation/Game Module  
│  
└── Settings

### **C. GUI Interfaces**

Present important screenshots such as:

* Login;  
* Registration;  
* Dashboard;  
* Main feature;  
* Input/upload page;  
* Processing page;  
* Results page;  
* Reports;  
* Profile;  
* Settings;  
* Administration pages.

### **Writing Rule**

Do not describe every button individually.

Focus on:

* purpose of the interface;  
* user interaction;  
* information displayed;  
* relationship to system functionality;  
* contribution to usability.

---

# **3.3 System Test Plan and Results**

This section should contain the **actual System Test Plan transferred into the thesis**, followed by the actual testing results.

Testing should demonstrate that the implemented system satisfies its functional and non-functional requirements. Functional requirements describe what the system should do, while non-functional requirements describe how well it should operate, including performance, security, usability, reliability, and related qualities.

## **Recommended Testing Evidence**

Use:

* test case tables;  
* expected results;  
* actual results;  
* pass/fail status;  
* defect observations;  
* screenshots when necessary;  
* test summary;  
* discussion of findings.

### **Recommended Test Case Format**

| Test ID | Module/Feature | Test Procedure | Expected Result | Actual Result | Status |
| ----- | ----- | ----- | ----- | ----- | ----- |
| TC-001 | Login | Enter valid credentials | User successfully logs in | User logged in | Pass |
| TC-002 | Login | Enter invalid password | Error message displayed | Error displayed | Pass |

### **Important Rule**

Do not write:

> "The system was tested and it worked."

Instead, provide **objective testing evidence**.

---

# **3.3.1 Testing Scope**

## **Purpose**

Define exactly what was tested and what was not tested.

## **Include**

* modules tested;  
* features tested;  
* user roles tested;  
* database components;  
* APIs;  
* AI/ML components;  
* supported devices;  
* supported browsers;  
* security features;  
* performance requirements;  
* excluded components.

## **Writing Question**

> What parts of the system were included in the testing?

### **Avoid**

Claiming that the entire system was tested if only selected modules were actually tested.

---

# **3.3.2 Testing Methodology**

## **Purpose**

Explain how testing was conducted.

## **Include**

* testing approach;  
* testing procedures;  
* testing tools;  
* test participants;  
* test environment;  
* test data;  
* test cases;  
* criteria for pass/fail;  
* defect recording;  
* retesting procedure.

## **Possible Testing Methods**

* Unit Testing  
* Integration Testing  
* System Testing  
* Functional Testing  
* Black-Box Testing  
* User Acceptance Testing  
* Performance Testing  
* Security Testing  
* Compatibility Testing  
* Usability Testing

### **Writing Rule**

Explain **how the testing was performed**, not merely the names of testing methods.

---

# **3.3.3 Hardware and Software Test Environment**

Describe the environment where testing was conducted.

## **Hardware**

Include:

* computer/laptop specifications;  
* processor;  
* RAM;  
* storage;  
* mobile devices, if applicable;  
* network connection.

## **Software**

Include:

* operating system;  
* browser;  
* programming language;  
* framework;  
* database;  
* IDE;  
* API services;  
* AI/ML libraries;  
* testing tools.

### **Recommended Table**

| Category | Specification |
| ----- | ----- |
| Processor | Intel/AMD/Apple |
| RAM | 8 GB/16 GB |
| Operating System | Windows/Linux/macOS |
| Browser | Chrome/Edge/Firefox |
| Database | MySQL/SQLite/etc. |
| Backend | Node.js/Python/etc. |
| ML Framework | Scikit-learn/TensorFlow/etc. |

---

# **3.3.4 Functional Test Cases**

Evaluate whether each required function works correctly.

## **Test**

* registration;  
* login;  
* logout;  
* CRUD operations;  
* file upload;  
* search;  
* calculations;  
* report generation;  
* notifications;  
* AI generation;  
* game functions;  
* dashboard;  
* user management.

## **Discussion**

After the table, explain:

* how many test cases passed;  
* how many failed;  
* which functions required correction;  
* whether the final version satisfied the requirements.

### **Useful Summary**

**Functional Pass Rate**

Pass Rate=Number of Passed Test CasesTotal Test Cases×100Pass\\ Rate \= \\frac{Number\\ of\\ Passed\\ Test\\ Cases}{Total\\ Test\\ Cases}\\times100

---

# **3.3.5 Database Testing**

Evaluate whether the database correctly stores, retrieves, updates, and protects data.

## **Test**

* database connection;  
* table creation;  
* INSERT;  
* SELECT;  
* UPDATE;  
* DELETE;  
* relationships;  
* constraints;  
* duplicate records;  
* invalid data;  
* data persistence;  
* transaction handling;  
* backup/recovery, if applicable.

## **Discussion**

Explain whether:

* data were correctly stored;  
* relationships worked;  
* invalid records were rejected;  
* data integrity was maintained.

---

# **3.3.6 API / External Service Testing**

For systems using external services such as AI APIs, payment APIs, maps, email services, or authentication services, test:

* API connectivity;  
* valid requests;  
* invalid requests;  
* authentication;  
* response format;  
* response time;  
* error handling;  
* timeout handling;  
* rate-limit handling;  
* unavailable service behavior.

For AI systems, specifically report:

* request success rate;  
* response time;  
* invalid response handling;  
* malformed output handling;  
* API failure handling;  
* consistency of generated results.

---

# **3.3.7 Performance Testing**

Measure how efficiently the system performs.

## **Possible Metrics**

* response time;  
* page loading time;  
* API response time;  
* AI generation time;  
* database query time;  
* CPU utilization;  
* memory usage;  
* concurrent users;  
* throughput.

### **Discussion Questions**

* Was the response time acceptable?  
* Which operation was fastest?  
* Which operation was slowest?  
* What caused delays?  
* Did performance remain stable under expected usage?

Do not claim "fast" without a measured basis.

---

# **3.3.8 Security Testing**

Evaluate whether the system protects users and data.

## **Test**

* authentication;  
* authorization;  
* password protection;  
* session management;  
* input validation;  
* SQL injection;  
* Cross-Site Scripting (XSS);  
* file upload security;  
* API authentication;  
* unauthorized access;  
* data exposure;  
* error-message security.

## **Discussion**

Explain:

* vulnerabilities detected;  
* vulnerabilities corrected;  
* security controls implemented;  
* remaining limitations.

---

# **3.3.9 Compatibility Testing**

Test the system across supported environments.

## **Include**

### **Browsers**

* Chrome;  
* Edge;  
* Firefox;  
* Safari, if applicable.

### **Devices**

* desktop;  
* laptop;  
* tablet;  
* smartphone.

### **Operating Systems**

* Windows;  
* Android;  
* iOS;  
* macOS;  
* Linux, if applicable.

## **Present**

| Environment | Result | Remarks |
| ----- | ----- | ----- |
| Chrome | Pass | Fully functional |
| Edge | Pass | Fully functional |
| Firefox | Pass | Minor UI difference |
| Mobile | Pass | Responsive layout |

---

# **3.3.10 Usability and User Interface Testing**

Evaluate how easily users can interact with the system.

## **Evaluate**

* ease of navigation;  
* clarity of labels;  
* consistency;  
* readability;  
* layout;  
* responsiveness;  
* error messages;  
* learnability;  
* accessibility;  
* user satisfaction.

## **Evidence**

Use:

* usability questionnaire;  
* task completion rate;  
* task completion time;  
* user observations;  
* comments;  
* satisfaction ratings.

### **Discussion**

Do not simply say:

> "Users liked the interface."

Explain **which characteristics caused the positive or negative evaluation**.

---

# **3.3.11 ISO/IEC 25010 Software Quality Evaluation**

This section presents the formal software quality evaluation.

The exact ISO/IEC 25010 characteristics used should be consistent with the research methodology and instrument.

Possible characteristics include:

* Functional Suitability  
* Performance Efficiency  
* Compatibility  
* Usability  
* Reliability  
* Security  
* Maintainability  
* Portability

## **For each characteristic, present:**

1. criterion;  
2. questionnaire items;  
3. mean;  
4. standard deviation, if applicable;  
5. verbal interpretation;  
6. respondent group;  
7. discussion.

### **Recommended Table**

| Quality Characteristic | Mean | SD | Interpretation |
| ----- | ----- | ----- | ----- |
| Functional Suitability | 4.50 | 0.42 | Excellent |
| Usability | 4.55 | 0.38 | Excellent |
| Reliability | 4.40 | 0.45 | Very Good |
| Overall | 4.48 | 0.41 | Excellent |

### **Discussion**

Explain:

* highest-rated characteristic;  
* lowest-rated characteristic;  
* possible reasons;  
* implications;  
* relationship to system objectives.

---

# **3.3.12 Testing Results Summary**

Provide a consolidated summary.

## **Include**

* total functional test cases;  
* passed;  
* failed;  
* pass percentage;  
* major defects;  
* resolved defects;  
* unresolved limitations;  
* performance findings;  
* security findings;  
* compatibility findings;  
* usability findings.

### **Recommended Summary Table**

| Testing Area | Test Cases | Passed | Failed | Pass Rate |
| ----- | ----- | ----- | ----- | ----- |
| Functional | 30 | 30 | 0 | 100% |
| Database | 15 | 15 | 0 | 100% |
| API | 10 | 9 | 1 | 90% |
| Security | 12 | 12 | 0 | 100% |

**Important:** Use actual values from the project. Never fabricate testing results.

---

# **3.3.13 Machine Learning Evaluation Results and Discussion**

This section is required for projects involving:

* Machine Learning;  
* Artificial Intelligence classification;  
* prediction;  
* recommendation;  
* computer vision;  
* NLP;  
* speech recognition;  
* anomaly detection;  
* clustering;  
* intelligent analytics.

For AI/ML projects, technical system testing alone is insufficient. The research should demonstrate whether the model produces valid, reliable, and generalizable results.

---

## **3.3.13.1 Dataset Description and Distribution**

### **Purpose**

Describe the dataset used to develop and evaluate the model.

### **Include**

* dataset source;  
* total samples;  
* number of classes;  
* class names;  
* samples per class;  
* training set;  
* validation set;  
* testing set;  
* class balance/imbalance.

### **Recommended Table**

| Class | Total | Training | Validation | Testing |
| ----- | ----- | ----- | ----- | ----- |
| Class A | 500 | 350 | 75 | 75 |
| Class B | 500 | 350 | 75 | 75 |
| Total | 1,000 | 700 | 150 | 150 |

### **Discussion**

Explain whether the dataset is balanced and how the distribution may affect model performance.

---

# **3.3.13.2 Data Preprocessing Results**

Explain what happened to the raw data before model training.

### **Include**

* cleaning;  
* duplicate removal;  
* missing-value handling;  
* outlier handling;  
* tokenization;  
* stop-word removal;  
* stemming/lemmatization;  
* feature extraction;  
* normalization;  
* encoding;  
* augmentation.

### **Discussion**

Explain **why each preprocessing step was necessary**.

---

# **3.3.13.3 Machine Learning Model Configuration**

Describe exactly how the model was configured.

### **Include**

* algorithm;  
* architecture;  
* features;  
* target variable;  
* hyperparameters;  
* training configuration;  
* batch size;  
* learning rate;  
* epochs;  
* hardware;  
* software;  
* libraries.

### **Important**

The reader should be able to understand the experimental configuration sufficiently to reproduce the evaluation.

---

# **3.3.13.4 Model Training Results**

Present the model's training behavior.

### **Include**

* training accuracy;  
* training loss;  
* validation accuracy;  
* validation loss;  
* epochs;  
* training time.

### **Recommended Figures**

* Accuracy vs. epoch  
* Loss vs. epoch

### **Discussion**

Look for:

**Overfitting**

Training performance is high while validation performance is substantially lower.

**Underfitting**

Both training and validation performance remain low.

**Good fit**

Training and validation performance are both strong and reasonably close.

Do not simply report the final accuracy. Discuss the **learning behavior of the model**.

---

# **3.3.13.5 Model Testing Results**

Present performance on the **unseen test dataset**.

### **Common Metrics**

#### **Accuracy**

Accuracy=TP+TNTP+TN+FP+FNAccuracy \= \\frac{TP+TN}{TP+TN+FP+FN}

#### **Precision**

Precision=TPTP+FPPrecision \= \\frac{TP}{TP+FP}

#### **Recall**

Recall=TPTP+FNRecall \= \\frac{TP}{TP+FN}

#### **F1-Score**

F1=2(Precision×RecallPrecision+Recall)F1 \= 2\\left(\\frac{Precision\\times Recall}{Precision+Recall}\\right)

Other metrics may include:

* specificity;  
* ROC-AUC;  
* PR-AUC;  
* mean absolute error;  
* mean squared error;  
* RMSE.

### **Discussion**

Explain which metric is most important for the research problem.

For example, in a medical screening or fraud detection system, recall may be particularly important because false negatives can have serious consequences.

---

# **3.3.13.6 Confusion Matrix Analysis**

Present the confusion matrix.

### **Explain**

* True Positive;  
* True Negative;  
* False Positive;  
* False Negative.

### **Discussion**

Identify:

* correctly classified samples;  
* incorrectly classified samples;  
* most commonly confused classes;  
* possible reasons for confusion.

Do not merely insert the confusion matrix image without interpretation.

---

# **3.3.13.7 Class-Level Performance**

Present performance for every class.

### **Include**

* precision;  
* recall;  
* F1-score;  
* support/sample count.

### **Recommended Table**

| Class | Precision | Recall | F1-Score | Support |
| ----- | ----- | ----- | ----- | ----- |
| Class A | 0.92 | 0.89 | 0.90 | 100 |
| Class B | 0.88 | 0.93 | 0.90 | 100 |

### **Discussion**

Identify:

* strongest class;  
* weakest class;  
* possible reasons;  
* dataset characteristics associated with performance.

---

# **3.3.13.8 Cross-Validation Results**

Use this when cross-validation is part of the methodology.

### **Include**

* method;  
* number of folds;  
* score per fold;  
* mean;  
* standard deviation.

### **Discussion**

Explain whether the model is stable across different training/testing partitions.

A small standard deviation generally indicates more consistent performance across folds.

---

# **3.3.13.9 Model Comparison**

Compare the proposed model with:

* baseline model;  
* alternative algorithms;  
* previous versions;  
* established approaches.

### **Recommended Table**

| Model | Accuracy | Precision | Recall | F1 | AUC |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Logistic Regression |  |  |  |  |  |
| Naïve Bayes |  |  |  |  |  |
| Random Forest |  |  |  |  |  |
| Proposed Model |  |  |  |  |  |

### **Discussion**

Answer:

> Which model performed best, and why might it have performed better?

Do not select a model based on accuracy alone when the classes are imbalanced.

---

# **3.3.13.10 Hyperparameter Evaluation**

Present the parameters tested.

### **Include**

* parameter combinations;  
* optimization method;  
* best parameters;  
* resulting performance.

### **Discussion**

Explain how changing the parameters affected performance.

---

# **3.3.13.11 Feature Importance and Model Explainability**

For models where applicable, explain what influenced predictions.

### **Possible Methods**

* feature importance;  
* permutation importance;  
* SHAP;  
* LIME;  
* coefficients;  
* attention visualization.

### **Discussion**

Explain:

> Which features contributed most strongly to prediction?

For AI systems, this section is particularly valuable because high accuracy does not automatically explain **why** a prediction was made.

---

# **3.3.13.12 Error Analysis**

This is one of the most important sections in an AI/ML research paper.

Analyze actual incorrect predictions.

### **Include**

* false positives;  
* false negatives;  
* ambiguous cases;  
* difficult samples;  
* common error patterns;  
* possible causes.

### **Discussion**

Possible causes include:

* insufficient training samples;  
* noisy data;  
* ambiguous labels;  
* class overlap;  
* poor feature representation;  
* dataset bias;  
* unusual inputs.

### **Strong Research Practice**

Select representative misclassified cases and explain **why the model may have failed**.

---

# **3.3.13.13 Robustness and Generalization**

Determine whether the model works beyond the exact training conditions.

### **Evaluate**

* unseen data;  
* external dataset;  
* different input formats;  
* noisy data;  
* incomplete data;  
* different users;  
* different environments.

### **Discussion**

Answer:

> Can the model reasonably generalize beyond the data on which it was trained?

Avoid claiming that a model "generalizes well" merely because the test accuracy is high.

---

# **3.3.13.14 Statistical Validation**

Use statistical analysis when the research question requires determining whether differences are statistically meaningful.

### **Possible Tests**

* paired t-test;  
* independent t-test;  
* ANOVA;  
* Wilcoxon signed-rank test;  
* Mann-Whitney U;  
* McNemar's test;  
* correlation;  
* regression;  
* bootstrap confidence intervals.

### **Report**

* test used;  
* statistic;  
* p-value;  
* confidence interval;  
* effect size;  
* interpretation.

### **Example Interpretation**

> The post-test scores were significantly higher than the pretest scores, indicating a statistically significant improvement after the intervention.

Do not write:

> "The system improved learning because p \< .05."

A statistical significance test supports a claim of difference; it does not automatically establish practical importance or causality.

---

# **3.3.13.15 Comparison with Previous Studies**

Compare the results with credible literature.

### **Compare**

* accuracy;  
* precision;  
* recall;  
* F1;  
* AUC;  
* dataset characteristics;  
* methodology.

### **Discuss**

* similarities;  
* differences;  
* possible explanations;  
* contribution of the present research.

### **Important**

Do not force your results to agree with previous studies.

A different result can be scientifically meaningful if you explain why it may have occurred.

---

# **3.3.13.16 Practical and Application Performance**

Connect the model's technical performance to actual system use.

### **Include**

* prediction time;  
* inference time;  
* hardware requirements;  
* memory requirements;  
* deployment requirements;  
* real-time capability;  
* scalability;  
* practical usefulness.

### **Important Question**

> Is the model not only accurate but also practical for the intended application?

---

# **3.3.13.17 Limitations of Machine Learning Evaluation**

Be transparent about limitations.

### **Include**

* small dataset;  
* class imbalance;  
* biased dataset;  
* limited geographic/domain coverage;  
* labeling problems;  
* insufficient external validation;  
* limited algorithms;  
* limited computational resources;  
* possible AI-generated errors;  
* lack of longitudinal evaluation.

### **Rule**

Limitations should not be hidden. A strong research paper demonstrates awareness of the boundaries of its claims.

---

# **3.3.13.18 Overall Machine Learning Findings**

End the ML section with a synthesis.

### **Answer**

1. How well did the model perform?  
2. Which model performed best?  
3. Which classes were strongest?  
4. Which classes were weakest?  
5. Was the model stable?  
6. What were the major errors?  
7. Was the model sufficiently practical?  
8. What are its major limitations?  
9. What improvements are needed?

### **Recommended Closing**

> Overall, the machine learning evaluation indicates that the proposed model demonstrated \[level of performance\] across the selected evaluation metrics. The model performed particularly well in \[strongest area\], while lower performance was observed in \[weakest area\]. Error analysis showed that \[major error pattern\]. These findings suggest that the model is \[appropriate/partially appropriate\] for the intended application, although improvements in \[dataset/model/features/validation\] are recommended to strengthen its robustness and generalization.

---

# **3.4 Analysis of Data**

This section explains how the collected numerical data were processed.

## **Include**

* frequency;  
* percentage;  
* weighted mean;  
* mean;  
* standard deviation;  
* ranking;  
* statistical tests;  
* correlation, if applicable.

### **Recommended Structure**

| Research Question | Data | Statistical Tool |
| ----- | ----- | ----- |
| Respondent profile | Demographic data | Frequency/Percentage |
| Software quality | Likert ratings | Weighted Mean/SD |
| Acceptability | Likert ratings | Weighted Mean/SD |
| Effectiveness | Pre/Post scores | Paired t-test |
| Relationship | Evaluation/outcome scores | Pearson r |

The statistical treatment should match the research questions and the methodology. For example, a prior E-ARAL research draft uses frequency/percentage, weighted mean and standard deviation, paired-samples t-test, and Pearson correlation for different research questions.

---

# **3.5 Evaluation Criteria**

Explain the interpretation scale used.

### **Example Five-Point Scale**

| Mean Range | Interpretation |
| ----- | ----- |
| 4.21–5.00 | Excellent / Strongly Agree |
| 3.41–4.20 | Very Good / Agree |
| 2.61–3.40 | Good / Neutral |
| 1.81–2.60 | Fair / Disagree |
| 1.00–1.80 | Poor / Strongly Disagree |

**Important:** Use the exact interpretation scale approved in your methodology/instrument. Do not change the verbal interpretation between chapters.

---

# **3.6 Functionality Evaluation**

Present the evaluation of whether the system performs its intended functions.

### **Include**

* functional modules;  
* evaluation criteria;  
* respondent ratings;  
* weighted mean;  
* interpretation;  
* testing evidence.

### **Discussion**

Connect the results with:

* functional requirements;  
* test results;  
* research objectives.

---

# **3.7 ISO/IEC 25010 Software Evaluation Tool**

This section should present the results obtained using the adopted ISO/IEC 25010 questionnaire.

### **Include**

1. quality characteristic;  
2. indicators;  
3. number of items;  
4. respondent group;  
5. mean;  
6. standard deviation;  
7. interpretation;  
8. discussion.

If students and IT experts are separate groups, present their results separately before computing or presenting the appropriate overall result. A previous E-ARAL draft, for example, separates student and technical-expert evaluations.

---

# **3.8 Acceptability Survey / User Acceptance Test**

Evaluate whether intended users are willing and able to accept the system.

## **Possible Areas**

* perceived usefulness;  
* ease of use;  
* satisfaction;  
* intention to use;  
* willingness to recommend;  
* perceived value;  
* accessibility;  
* confidence;  
* overall acceptance.

### **Distinguish**

**Usability:**  
Can users use the system easily?

**Acceptability:**  
Do users accept and intend to use the system?

**Functionality:**  
Does the system perform its required functions?

These are related but are not exactly the same construct.

---

# **3.9 Evaluation of Effectiveness and Impact: Pretest and Posttest**

Use this section when the research measures learning, knowledge, skills, performance, or another outcome before and after system use.

## **Include**

* number of participants;  
* pretest mean;  
* posttest mean;  
* mean difference;  
* standard deviation;  
* statistical test;  
* p-value;  
* effect size, where appropriate;  
* interpretation.

### **Recommended Table**

| Measure | Mean | SD |
| ----- | ----- | ----- |
| Pretest |  |  |
| Posttest |  |  |
| Mean Difference |  |  |

### **Statistical Test**

For paired observations:

**Paired-Samples t-Test**

Report:

* t-value;  
* degrees of freedom;  
* p-value;  
* confidence interval;  
* effect size, if calculated.

### **Discussion**

Do not simply say:

> "The posttest was higher."

Explain:

* how much higher;  
* whether the difference was statistically significant;  
* whether the effect was practically meaningful;  
* what the result suggests about the system;  
* what alternative explanations or limitations remain.

---

# **4.0 Interpretation of Data**

This section should synthesize the major results rather than repeat every table.

## **Answer the Research Questions**

Organize the interpretation according to the **Statement of the Problem / Specific Objectives**.

### **Example**

**Research Question 1:**  
What is the software quality of the system?

**Interpretation:**  
The system obtained an overall rating of \_\_\_, interpreted as \_\_\_.

**Research Question 2:**  
Is there a significant difference between pretest and posttest?

**Interpretation:**  
The posttest mean was higher than the pretest mean by \_\_\_ points, and the statistical test yielded p \= \_\_\_.

**Research Question 3:**  
How effective is the system?

**Interpretation:**  
The results indicate \_\_\_, supported by \_\_\_.

### **Important**

This section should answer:

> **So what do the results mean?**

---

# **CHAPTER 4**

# **SUMMARY OF FINDINGS, CONCLUSIONS, AND RECOMMENDATIONS**

## **Chapter 4 Introduction**

Chapter 4 should be shorter than Chapter 3\.

It should consolidate the most important findings and translate them into conclusions and recommendations.

### **Suggested Introduction**

> This chapter presents the summary of findings, conclusions, implementation plan, and recommendations derived from the results of the study. The findings are organized according to the research objectives and major evaluation areas. The conclusions are based strictly on the evidence obtained from system testing, software quality evaluation, user assessment, and, where applicable, AI/ML and pretest-posttest evaluation. The implementation plan and recommendations identify practical actions for system improvement, deployment, sustainability, and future research.

---

# **4.1 Summary of Findings**

Do not repeat the entire Results and Discussion.

Summarize only the **major findings**.

## **Recommended Organization**

### **Finding 1 – System Development**

State what was successfully developed.

### **Finding 2 – System Testing**

Summarize the major testing results.

### **Finding 3 – Software Quality**

Report the overall ISO/IEC 25010 result.

### **Finding 4 – User Acceptability**

Report the overall acceptance result.

### **Finding 5 – Effectiveness**

Report the pretest/posttest findings.

### **Finding 6 – AI/ML Performance**

If applicable, report:

* best model;  
* accuracy;  
* F1;  
* strongest class;  
* weakest class;  
* major limitation.

### **Rule**

Use **numbers where important**.

Instead of:

> The system performed very well.

Write:

> The system obtained an overall software quality mean of 4.48, interpreted as Excellent.

---

# **4.2 Conclusion**

The conclusion answers:

> **What can reasonably be concluded from the findings?**

## **Good Conclusions Should**

* directly answer the objectives;  
* be based on evidence;  
* be concise;  
* avoid introducing new data;  
* avoid unsupported claims;  
* acknowledge important limitations.

### **Recommended Format**

**Conclusion 1:**  
Based on the system development and functional testing, the study concludes that...

**Conclusion 2:**  
Based on the ISO/IEC 25010 evaluation, the system...

**Conclusion 3:**  
Based on user acceptability results...

**Conclusion 4:**  
Based on the pretest-posttest results...

**Conclusion 5:**  
For AI/ML studies, based on model evaluation...

### **Avoid**

> The system will completely solve the problem.

Better:

> The findings indicate that the system can provide a viable technological approach to addressing the identified problem within the scope and limitations of the study.

---

# **4.2.1 Implementation Plan**

This section translates the research findings into an actionable deployment/improvement plan.

## **Include**

* activity;  
* responsible person/group;  
* timeline;  
* resources;  
* expected output;  
* success indicator.

### **Recommended Table**

| Activity | Responsible Group | Timeline | Resources | Expected Output |
| ----- | ----- | ----- | ----- | ----- |
| System refinement | Development Team | Month 1 | Developer resources | Improved system |
| User training | Project Team | Month 2 | Training materials | Trained users |
| Pilot deployment | Institution | Month 3 | Server/network | Pilot implementation |
| Monitoring | Admin/Research Team | Month 4 onward | Analytics | Performance reports |

### **Important**

The implementation plan should be derived from the actual findings.

For example:

**Finding:** Mobile usability received the lowest rating.

→ **Implementation:** Improve responsive/mobile interface.

**Finding:** AI response time was slow.

→ **Implementation:** Optimize API processing/caching.

**Finding:** ML performance was weak for one class.

→ **Implementation:** Expand representative training data.

---

# **4.2.2 Recommendations**

Recommendations should be **specific, feasible, and evidence-based**.

## **Group Recommendations Into**

### **A. Technical Recommendations**

Examples:

* optimize database queries;  
* improve API handling;  
* strengthen authentication;  
* improve system scalability;  
* optimize AI inference;  
* improve model performance.

### **B. Educational/User Recommendations**

Examples:

* provide user orientation;  
* create tutorials;  
* improve feedback;  
* expand learning content;  
* introduce additional learning activities.

### **C. AI/ML Recommendations**

Examples:

* increase dataset size;  
* improve class balance;  
* collect more diverse samples;  
* evaluate additional algorithms;  
* conduct external validation;  
* improve explainability;  
* conduct robustness testing.

### **D. Deployment Recommendations**

Examples:

* conduct pilot implementation;  
* monitor system usage;  
* establish maintenance procedures;  
* provide administrator training;  
* develop mobile support.

### **E. Future Research**

Examples:

* larger sample;  
* broader population;  
* longer intervention period;  
* additional institutions;  
* longitudinal evaluation;  
* alternative algorithms;  
* external validation.

---

# **IMPORTANT RULES FOR WRITING RESULTS AND DISCUSSION**

## **Rule 1 – Never Invent Results**

Only report data actually obtained from:

* system testing;  
* questionnaires;  
* database testing;  
* API testing;  
* user evaluation;  
* AI/ML experiments;  
* pretest/posttest;  
* statistical analysis.

---

## **Rule 2 – Every Table Must Be Discussed**

Do not insert a table and immediately proceed to the next section.

Use:

**Table → Description → Interpretation → Discussion**

---

## **Rule 3 – Every Figure Must Have a Purpose**

Screenshots should demonstrate:

* system functionality;  
* interface design;  
* workflow;  
* output;  
* results.

Do not include screenshots merely to increase the number of pages.

---

## **Rule 4 – Separate Testing From User Evaluation**

**System Testing**

Determines whether the system works correctly.

**User Evaluation**

Determines how users perceive/evaluate the system.

**ISO/IEC 25010**

Measures selected software quality characteristics.

**Acceptability Testing**

Measures whether users accept the system.

**Pretest/Posttest**

Measures changes in an outcome before and after system exposure.

These should not be treated as interchangeable.

---

# **RULES FOR AI/ML RESEARCH**

For AI/ML projects, the evaluation should not stop at:

> "The model achieved 95% accuracy."

A publishable evaluation should answer:

### **Data**

* What data were used?  
* Where did they come from?  
* How many samples?  
* How many classes?  
* Was the dataset balanced?

### **Model**

* What algorithm was used?  
* What features?  
* What parameters?  
* How was it trained?

### **Performance**

* Accuracy?  
* Precision?  
* Recall?  
* F1?  
* AUC?

### **Errors**

* What did the model get wrong?  
* Why?

### **Generalization**

* Does it perform on unseen data?  
* Was cross-validation performed?  
* Was external validation performed?

### **Comparison**

* Is the model better than a baseline?  
* How does it compare with previous research?

### **Practicality**

* Is prediction fast enough?  
* Can it be deployed?  
* What resources does it require?

This is especially important for AI systems because a high technical score alone does not demonstrate practical usefulness.

---

# **RECOMMENDED FINAL STRUCTURE**

## **CHAPTER 3 – RESULTS AND DISCUSSION**

**Chapter Introduction**

### **3.1 Project Description**

### **3.2 Project Structure**

* System Architecture  
* Site Map  
* GUI/Interface  
* System Workflow

### **3.3 System Test Plan and Results**

* 3.3.1 Testing Scope  
* 3.3.2 Testing Methodology  
* 3.3.3 Hardware and Software Test Environment  
* 3.3.4 Functional Test Cases  
* 3.3.5 Database Testing  
* 3.3.6 API/External Service Testing  
* 3.3.7 Performance Testing  
* 3.3.8 Security Testing  
* 3.3.9 Compatibility Testing  
* 3.3.10 Usability and User Interface Testing  
* 3.3.11 ISO/IEC 25010 Software Quality Evaluation  
* 3.3.12 Testing Results Summary

### **3.3.13 Machine Learning Evaluation Results and Discussion**

* 3.3.13.1 Dataset Description and Distribution  
* 3.3.13.2 Data Preprocessing Results  
* 3.3.13.3 Machine Learning Model Configuration  
* 3.3.13.4 Model Training Results  
* 3.3.13.5 Model Testing Results  
* 3.3.13.6 Confusion Matrix Analysis  
* 3.3.13.7 Class-Level Performance  
* 3.3.13.8 Cross-Validation Results  
* 3.3.13.9 Model Comparison  
* 3.3.13.10 Hyperparameter Evaluation  
* 3.3.13.11 Feature Importance and Model Explainability  
* 3.3.13.12 Error Analysis  
* 3.3.13.13 Robustness and Generalization  
* 3.3.13.14 Statistical Validation  
* 3.3.13.15 Comparison with Previous Studies  
* 3.3.13.16 Practical and Application Performance  
* 3.3.13.17 Limitations of ML Evaluation  
* 3.3.13.18 Overall ML Findings

### **3.4 Analysis of Data**

### **3.5 Evaluation Criteria**

### **3.6 Functionality Evaluation**

### **3.7 ISO/IEC 25010 Software Evaluation**

### **3.8 Acceptability Survey / User Acceptance Test**

### **3.9 Evaluation of Effectiveness and Impact**

* Pretest  
* Posttest  
* Statistical Test  
* Effect Size, if applicable

### **3.10 Interpretation of Data**

---

# **CHAPTER 4 – SUMMARY OF FINDINGS, CONCLUSIONS, AND RECOMMENDATIONS**

**Chapter Introduction**

### **4.1 Summary of Findings**

### **4.2 Conclusion**

### **4.2.1 Implementation Plan**

### **4.2.2 Recommendations**

---

# **FINAL QUALITY-CHECKLIST**

Before submitting Chapter 3, verify:

☐ Every research objective has corresponding results.  
☐ Every research question has been answered.  
☐ Every table has a discussion.  
☐ Every figure/screenshot has a purpose.  
☐ Testing results contain actual evidence.  
☐ Pass/fail criteria are clearly defined.  
☐ Statistical tests match the research design.  
☐ ISO/IEC 25010 results have clear interpretations.  
☐ User acceptance is distinguished from usability.  
☐ Pretest/posttest results include appropriate statistical analysis.  
☐ AI/ML results include more than accuracy.  
☐ Confusion matrices are interpreted.  
☐ Class-level performance is discussed.  
☐ Error analysis is included for ML projects.  
☐ Model limitations are acknowledged.  
☐ Results are compared with relevant literature.  
☐ No unsupported claims are made.  
☐ No results are fabricated or estimated.  
☐ All numerical values are consistent throughout the thesis.

Before submitting Chapter 4, verify:

☐ Findings are directly based on Chapter 3\.  
☐ Conclusions answer the objectives.  
☐ No new results are introduced.  
☐ Implementation recommendations are based on findings.  
☐ Recommendations are specific and actionable.  
☐ Technical, educational, deployment, and future research recommendations are distinguished.  
☐ Claims do not exceed the evidence of the study.

## **Golden Rule**

**Chapter 3 should prove what happened.**  
**Chapter 3 Discussion should explain why it happened and what it means.**  
**Chapter 4 should state what can be concluded from it and what should happen next.**

A strong IT/CS research paper therefore follows:

**Objective → Test/Evaluation → Result → Statistical Evidence → Interpretation → Discussion → Conclusion → Recommendation.**

