import json

def generate_post_test_ai_feedback(pre_scores, post_scores, post_metadata=None):
    """
    Deterministically generates a clinical, highly analytical AI-like feedback string
    by comparing pre_test and post_test scores and analyzing reaction times.
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
    
    # 1. Base Introduction
    feedback = "### 🧠 Cognitive Profile Delta Analysis\n\n"
    
    # Analyze RT and Confidence if available
    rt_analysis = ""
    conf_analysis = ""
    if post_metadata and isinstance(post_metadata, dict):
        total_rt = 0
        total_conf = 0
        valid_q = 0
        for q_id, q_data in post_metadata.items():
            if isinstance(q_data, dict):
                total_rt += q_data.get('rt', 0)
                total_conf += q_data.get('confidence', 3)
                valid_q += 1
                
        if valid_q > 0:
            avg_rt = total_rt / valid_q
            avg_conf = total_conf / valid_q
            
            if avg_rt < 10000:
                rt_analysis = "Reaction times were notably rapid, suggesting enhanced cognitive fluidity and lower latency in neural retrieval patterns. "
            elif avg_rt > 20000:
                rt_analysis = "Reaction times were deliberate and methodical, indicating high computational overhead during complex problem-solving phases. "
                
            if avg_conf >= 4.0:
                conf_analysis = "Metacognitive calibration is excellent; the subject demonstrates high self-awareness and accurately trusts their cognitive outputs."
            elif avg_conf <= 2.5:
                conf_analysis = "Metacognitive calibration is low; the subject exhibits systemic self-doubt despite objective performance metrics."

    # 2. Improvement Paragraph
    if improvements:
        feedback += "**Significant Advancements:**\n"
        feedback += "Post-test telemetry reveals robust neural plasticity. "
        for label, delta in improvements:
            feedback += f"The subject demonstrated a massive **+{delta:.1f}% surge** in {label}. "
        feedback += "This indicates that the prescribed neuro-stimulation protocols successfully strengthened localized cortical pathways.\n\n"
    else:
        feedback += "**Significant Advancements:**\n"
        feedback += "The subject did not demonstrate statistically significant improvements across the primary cognitive domains. Continued rigorous neuro-training is required to break through the current neural plateau.\n\n"
        
    # 3. Degradation Paragraph
    if degradations:
        feedback += "**Cognitive Fatigue & Attrition:**\n"
        feedback += "Conversely, signs of cognitive fatigue were detected. "
        for label, delta in degradations:
            feedback += f"A measurable regression of **-{delta:.1f}%** was observed in {label}. "
        feedback += "This suggests that high-load cognitive training in other domains may have temporarily depleted resources required for these specific tasks.\n\n"
        
    # 4. Telemetry Paragraph
    if rt_analysis or conf_analysis:
        feedback += "**Metacognition & Processing Latency:**\n"
        feedback += f"{rt_analysis}{conf_analysis}\n\n"
        
    # 5. Conclusion
    feedback += "**Final Verdict:**\n"
    if improvements and not degradations:
        feedback += "Optimal response to training. The subject exhibits extraordinary adaptive capacity."
    elif improvements and degradations:
        feedback += "Mixed response. The subject is successfully rewiring targeted pathways but is experiencing collateral cognitive fatigue."
    else:
        feedback += "Sub-optimal response. Recommend pivoting to alternative stimulation therapies."
        
    return feedback
