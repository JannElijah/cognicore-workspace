import json
import statistics

def generate_post_test_ai_feedback(pre_scores, post_scores, post_metadata=None):
    """
    Deterministically generates a clinical, highly analytical AI-like feedback string
    by comparing pre_test and post_test scores and analyzing micro-behavioral data
    (hesitation variance, reaction time slopes, metacognitive accuracy).
    """
    
    improvements = []
    degradations = []
    
    domains = {
        'spatial_visual_memory': 'Spatial-Visual Memory',
        'logical_mathematical': 'Logical-Mathematical Computation',
        'reflexes_and_focus': 'Reflexes & Attentional Focus',
        'executive_strategy': 'Executive Strategy & Planning'
    }
    
    for key, label in domains.items():
        pre = pre_scores.get(key, 0)
        post = post_scores.get(key, 0)
        delta = post - pre
        
        if delta > 0:
            improvements.append((label, delta))
        elif delta < 0:
            degradations.append((label, abs(delta)))
            
    # Sort by highest delta
    improvements.sort(key=lambda x: x[1], reverse=True)
    degradations.sort(key=lambda x: x[1], reverse=True)
    
    feedback = "### 🧠 Micro-Behavioral & Cognitive Profile Analysis\n\n"
    
    # --- MICRO-BEHAVIORAL TELEMETRY ANALYSIS ---
    rt_analysis = ""
    conf_analysis = ""
    slope_analysis = ""
    
    if post_metadata and isinstance(post_metadata, dict):
        rts = []
        confidences = []
        correctness = []
        
        # Sort metadata by question number (assuming keys like 'q1', 'q2', ... 'q12')
        # We need a stable sort to calculate temporal slopes
        try:
            sorted_items = sorted(post_metadata.items(), key=lambda x: int(x[0].replace('q', '')))
        except ValueError:
            sorted_items = list(post_metadata.items())
            
        for q_id, q_data in sorted_items:
            if isinstance(q_data, dict):
                rts.append(q_data.get('rt', 0))
                confidences.append(q_data.get('confidence', 3))
                correctness.append(q_data.get('isCorrect', False))
                
        valid_q = len(rts)
        
        if valid_q > 2:
            avg_rt = statistics.mean(rts)
            rt_variance = statistics.pstdev(rts) if valid_q > 1 else 0
            avg_conf = statistics.mean(confidences)
            
            # 1. Hesitation Analysis (Variance in Reaction Time)
            if rt_variance > 15000:
                rt_analysis = "High micro-hesitation variance detected. The subject exhibits significant temporal instability, rapidly answering some queries while stalling heavily on others, suggesting uneven neural pathway myelination. "
            elif rt_variance < 5000:
                rt_analysis = "Exceptional pacing consistency. Reaction times demonstrate low deviation, indicating a highly stabilized, rhythmic cognitive processing baseline. "
            else:
                if avg_rt < 8000:
                    rt_analysis = "Rapid, stable cognitive fluid-dynamics observed. Latency is consistently low across all tasks. "
                elif avg_rt > 20000:
                    rt_analysis = "Processing is uniformly deliberate. The subject applies a high-latency, computationally heavy approach universally. "

            # 2. Reaction Time Slope (Warm-up vs Fatigue)
            first_half_rt = statistics.mean(rts[:valid_q//2])
            second_half_rt = statistics.mean(rts[valid_q//2:])
            rt_slope = second_half_rt - first_half_rt
            
            if rt_slope > 8000:
                slope_analysis = "Severe cognitive fatigue onset. Reaction times spiked dramatically in the latter half of the assessment, indicating a rapid depletion of executive working memory reserves.\n\n"
            elif rt_slope < -5000:
                slope_analysis = "Neurological 'warm-up' effect. Processing speed accelerated significantly as the test progressed, suggesting the subject requires an extended ramp-up period to achieve flow state.\n\n"
            else:
                slope_analysis = "Endurance is stable. The subject maintained uniform velocity throughout the assessment without succumbing to temporal fatigue.\n\n"

            # 3. Metacognitive Accuracy (Confidence vs Correctness)
            correct_confs = [c for c, is_corr in zip(confidences, correctness) if is_corr]
            incorrect_confs = [c for c, is_corr in zip(confidences, correctness) if not is_corr]
            
            avg_correct_conf = statistics.mean(correct_confs) if correct_confs else 0
            avg_incorrect_conf = statistics.mean(incorrect_confs) if incorrect_confs else 0
            
            if avg_incorrect_conf > 4.0 and avg_incorrect_conf >= avg_correct_conf:
                conf_analysis = "Dunning-Kruger spike detected: The subject expressed maximum certainty during failed responses. Metacognitive calibration is severely misaligned with actual output accuracy. "
            elif avg_correct_conf >= 4.0 and avg_incorrect_conf <= 2.5:
                conf_analysis = "Hyper-calibrated metacognition. The subject perfectly correlates their internal certainty with objective correctness, predicting their own failures and successes with granular accuracy. "
            elif avg_conf <= 2.5 and sum(correctness)/valid_q >= 0.75:
                conf_analysis = "Imposter-syndrome signature: High objective accuracy paired with systemic self-doubt. The subject distrusts their own highly functional cognitive outputs. "
            else:
                conf_analysis = "Metacognitive calibration is within standard operational parameters. "

    # --- ASSEMBLE PARAGRAPHS ---
    
    if improvements:
        feedback += "**Significant Advancements:**\n"
        feedback += "Post-test telemetry reveals robust neural plasticity. "
        for label, delta in improvements:
            feedback += f"The subject demonstrated a massive **+{delta:.1f}% surge** in {label}. "
        feedback += "This indicates that the prescribed neuro-stimulation protocols successfully strengthened localized cortical pathways.\n\n"
    else:
        feedback += "**Significant Advancements:**\n"
        feedback += "No statistically significant improvements detected across primary domains. Continued rigorous neuro-training is required to break through the current neural plateau.\n\n"
        
    if degradations:
        feedback += "**Cognitive Fatigue & Attrition:**\n"
        for label, delta in degradations:
            feedback += f"A measurable regression of **-{delta:.1f}%** was observed in {label}. "
        feedback += "This suggests that high-load cognitive training in other domains temporarily depleted resources required for these specific tasks.\n\n"
        
    if rt_analysis or conf_analysis or slope_analysis:
        feedback += "**Metacognition & Micro-Behavioral Latency:**\n"
        feedback += f"{rt_analysis}{conf_analysis}\n{slope_analysis}"
        
    # Final Verdict
    feedback += "**Final Verdict:**\n"
    if improvements and not degradations:
        feedback += "Optimal response to training. The subject exhibits extraordinary adaptive capacity and stable neural elasticity."
    elif improvements and degradations:
        feedback += "Mixed response. The subject is successfully rewiring targeted pathways but is experiencing collateral cognitive resource drain."
    else:
        feedback += "Sub-optimal response. Recommend pivoting to alternative stimulation therapies."
        
    return feedback
