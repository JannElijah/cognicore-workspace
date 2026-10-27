import urllib.request
import json
import urllib.parse

def search_s2(query):
    url = f'https://api.semanticscholar.org/graph/v1/paper/search?query={urllib.parse.quote(query)}&year=2021-2024&fields=title,url,year&limit=5'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        for p in data['data']:
            try:
                print(f"[{p.get('year', 'N/A')}] {p.get('title', 'N/A')}")
                print(f"URL: {p.get('url', 'N/A')}")
            except Exception:
                pass
    except Exception as e:
        print('Error:', e)

print('--- COLOR PSYCHOLOGY ---')
search_s2('effect of color on cognitive performance red blue reaction time')
print('--- GREEN ENVIRONMENT FATIGUE ---')
search_s2('green color environment attention restoration cognitive fatigue')
