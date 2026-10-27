import os
import subprocess

def create_figure_2_svg():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 860" width="560" height="860" style="background: white; font-family: 'Segoe UI', Arial, sans-serif;">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <marker id="bi-arrow-top" viewBox="0 0 10 10" refX="5" refY="2" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1.5 8 L 5 1 L 8.5 8 z" fill="#c2410c"/>
    </marker>
    <marker id="bi-arrow-bottom" viewBox="0 0 10 10" refX="5" refY="8" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 1.5 2 L 5 9 L 8.5 2 z" fill="#c2410c"/>
    </marker>
  </defs>

  <!-- Outer Purple/Lavender Canvas Container -->
  <rect x="15" y="15" width="530" height="830" rx="14" fill="#bca7c4" stroke="#8d6e97" stroke-width="2.5" filter="url(#shadow)"/>

  <!-- ==================== LAYER 1: CLIENT SIDE ==================== -->
  <g transform="translate(35, 35)">
    <rect x="0" y="0" width="490" height="230" rx="8" fill="#ffffff" stroke="#2d3748" stroke-width="1.8" filter="url(#shadow)"/>
    <text x="245" y="27" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a202c">Presentation Layer: Client Side</text>

    <!-- User Device / Web Browser -->
    <rect x="145" y="44" width="200" height="40" rx="5" fill="#e1f0fa" stroke="#1976d2" stroke-width="1.8"/>
    <text x="245" y="69" text-anchor="middle" font-size="13" font-weight="bold" fill="#0d47a1">User Device / Web Browser</text>

    <!-- Connector lines branching down -->
    <path d="M 245 84 L 245 102 M 135 102 L 355 102 M 135 102 L 135 120 M 355 102 L 355 120" fill="none" stroke="#2d3748" stroke-width="1.6"/>

    <!-- Frontend Frameworks Box -->
    <rect x="25" y="120" width="440" height="92" rx="6" fill="#f8fafc" stroke="#4a5568" stroke-width="1.5" stroke-dasharray="5,4"/>
    <text x="245" y="138" text-anchor="middle" font-size="12" font-weight="bold" fill="#334155">Frontend Frameworks</text>

    <!-- React.js -->
    <rect x="45" y="148" width="180" height="46" rx="5" fill="#e1f0fa" stroke="#1976d2" stroke-width="1.8"/>
    <text x="135" y="176" text-anchor="middle" font-size="13" font-weight="bold" fill="#0d47a1">React.js: UI Dashboard</text>

    <!-- Phaser.io -->
    <rect x="265" y="148" width="180" height="46" rx="5" fill="#e1f0fa" stroke="#1976d2" stroke-width="1.8"/>
    <text x="355" y="176" text-anchor="middle" font-size="13" font-weight="bold" fill="#0d47a1">Phaser.io: Game Engine</text>
  </g>

  <!-- Connection: Layer 1 to Layer 2 -->
  <line x1="280" y1="265" x2="280" y2="330" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="180" y="285" width="200" height="25" rx="4" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
  <text x="280" y="302" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">HTTP/REST API Requests</text>

  <!-- ==================== LAYER 2: SERVER SIDE ==================== -->
  <g transform="translate(35, 330)">
    <rect x="0" y="0" width="490" height="210" rx="8" fill="#ffffff" stroke="#2d3748" stroke-width="1.8" filter="url(#shadow)"/>
    <text x="245" y="27" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a202c">Application Layer: Server Side</text>

    <!-- Python/Flask Backend -->
    <rect x="135" y="44" width="220" height="42" rx="5" fill="#fff2e6" stroke="#ea580c" stroke-width="1.8"/>
    <text x="245" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="#c2410c">Python/Flask Backend</text>

    <!-- Bidirectional arrow -->
    <line x1="245" y1="92" x2="245" y2="130" stroke="#c2410c" stroke-width="2" marker-start="url(#bi-arrow-top)" marker-end="url(#bi-arrow-bottom)"/>

    <!-- Random Forest Classifier -->
    <rect x="95" y="136" width="300" height="52" rx="5" fill="#fff2e6" stroke="#ea580c" stroke-width="1.8"/>
    <text x="245" y="158" text-anchor="middle" font-size="13" font-weight="bold" fill="#c2410c">Random Forest Classifier: AI Model</text>
    <text x="245" y="176" text-anchor="middle" font-size="11" font-weight="600" fill="#9a3412">Cognitive Archetypes &amp; IRT DDA Engine</text>
  </g>

  <!-- Connection: Layer 2 to Layer 3 -->
  <line x1="280" y1="540" x2="280" y2="605" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="160" y="560" width="240" height="25" rx="4" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
  <text x="280" y="577" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">SQL Queries / Redis Cache Hits</text>

  <!-- ==================== LAYER 3: DATA PERSISTENCE ==================== -->
  <g transform="translate(35, 605)">
    <rect x="0" y="0" width="490" height="220" rx="8" fill="#ffffff" stroke="#2d3748" stroke-width="1.8" filter="url(#shadow)"/>
    <text x="245" y="27" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a202c">Data Layer: Persistence &amp; Caching</text>

    <!-- Supabase PostgreSQL Cylinder -->
    <g transform="translate(30, 48)">
      <path d="M 0 16 A 135 14 0 0 0 270 16 A 135 14 0 0 0 0 16 Z M 0 16 L 0 125 A 135 14 0 0 0 270 125 L 270 16" fill="#eafaf1" stroke="#16a34a" stroke-width="2"/>
      <ellipse cx="135" cy="16" rx="135" ry="14" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
      <text x="135" y="60" text-anchor="middle" font-size="14" font-weight="bold" fill="#15803d">Supabase PostgreSQL</text>
      <text x="135" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#166534">Profiles &amp; Telemetry</text>
      <text x="135" y="100" text-anchor="middle" font-size="10" fill="#14532d">game_sessions, metrics, users</text>
      <text x="135" y="115" text-anchor="middle" font-size="9" font-style="italic" fill="#166534">Secured with Row Level Security (RLS)</text>
    </g>

    <!-- Redis Caching Block -->
    <g transform="translate(320, 48)">
      <rect x="0" y="0" width="145" height="139" rx="6" fill="#fff1f2" stroke="#e11d48" stroke-width="2" stroke-dasharray="4,3"/>
      <rect x="0" y="0" width="145" height="26" rx="6" fill="#fecdd3" stroke="#e11d48" stroke-width="1.5"/>
      <text x="72" y="18" text-anchor="middle" font-size="11" font-weight="bold" fill="#9f1239">IN-MEMORY CACHE</text>
      <text x="72" y="55" text-anchor="middle" font-size="13" font-weight="bold" fill="#be123c">Redis Cache</text>
      <line x1="20" y1="67" x2="125" y2="67" stroke="#fda4af" stroke-width="1"/>
      <text x="72" y="84" text-anchor="middle" font-size="10" font-weight="600" fill="#881337">Leaderboard (60s)</text>
      <text x="72" y="102" text-anchor="middle" font-size="10" font-weight="600" fill="#881337">Global Metrics (300s)</text>
      <text x="72" y="120" text-anchor="middle" font-size="9" fill="#9f1239">Rate Limiting</text>
    </g>
  </g>
