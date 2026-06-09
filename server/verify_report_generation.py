import os
import sys
import sqlite3
import subprocess

def test_report_generation():
    print("=== Step 1: Running generate_thesis_reports.py script ===")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    report_script_path = os.path.join(script_dir, "generate_thesis_reports.py")
    try:
        res = subprocess.run([sys.executable, report_script_path], cwd=script_dir, capture_output=True, text=True, check=True)
        print("Script stdout:")
        print(res.stdout)
    except subprocess.CalledProcessError as e:
        print("FAILED: Script raised process error")
        print("stderr:")
        print(e.stderr)
        sys.exit(1)
        
    print("\n=== Step 2: Verifying Output File Assets ===")
    
    plots_dir = os.path.join(script_dir, "thesis_plots")
    report_file = os.path.join(script_dir, "chapter_4_report.md")
    
    expected_files = [
        report_file,
        os.path.join(plots_dir, "pretest_posttest_comparison.png"),
        os.path.join(plots_dir, "behavioral_correlation.png"),
        os.path.join(plots_dir, "learning_curves.png"),
        os.path.join(plots_dir, "cognitive_archetypes_dist.png")
    ]
    
    for f in expected_files:
        if not os.path.exists(f):
            print(f"FAILED: Expected output asset not found: {f}")
            sys.exit(1)
        else:
            size = os.path.getsize(f)
            print(f"  OK   Found: {f} ({size} bytes)")
            
    print("\n=== Step 3: Verifying Report Content Parsing ===")
    with open(report_file, 'r') as f:
        content = f.read()
        
    required_keywords = [
        "Pretest-Posttest Empirical Performance Analysis",
        "Micro-Behavioral Telemetry Correlation Matrix",
        "t-Statistic",
        "p-value",
        "Cohen's d",
        "Accuracy Rate",
        "Reaction Time",
        "Rule-Shift Latency"
    ]
    
    for word in required_keywords:
        if word not in content:
            print(f"FAILED: Report missing required keyword: '{word}'")
            sys.exit(1)
        else:
            print(f"  OK   Validated: keyword '{word}' exists in report.")
            
    print("\n=== SUCCESS: Thesis visualization exporter verified perfectly! ===")

if __name__ == "__main__":
    test_report_generation()
