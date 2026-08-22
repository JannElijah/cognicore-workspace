import sqlite3
import os
import math
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime

# Enable clean styling for matplotlib
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 0.8

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cognicore.db')
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'thesis_plots')
REPORT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chapter_4_report.md')

os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def calculate_cohens_d(diffs):
    n = len(diffs)
    if n < 2:
        return 0.0, 0.0
    mean_diff = sum(diffs) / n
    var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (n - 1)
    sd_diff = math.sqrt(var_diff)
    cohens_d = mean_diff / sd_diff if sd_diff > 0 else 0.0
    return cohens_d, sd_diff

def run_paired_t_test(pretest, posttest):
    n = len(pretest)
    diffs = [post - pre for pre, post in zip(pretest, posttest)]
    mean_diff = sum(diffs) / n
    
    cohens_d, sd_diff = calculate_cohens_d(diffs)
    
    # Paired t-test t-statistic
    se_diff = sd_diff / math.sqrt(n) if n > 0 else 0.0
    t_stat = mean_diff / se_diff if se_diff > 0 else 0.0
    
    # Calculate exact p-value using scipy.stats if available, else standard fallback
    p_value = 1.0
    try:
        from scipy import stats
        t_val, p_val = stats.ttest_rel(posttest, pretest)
        t_stat = float(t_val)
        p_value = float(p_val)
    except Exception:
        # Fallback approximation for p-value (df = n - 1)
        # Standard Normal CDF approximation for high n
        z = abs(t_stat)
        t_approx = 1 / (1 + 0.2316419 * z)
        d_val = 0.3989423 * (2.7182818 ** (-z * z / 2))
        prob = d_val * t_approx * (0.3193815 + t_approx * (-0.3565638 + t_approx * (1.7814779 + t_approx * (-1.821256 + t_approx * 1.330274))))
        p_value = 2.0 * prob
        p_value = max(0.0, min(1.0, p_value))
        
    return t_stat, p_value, cohens_d, mean_diff, sd_diff

def calculate_pearson_r(x, y):
    n = len(x)
    if n <= 1:
        return 0.0, 1.0
    
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    
    num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    den_x = sum((xi - mean_x) ** 2 for xi in x)
    den_y = sum((yi - mean_y) ** 2 for yi in y)
    
    den = math.sqrt(den_x * den_y)
    if den == 0:
        return 0.0, 1.0
        
    r = num / den
    
    # Calculate p-value
    p_value = 1.0
    try:
        from scipy import stats
        r_val, p_val = stats.pearsonr(x, y)
        r = float(r_val)
        p_value = float(p_val)
    except Exception:
        df = n - 2
        if df > 0 and abs(r) < 1.0:
            t = r * math.sqrt(df / (1 - r * r))
            z = abs(t)
            t_approx = 1 / (1 + 0.2316419 * z)
            d_val = 0.3989423 * (2.7182818 ** (-z * z / 2))
            prob = d_val * t_approx * (0.3193815 + t_approx * (-0.3565638 + t_approx * (1.7814779 + t_approx * (-1.821256 + t_approx * 1.330274))))
            p_value = 2.0 * prob
            p_value = max(0.0, min(1.0, p_value))
            
    return r, p_value

