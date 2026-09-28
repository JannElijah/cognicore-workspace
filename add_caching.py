import os
import re

# Update analytics.py for /api/cohort-analytics
filepath_a = r'd:\cognicore-workspace\server\routes\analytics.py'
with open(filepath_a, 'r', encoding='utf-8') as f:
    content_a = f.read()

cache_injection_a = '''
    import redis
    import json
    import os
    redis_url = os.environ.get("REDIS_URL", "memory://")
    redis_client = None
    if redis_url != "memory://":
        try:
            redis_client = redis.from_url(redis_url)
            cached_data = redis_client.get("cognicore:cohort_analytics")
            if cached_data:
                return jsonify(json.loads(cached_data)), 200
        except Exception:
            pass
    conn = get_db_connection()'''

content_a = content_a.replace(
    '''def get_cohort_analytics():
    conn = get_db_connection()''',
    f'''def get_cohort_analytics():{cache_injection_a}'''
)

cache_store_a = '''
        if redis_client:
            try:
                redis_client.setex("cognicore:cohort_analytics", 900, json.dumps(response_data))
            except Exception:
                pass
        return jsonify(response_data), 200'''

content_a = content_a.replace(
    '''        return jsonify(response_data), 200''',
    cache_store_a
)

with open(filepath_a, 'w', encoding='utf-8') as f:
    f.write(content_a)

# Update research.py for /api/cohort-db-scores
filepath_r = r'd:\cognicore-workspace\server\routes\research.py'
with open(filepath_r, 'r', encoding='utf-8') as f:
    content_r = f.read()

cache_injection_r = '''
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    cache_key = f"cognicore:cohort_db_scores_{limit}_{offset}"
    
    import redis
    import json
    import os
    redis_url = os.environ.get("REDIS_URL", "memory://")
    redis_client = None
    if redis_url != "memory://":
        try:
            redis_client = redis.from_url(redis_url)
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return jsonify(json.loads(cached_data)), 200
        except Exception:
            pass
    conn = get_db_connection()'''

content_r = content_r.replace(
    '''def get_cohort_db_scores():
    conn = get_db_connection()
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))''',
    f'''def get_cohort_db_scores():{cache_injection_r}
    try:'''
)

cache_store_r = '''
        response_data = {
            "status": "success",
            "pretest_scores": pretest_scores,
            "posttest_scores": posttest_scores,
            "count": len(pretest_scores)
        }
        if redis_client:
            try:
                redis_client.setex(cache_key, 900, json.dumps(response_data))
            except Exception:
                pass
        return jsonify(response_data), 200'''

content_r = re.sub(
    r'return jsonify\(\{\s*"status": "success",\s*"pretest_scores": pretest_scores,\s*"posttest_scores": posttest_scores,\s*"count": len\(pretest_scores\)\s*\}\), 200',
    cache_store_r,
    content_r
)

with open(filepath_r, 'w', encoding='utf-8') as f:
    f.write(content_r)

