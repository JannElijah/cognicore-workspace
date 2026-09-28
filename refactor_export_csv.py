import os

filepath = r'd:\cognicore-workspace\server\routes\research.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_export_csv = '''@research_bp.route('/api/export-csv', methods=['GET'])
def export_csv():
    conn = get_db_connection()
    try:
        from flask import Response
        import csv
        import io
        
        cursor = conn.cursor()
        
        query = """
            SELECT 
                pm.id AS metric_id,
                pm.session_id,
                gs.user_id,
                u.username,
                pm.cognitive_domain,
                pm.game_type,
                pm.reaction_time,
                pm.accuracy_rate,
                pm.difficulty_level,
                pm.error_count,
                pm.hesitation_ms,
                pm.spam_click_count,
                pm.rule_shift_latency_ms,
                pm.path_efficiency,
                pm.recorded_at
            FROM performance_metrics pm
            JOIN game_sessions gs ON pm.session_id = gs.id
            JOIN users u ON gs.user_id = u.id
            ORDER BY pm.recorded_at DESC, pm.id DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers matching professor telemetry specifications
        writer.writerow([
            "Metric ID", "Session ID", "User ID", "Username", 
            "Cognitive Domain", "Game Type", "Reaction Time (ms)", 
            "Accuracy Rate", "Difficulty Level", "Error Count", 
            "Hesitation (ms)", "Spam Click Count", "Rule-Shift Latency (ms)", "Path Efficiency", "Timestamp"
        ])
        
        for r in rows:
            writer.writerow([
                r["metric_id"], r["session_id"], r["user_id"], r["username"],
                r["cognitive_domain"], r["game_type"], r["reaction_time"],
                r["accuracy_rate"], r["difficulty_level"], r["error_count"],
                r["hesitation_ms"], r["spam_click_count"], r["rule_shift_latency_ms"], r["path_efficiency"], r["recorded_at"]
            ])
            
        output.seek(0)
        csv_data = output.getvalue()
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": "attachment; filename=cohort_telemetry_report.csv"}
        )
    except Exception as e:
        logger.error(f"Error in export_csv: {e}")
        return jsonify({"status": "error", "message": "An internal server error occurred."}), 500
    finally:
        conn.close()'''

new_export_csv = '''@research_bp.route('/api/export-csv', methods=['GET'])
def export_csv():
    from flask import Response
    import csv
    import io

    def generate():
        conn = get_db_connection()
        try:
            # Use a named server-side cursor to prevent memory exhaustion on massive tables
            cursor = conn.cursor(name="csv_export_cursor")
            
            query = """
                SELECT 
                    pm.id AS metric_id,
                    pm.session_id,
                    gs.user_id,
                    u.username,
                    pm.cognitive_domain,
                    pm.game_type,
                    pm.reaction_time,
                    pm.accuracy_rate,
                    pm.difficulty_level,
                    pm.error_count,
                    pm.hesitation_ms,
                    pm.spam_click_count,
                    pm.rule_shift_latency_ms,
                    pm.path_efficiency,
                    pm.recorded_at
                FROM performance_metrics pm
                JOIN game_sessions gs ON pm.session_id = gs.id
                JOIN users u ON gs.user_id = u.id
                ORDER BY pm.recorded_at DESC, pm.id DESC
            """
            cursor.execute(query)

            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers
            writer.writerow([
                "Metric ID", "Session ID", "User ID", "Username", 
                "Cognitive Domain", "Game Type", "Reaction Time (ms)", 
                "Accuracy Rate", "Difficulty Level", "Error Count", 
                "Hesitation (ms)", "Spam Click Count", "Rule-Shift Latency (ms)", "Path Efficiency", "Timestamp"
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
            
            while True:
                rows = cursor.fetchmany(1000)
                if not rows:
                    break
                for r in rows:
                    writer.writerow([
                        r["metric_id"], r["session_id"], r["user_id"], r["username"],
                        r["cognitive_domain"], r["game_type"], r["reaction_time"],
                        r["accuracy_rate"], r["difficulty_level"], r["error_count"],
                        r["hesitation_ms"], r["spam_click_count"], r["rule_shift_latency_ms"], r["path_efficiency"], r["recorded_at"]
                    ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)
                
        except Exception as e:
            logger.error(f"Error in export_csv stream: {e}")
        finally:
            cursor.close()
            conn.close()

    return Response(
        generate(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=cohort_telemetry_report.csv"}
    )'''

content = content.replace(old_export_csv, new_export_csv)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
