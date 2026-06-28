const fs = require('fs');
const path = require('path');
const dir = 'd:/cognicore-workspace/client/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Game.jsx'));

for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    let parts = content.split('{!user?.username && (');
    if (parts.length > 1) {
        let pre = parts[0];
        let post = parts[1];
        
        // Find the broken div
        let divIdx = pre.lastIndexOf('<div style={{ textAlign: \\'left\\', marginBottom: \\'0.5rem\\' }}>');
        if (divIdx !== -1 && (pre.length - divIdx) < 100) {
            pre = pre.substring(0, divIdx);
            
            let endIdx = post.indexOf(')}');
            if (endIdx !== -1) {
                post = post.substring(endIdx + 2);
                
                let clean = `{!user?.username && (
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
                    )}`;
                
                content = pre + clean + post;
                fs.writeFileSync(fullPath, content);
                console.log('Fixed ' + file);
            }
        }
    }
}