</svg>'''
    return svg


def create_figure_3_svg():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1020 420" width="1020" height="420" style="background: white; font-family: 'Segoe UI', Arial, sans-serif;">
  <defs>
    <filter id="shadow-dfd" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/>
    </filter>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1d6fa5"/>
    </marker>
  </defs>

  <!-- ==================== ENTITY: PLAYER ==================== -->
  <g transform="translate(40, 110)">
    <!-- Gane-Sarson External Entity: Double border -->
    <rect x="-3" y="-3" width="116" height="116" rx="4" fill="none" stroke="#1d6fa5" stroke-width="2.5"/>
    <rect x="0" y="0" width="110" height="110" rx="3" fill="#222b38" stroke="#1d6fa5" stroke-width="1.5" filter="url(#shadow-dfd)"/>
    <text x="55" y="62" text-anchor="middle" font-size="17" font-weight="bold" fill="#ffffff" letter-spacing="0.5">Player</text>
  </g>

  <!-- Flow 1: Player -> 1.0 CogniCore Game Engine -->
  <line x1="150" y1="165" x2="250" y2="165" stroke="#1d6fa5" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  <text x="200" y="145" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">Gameplay</text>
  <text x="200" y="159" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">Actions</text>

  <!-- ==================== PROCESS 1.0 ==================== -->
  <g transform="translate(250, 110)" filter="url(#shadow-dfd)">
    <!-- Header -->
    <rect x="0" y="0" width="155" height="34" rx="14" fill="#1d6fa5"/>
    <rect x="0" y="20" width="155" height="14" fill="#1d6fa5"/>
    <text x="77" y="23" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">1.0</text>
    <!-- Body -->
    <rect x="0" y="34" width="155" height="76" rx="14" fill="#2c3542"/>
    <rect x="0" y="34" width="155" height="20" fill="#2c3542"/>
    <text x="77" y="68" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">CogniCore</text>
    <text x="77" y="88" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">Game Engine</text>
  </g>

  <!-- Flow 2: Process 1.0 -> Process 2.0 -->
  <line x1="405" y1="165" x2="505" y2="165" stroke="#1d6fa5" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  <text x="455" y="152" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">Telemetry</text>

  <!-- ==================== PROCESS 2.0 ==================== -->
  <g transform="translate(505, 110)" filter="url(#shadow-dfd)">
    <!-- Header -->
    <rect x="0" y="0" width="155" height="34" rx="14" fill="#1d6fa5"/>
    <rect x="0" y="20" width="155" height="14" fill="#1d6fa5"/>
    <text x="77" y="23" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">2.0</text>
    <!-- Body -->
    <rect x="0" y="34" width="155" height="76" rx="14" fill="#2c3542"/>
    <rect x="0" y="34" width="155" height="20" fill="#2c3542"/>
    <text x="77" y="68" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">AI Analytics</text>
    <text x="77" y="88" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">Engine</text>
  </g>

  <!-- Flow 3: Process 2.0 -> Data Store D1 -->
  <line x1="660" y1="165" x2="750" y2="165" stroke="#1d6fa5" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  <text x="705" y="152" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">Results</text>

  <!-- ==================== DATA STORE: D1 ==================== -->
  <g transform="translate(750, 130)" filter="url(#shadow-dfd)">
    <!-- Gane-Sarson open rectangle: Left box filled with D1, top/bottom horizontal lines, open on right -->
    <rect x="0" y="0" width="40" height="70" fill="#1d6fa5" stroke="#1d6fa5" stroke-width="2"/>
    <text x="20" y="42" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">D1</text>
    
    <!-- Open body -->
    <rect x="40" y="0" width="195" height="70" fill="#f8fafc"/>
    <line x1="40" y1="0" x2="235" y2="0" stroke="#1d6fa5" stroke-width="2.5"/>
    <line x1="40" y1="70" x2="235" y2="70" stroke="#1d6fa5" stroke-width="2.5"/>
    <text x="137" y="32" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Supabase PostgreSQL</text>
    <text x="137" y="52" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f172a">Database</text>
  </g>

  <!-- Flow 4: D1 down to Process 3.0 -->
  <line x1="835" y1="200" x2="835" y2="280" stroke="#1d6fa5" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

  <!-- ==================== PROCESS 3.0 ==================== -->
  <g transform="translate(750, 280)" filter="url(#shadow-dfd)">
    <!-- Header -->
    <rect x="0" y="0" width="165" height="32" rx="14" fill="#1d6fa5"/>
    <rect x="0" y="18" width="165" height="14" fill="#1d6fa5"/>
    <text x="82" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">3.0</text>
    <!-- Body -->
    <rect x="0" y="32" width="165" height="68" rx="14" fill="#2c3542"/>
    <rect x="0" y="32" width="165" height="16" fill="#2c3542"/>
    <text x="82" y="62" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">Dashboard</text>
    <text x="82" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">Generator</text>
  </g>

  <!-- Flow 5: Process 3.0 -> Player (Feedback loop) -->
  <path d="M 750 340 L 95 340 L 95 230" fill="none" stroke="#1d6fa5" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
  <rect x="370" y="328" width="120" height="24" rx="4" fill="#ffffff"/>
  <text x="430" y="344" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">Visual Reports</text>
</svg>'''
    return svg

