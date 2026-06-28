import os
import glob

components_dir = r'd:\cognicore-workspace\client\components'
game_files = glob.glob(os.path.join(components_dir, '*Game.jsx'))

for path in game_files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    parts = content.split('{!user?.username && (')
    if len(parts) > 1:
        pre = parts[0]
        post = parts[1]
        
        div_idx = pre.rfind('<div style={{ textAlign: \'left\', marginBottom: \'0.5rem\' }}>')
        if div_idx != -1 and (len(pre) - div_idx) < 100:
            pre = pre[:div_idx]
            
            end_idx = post.find(')}')
            if end_idx != -1:
                post = post[end_idx + 2:]
                
                clean = """{!user?.username && (
                        <>
                            <div style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Player Username</label>
                            </div>
                            <input 
                                type="text" 
                                value={inputUsername} 
                                onChange={(e) => setInputUsername(e.target.value)} 
                                placeholder="Enter username" 
                                style={styles.input}
                            />
                        </>
                    )}"""
                
                content = pre + clean + post

    if original != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {os.path.basename(path)}')
