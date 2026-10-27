import urllib.request
import json
import urllib.parse

def search_oa(query):
    url = f'https://api.openalex.org/works?search={urllib.parse.quote(query)}&filter=publication_year:2021-2024,has_doi:true&select=title,doi,publication_year&per-page=3'
    req = urllib.request.Request(url, headers={'User-Agent': 'mailto:test@example.com'})
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode('utf-8'))
        for item in data['results']:
            print(f"[{item['publication_year']}] {item['title']}\nURL: {item['doi']}\n")
    except Exception as e:
        print('Error:', e)

print('--- BLUE COLOR STRESS ---')
search_oa('blue color cognitive stress relaxation')
print('--- RED COLOR REACTION TIME ---')
search_oa('red color reaction time attention arousal')
print('--- GREEN COLOR FATIGUE ---')
search_oa('green color cognitive fatigue attention restoration')