def generate_reports():
    print("Connecting to database and running statistical queries...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # ==========================================
    # 1. PRETEST VS POSTTEST DATA EXTRACTION
    # ==========================================
    cursor.execute("SELECT id, username FROM users WHERE username LIKE 'clinical_subject_%' ORDER BY username ASC")
    users = cursor.fetchall()
    
    pre_acc_list = []
    post_acc_list = []
    pre_rt_list = []
    post_rt_list = []
    
    for u in users:
        uid = u[0]
        # Query metrics ordered chronologically
        cursor.execute(
            """
            SELECT pm.accuracy_rate, pm.reaction_time
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            WHERE gs.user_id = ?
            ORDER BY gs.start_time ASC, pm.id ASC
            """,
            (uid,)
        )
        metrics = cursor.fetchall()
        
        accs = [m[0] for m in metrics]
        rts = [m[1] for m in metrics]
        
        if len(accs) >= 10:
            pre_acc_list.append(sum(accs[:5]) / 5.0 * 100)
            post_acc_list.append(sum(accs[-5:]) / 5.0 * 100)
            pre_rt_list.append(sum(rts[:5]) / 5.0)
            post_rt_list.append(sum(rts[-5:]) / 5.0)
        elif len(accs) > 0:
            pre_acc_list.append(accs[0] * 100)
            post_acc_list.append(accs[-1] * 100)
            pre_rt_list.append(rts[0])
            post_rt_list.append(rts[-1])

    n_subjects = len(pre_acc_list)
    if n_subjects < 2:
        print("Error: Clinical cohort has insufficient data. Please seed data first.")
        conn.close()
        return
        
    # Run tests
    t_acc, p_acc, d_acc, diff_acc, sd_acc = run_paired_t_test(pre_acc_list, post_acc_list)
    t_rt, p_rt, d_rt, diff_rt, sd_rt = run_paired_t_test(pre_rt_list, post_rt_list)
    
    # For reaction time, we want faster speeds (meaning posttest < pretest is positive improvement)
    # Cohen's d represents (Post - Pre) / SD. So a negative value represents latency speedups.
    # Let's adjust representation or output direction:
    rt_speedup_diffs = [pre - post for pre, post in zip(pre_rt_list, post_rt_list)]
    t_rt_speed, p_rt_speed, d_rt_speed, mean_rt_speed, sd_rt_speed = run_paired_t_test(post_rt_list, pre_rt_list)
    
    # ==========================================
    # 2. MICRO-BEHAVIORAL CORRELATIONS
    # ==========================================
    # Query 1: rule_shift_latency_ms vs spam_click_count (MentalFlex game metrics)
    cursor.execute(
        """
        SELECT rule_shift_latency_ms, spam_click_count 
        FROM performance_metrics 
        WHERE game_type = 'MentalFlex' 
          AND rule_shift_latency_ms IS NOT NULL 
          AND spam_click_count IS NOT NULL
        """
    )
    flex_metrics = cursor.fetchall()
    flex_latencies = [m[0] for m in flex_metrics]
    flex_spams = [m[1] for m in flex_metrics]
    
    r_flex, p_flex = calculate_pearson_r(flex_latencies, flex_spams)
    
    # Query 2: reaction_time vs hesitation_ms
    cursor.execute(
        """
        SELECT reaction_time, hesitation_ms 
        FROM performance_metrics 
        WHERE hesitation_ms IS NOT NULL 
          AND hesitation_ms > 0
          AND reaction_time IS NOT NULL
        """
    )
    general_metrics = cursor.fetchall()
    g_rts = [m[0] for m in general_metrics]
    g_hesitations = [m[1] for m in general_metrics]
    
    r_hes, p_hes = calculate_pearson_r(g_hesitations, g_rts)
    
    # ==========================================
    # 3. COGNITIVE ARCHETYPE DISTRIBUTION
    # ==========================================
    cursor.execute(
        """
        SELECT archetype_name, COUNT(*) as cnt
        FROM cognitive_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE u.username LIKE 'clinical_subject_%'
        GROUP BY archetype_name
        """
    )
    archetypes = cursor.fetchall()
    arch_counts = {r[0]: r[1] for r in archetypes}
    
    # Ensure all archetypes exist in count map
    for arch in ["Beginner", "Standard", "Intermediate", "Advanced"]:
        if arch not in arch_counts:
            arch_counts[arch] = 0

    # ==========================================
    # 4. PLOTTING FIGURES
    # ==========================================
    print("Generating figures...")
    
    # Figure 1: Pretest vs Posttest bar charts
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 5))
    
    # Accuracy chart
    mean_pre_acc = np.mean(pre_acc_list)
    mean_post_acc = np.mean(post_acc_list)
    sem_pre_acc = np.std(pre_acc_list, ddof=1) / math.sqrt(n_subjects)
    sem_post_acc = np.std(post_acc_list, ddof=1) / math.sqrt(n_subjects)
    
    ax1.bar(['Pre-intervention', 'Post-intervention'], [mean_pre_acc, mean_post_acc], 
            yerr=[sem_pre_acc, sem_post_acc], capsize=6, color=['#f43f5e', '#10b981'], edgecolor='#ffffff', alpha=0.9, width=0.5)
    ax1.set_ylabel('Accuracy Rate (%)', fontweight='bold')
    ax1.set_ylim(0, 105)
    ax1.set_title('Empirical Accuracy Improvement\n(Mean ± SEM)', pad=12, fontweight='bold', fontsize=11)
    for index, val in enumerate([mean_pre_acc, mean_post_acc]):
        ax1.text(index, val + 2, f"{val:.1f}%", ha='center', fontweight='bold')
        
    # Latency chart
    mean_pre_rt = np.mean(pre_rt_list)
    mean_post_rt = np.mean(post_rt_list)
    sem_pre_rt = np.std(pre_rt_list, ddof=1) / math.sqrt(n_subjects)
    sem_post_rt = np.std(post_rt_list, ddof=1) / math.sqrt(n_subjects)
    
    ax2.bar(['Pre-intervention', 'Post-intervention'], [mean_pre_rt, mean_post_rt], 
            yerr=[sem_pre_rt, sem_post_rt], capsize=6, color=['#f43f5e', '#38bdf8'], edgecolor='#ffffff', alpha=0.9, width=0.5)
    ax2.set_ylabel('Reaction Time Latency (ms)', fontweight='bold')
    ax2.set_ylim(0, max(mean_pre_rt, mean_post_rt) * 1.3)
    ax2.set_title('Cognitive Processing Speedup\n(Mean ± SEM)', pad=12, fontweight='bold', fontsize=11)
    for index, val in enumerate([mean_pre_rt, mean_post_rt]):
        ax2.text(index, val + (max(mean_pre_rt, mean_post_rt) * 0.03), f"{val:.1f} ms", ha='center', fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'pretest_posttest_comparison.png'), dpi=300)
    plt.close()
    
    # Figure 2: Behavioral Correlation (rule_shift_latency_ms vs spam_click_count)
    if len(flex_latencies) > 2:
        plt.figure(figsize=(7, 5))
        plt.scatter(flex_latencies, flex_spams, color='#38bdf8', alpha=0.6, edgecolors='none', s=40, label='Telemetry Data Point')
        
        # Fit linear regression line
        m, c = np.polyfit(flex_latencies, flex_spams, 1)
        x_line = np.linspace(min(flex_latencies), max(flex_latencies), 100)
        plt.plot(x_line, m * x_line + c, color='#a855f7', linewidth=2, linestyle='--', label=f'OLS Fit (r = {r_flex:.3f})')
        
        plt.xlabel('Rule-Shift Latency (ms)', fontweight='bold')
        plt.ylabel('Kinetic Friction (Spam Click Count)', fontweight='bold')
        plt.title(f'Micro-behavioral Friction Analysis\nCognitive Set-Shifting Delay vs Impulsive Friction (n = {len(flex_latencies)})', pad=12, fontweight='bold', fontsize=11)
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, 'behavioral_correlation.png'), dpi=300)
        plt.close()
        
    # Figure 3: Learning Curves (Active User vs Clinical Cohort vs General Cohort)
    # Get active user curves
    cursor.execute(
        """
        SELECT gs.id, AVG(pm.accuracy_rate) as avg_acc
        FROM game_sessions gs
        JOIN performance_metrics pm ON pm.session_id = gs.id
        WHERE gs.user_id = (SELECT id FROM users WHERE username = 'player_one')
        GROUP BY gs.id
        ORDER BY gs.start_time ASC
        """
    )
    active_rows = cursor.fetchall()
    active_curve = [r[1] * 100 for r in active_rows]
    
    # Get all subjects grouped by session index
    cursor.execute(
        """
        SELECT gs.user_id, gs.id, AVG(pm.accuracy_rate) as avg_acc
        FROM game_sessions gs
        JOIN performance_metrics pm ON pm.session_id = gs.id
        GROUP BY gs.user_id, gs.id
        ORDER BY gs.user_id, gs.start_time ASC
        """
    )
    all_sessions_rows = cursor.fetchall()
    
    user_curves = {}
    clinical_curves = {}
    for user_id, session_id, avg_acc in all_sessions_rows:
        if user_id not in user_curves:
            user_curves[user_id] = []
        user_curves[user_id].append(avg_acc * 100)
        
        # clinical filter
        cursor.execute("SELECT username FROM users WHERE id = ?", (user_id,))
        username = cursor.fetchone()[0]
        if username.startswith('clinical_subject_'):
            if user_id not in clinical_curves:
                clinical_curves[user_id] = []
            clinical_curves[user_id].append(avg_acc * 100)
            
    # Compute cohort averages by session index
    max_len = max(len(c) for c in user_curves.values()) if user_curves else 0
    clinical_len = max(len(c) for c in clinical_curves.values()) if clinical_curves else 0
    
    all_cohort_avg = []
    for idx in range(max_len):
        vals = [c[idx] for c in user_curves.values() if len(c) > idx]
        all_cohort_avg.append(np.mean(vals))
        
    clinical_cohort_avg = []
    for idx in range(clinical_len):
        vals = [c[idx] for c in clinical_curves.values() if len(c) > idx]
        clinical_cohort_avg.append(np.mean(vals))
        
    plt.figure(figsize=(8, 5))
    if active_curve:
        plt.plot(range(1, len(active_curve) + 1), active_curve, marker='o', color='#38bdf8', linewidth=2.5, label='Active User (player_one)')
    plt.plot(range(1, len(clinical_cohort_avg) + 1), clinical_cohort_avg, marker='s', linestyle='--', color='#10b981', linewidth=2, label='Clinical Cohort (Avg)')
    plt.plot(range(1, len(all_cohort_avg) + 1), all_cohort_avg, marker='x', linestyle=':', color='#f59e0b', linewidth=2, label='All Cohorts (Avg)')
    
    plt.xlabel('Session Training Index', fontweight='bold')
    plt.ylabel('Mean Accuracy Rate (%)', fontweight='bold')
    plt.title('Longitudinal Cognitive Training Curve Comparisons', pad=12, fontweight='bold', fontsize=11)
    plt.ylim(30, 105)
    plt.xticks(range(1, max(max_len, len(active_curve)) + 1))
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'learning_curves.png'), dpi=300)
    plt.close()
    
    # Figure 4: Archetype Distribution among Clinical Cohort
    plt.figure(figsize=(7, 5))
    archs = list(arch_counts.keys())
    counts = list(arch_counts.values())
    colors = ['#f87171', '#38bdf8', '#c084fc', '#4ade80'] # Beginner, Standard, Intermediate, Advanced
    
    bars = plt.bar(archs, counts, color=colors, edgecolor='#ffffff', alpha=0.9, width=0.5)
    plt.ylabel('Subject Count', fontweight='bold')
    plt.xlabel('Cognitive Archetype Profile', fontweight='bold')
    plt.title('Clinical Cohort Archetype Profile Distribution\n(Post-Intervention Classified Archetypes)', pad=12, fontweight='bold', fontsize=11)
    plt.ylim(0, max(counts) + 4)
    
    # Print labels on top of bars
    total_clinical = sum(counts)
    for bar in bars:
        height = bar.get_height()
        pct = (height / total_clinical * 100) if total_clinical > 0 else 0
        plt.text(bar.get_x() + bar.get_width()/2.0, height + 0.3, f"{height} ({pct:.1f}%)", ha='center', fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'cognitive_archetypes_dist.png'), dpi=300)
    plt.close()
    
    # ==========================================
    # 5. WRITE MARKDOWN REPORT (LaTeX Copyable)
    # ==========================================
    print("Writing chapter_4_report.md...")
    with open(REPORT_PATH, 'w') as f:
        f.write("# Chapter 4 Statistical Verification Report\n\n")
        f.write(f"*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n")
        
        f.write("This report provides automated statistical evaluations matching Chapter 4 manuscript requirements. ")
        f.write("A Paired t-test is applied over the 30 clinical cohort subjects to verify cognitive improvement, ")
        f.write("along with micro-behavioral Pearson correlation coefficients.\n\n")
        
        f.write("## 1. Pretest-Posttest Empirical Performance Analysis (Pillar 1)\n\n")
        f.write("Below is the Paired t-test summary comparing pre-intervention baselines against post-intervention training sessions:\n\n")
        
        f.write("| Performance Metric | Sample Size (N) | Pretest Mean (SD) | Posttest Mean (SD) | Mean Difference | t-Statistic | p-value | Cohen's d | Effect Magnitude |\n")
        f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n")
        
        # Accuracy row
        pre_acc_sd = np.std(pre_acc_list, ddof=1)
        post_acc_sd = np.std(post_acc_list, ddof=1)
        mag_acc = "large" if abs(d_acc) >= 0.8 else "medium" if abs(d_acc) >= 0.5 else "small" if abs(d_acc) >= 0.2 else "negligible"
        f.write(f"| **Accuracy Rate (%)** | {n_subjects} | {mean_pre_acc:.2f}% ({pre_acc_sd:.2f}) | {mean_post_acc:.2f}% ({post_acc_sd:.2f}) | {diff_acc:+.2f}% | {t_acc:.4f} | {p_acc:.6f} | {d_acc:.4f} | {mag_acc.upper()} |\n")
        
        # Latency row
        pre_rt_sd = np.std(pre_rt_list, ddof=1)
        post_rt_sd = np.std(post_rt_list, ddof=1)
        mag_rt = "large" if abs(d_rt_speed) >= 0.8 else "medium" if abs(d_rt_speed) >= 0.5 else "small" if abs(d_rt_speed) >= 0.2 else "negligible"
        f.write(f"| **Reaction Time (ms)** | {n_subjects} | {mean_pre_rt:.2f} ms ({pre_rt_sd:.2f}) | {mean_post_rt:.2f} ms ({post_rt_sd:.2f}) | {-diff_rt:+.2f} ms | {t_rt_speed:.4f} | {p_rt_speed:.6f} | {d_rt_speed:.4f} | {mag_rt.upper()} |\n\n")
        
        f.write("> **Interpretation:** ")
        if p_acc < 0.05:
            f.write(f"A statistically significant accuracy improvement is detected ($t({n_subjects-1}) = {t_acc:.3f}$, $p < 0.05$) with a **{mag_acc}** effect size ($d = {d_acc:.3f}$). ")
        else:
            f.write("No statistically significant accuracy improvement detected at the $\\alpha=0.05$ level. ")
            
        if p_rt_speed < 0.05:
            f.write(f"Similarly, a statistically significant processing latency speedup is observed ($t({n_subjects-1}) = {t_rt_speed:.3f}$, $p < 0.05$) with a **{mag_rt}** effect size ($d = {d_rt_speed:.3f}$).")
        else:
            f.write("No statistically significant processing speedup detected.")
        f.write("\n\n")
        
        f.write("## 2. Micro-Behavioral Telemetry Correlation Matrix (Pillar 2)\n\n")
        f.write("Pearson correlation analysis of micro-behavioral metrics captured during game executions:\n\n")
        
        f.write("| Variable 1 (X) | Variable 2 (Y) | Correlation Coefficient ($r$) | Coefficient of Determination ($R^2$) | p-value | Significance | Interpretation |\n")
        f.write("| :--- | :--- | :---: | :---: | :---: | :---: | :--- |\n")
        
        # Rule shift vs spam
        sig_flex = "Significant (p < 0.05)" if p_flex < 0.05 else "Not Significant"
        mag_flex = "strong" if abs(r_flex) >= 0.7 else "moderate" if abs(r_flex) >= 0.4 else "weak" if abs(r_flex) >= 0.1 else "negligible"
        dir_flex = "positive" if r_flex >= 0 else "negative"
        f.write(f"| Rule-Shift Latency | Spam Click Count | {r_flex:.4f} | {r_flex**2:.4f} | {p_flex:.6e} | {sig_flex} | There is a {mag_flex} {dir_flex} correlation. |\n")
        
        # Hesitation vs RT
        sig_hes = "Significant (p < 0.05)" if p_hes < 0.05 else "Not Significant"
        mag_hes = "strong" if abs(r_hes) >= 0.7 else "moderate" if abs(r_hes) >= 0.4 else "weak" if abs(r_hes) >= 0.1 else "negligible"
        dir_hes = "positive" if r_hes >= 0 else "negative"
        f.write(f"| Hesitation (ms) | Reaction Time (ms) | {r_hes:.4f} | {r_hes**2:.4f} | {p_hes:.6e} | {sig_hes} | There is a {mag_hes} {dir_hes} correlation. |\n\n")
        
        f.write("## 3. Generated Chapter 4 Figures\n\n")
        f.write("The following figures have been rendered to `server/thesis_plots/` for manuscript insertion:\n\n")
        f.write("### Figure 1: Clinical Cohort Pre- vs Post-Intervention Improvement\n")
        f.write("![Pretest vs Posttest Scores Comparison](thesis_plots/pretest_posttest_comparison.png)\n\n")
        f.write("### Figure 2: Micro-behavioral Friction Scatter Plot\n")
        f.write("![Behavioral Metric Correlation](thesis_plots/behavioral_correlation.png)\n\n")
        f.write("### Figure 3: Longitudinal Learning Curves\n")
        f.write("![Longitudinal Learning Curves Comparison](thesis_plots/learning_curves.png)\n\n")
        f.write("### Figure 4: Classified Cognitive Archetype Distributions\n")
        f.write("![Classified Archetype Distribution](thesis_plots/cognitive_archetypes_dist.png)\n")
        
    print("All reports and visualizations generated successfully.")
    conn.close()

if __name__ == '__main__':
    generate_reports()