def main():
    os.makedirs('Capstone_Documents', exist_ok=True)
    brain_dir = 'C:/Users/pc/.gemini/antigravity/brain/ade24fb4-9545-4800-a862-28d0c7b2e0af'
    
    fig2_svg = create_figure_2_svg()
    fig3_svg = create_figure_3_svg()
    
    fig2_svg_path = 'Capstone_Documents/Figure_2_System_Architecture.svg'
    fig3_svg_path = 'Capstone_Documents/Figure_3_Data_Flow_Diagram.svg'
    
    with open(fig2_svg_path, 'w', encoding='utf-8') as f:
        f.write(fig2_svg)
    with open(fig3_svg_path, 'w', encoding='utf-8') as f:
        f.write(fig3_svg)
    print('SVGs written successfully.')

    # Convert SVGs to high-res PNG using Chrome or Edge
    browser = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    if not os.path.exists(browser):
        browser = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

    for name, w, h in [('Figure_2_System_Architecture', 560, 860), ('Figure_3_Data_Flow_Diagram', 1020, 420)]:
        svg_abs = os.path.abspath(f'Capstone_Documents/{name}.svg')
        png_out = os.path.abspath(f'Capstone_Documents/{name}.png')
        brain_out = os.path.abspath(f'{brain_dir}/{name}.png')
        
        # HTML wrapper for exact pixel/viewport rendering
        html_content = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ margin: 0; padding: 0; background: white; }}
</style>
</head>
<body>
  <img src="file:///{svg_abs.replace(os.sep, '/')}" width="{w}" height="{h}" style="display:block;"/>
</body>
</html>'''
        html_path = os.path.abspath(f'Capstone_Documents/{name}_wrap.html')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        cmd = [
            browser,
            '--headless=new',
            '--disable-gpu',
            '--hide-scrollbars',
            '--force-device-scale-factor=2',
            f'--window-size={w},{h}',
            f'--screenshot={png_out}',
            f'file:///{html_path.replace(os.sep, "/")}'
        ]
        subprocess.run(cmd, check=True)
        print(f'Rendered {name}.png successfully.')

        # Copy to brain dir
        with open(png_out, 'rb') as src, open(brain_out, 'wb') as dst:
            dst.write(src.read())

if __name__ == '__main__':
    main()
