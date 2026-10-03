import os
import re

dir_path = r'D:\cognicore-workspace\client\components'
files = [f for f in os.listdir(dir_path) if f.endswith('Game.jsx')]

for f in files:
    if f in ['MemoryMatchGame.jsx', 'SequenceDecoderGame.jsx']:
        continue
        
    filepath = os.path.join(dir_path, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
        
    scene_class_match = re.search(r"import\s+(\w+Scene)\s+from\s+['\"]\.\./games/\w+Scene['\"]", content)
    if not scene_class_match:
        print(f"Could not find scene class for {f}")
        continue
    scene_class = scene_class_match.group(1)
    
    # We want to replace the block that starts with an optional comment, then `useEffect(() => {`
    # and contains `new Phaser.Game(config)`
    # and ends with `}, [gameState`
    
    # Split the file by `useEffect(() => {`
    # We will find the part containing `new Phaser.Game`
    parts = content.split('useEffect(() => {')
    new_parts = [parts[0]]
    for i in range(1, len(parts)):
        part = parts[i]
        if 'new Phaser.Game' in part:
            # This is the block to replace.
            # We need to find where this block ends. It ends at `}, [gameState`...
            end_match = re.search(r'\}, \[gameState.*?\]\);', part)
            if end_match:
                end_pos = end_match.end()
                remainder = part[end_pos:]
                
                replacement = f'''// Handle Phaser engine initialization and lifecycle via generic hook
    const sceneData = React.useMemo(() => ({{
        sessionId: sessionId,
        apiUrl: apiUrl,
        ddaParameters: ddaParameters,
        cognitiveProfile: cognitiveProfile,
        onGameOver: async (stats) => {{
            setFinalStats(stats);
            let profileInfo = null;
            try {{
                const profileRes = await fetch(`${{apiUrl}}/api/dda`, {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${{useCogniStore.getState().token}}`}},
                    body: JSON.stringify({{ session_id: sessionId }})
                }});
                if (profileRes.ok) {{
                    const profileData = await profileRes.json();
                    if (profileData.status === 'success' && profileData.cognitive_profile) {{
                        setCognitiveProfile(profileData.cognitive_profile);
                        profileInfo = profileData.cognitive_profile;
                    }}
                }}
            }} catch (e) {{
                console.warn('[React Wrapper] Failed to fetch final cognitive profile:', e);
            }}
            setGameState('FINISHED');
            if (onGameFinished) {{
                onGameFinished({{ ...stats, cognitiveProfile: profileInfo }});
            }}
        }}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }}), [sessionId, apiUrl, ddaParameters]);

    const phaserInstanceRef = usePhaserEngine(
        gameContainerRef, 
        gameState, 
        {scene_class}, 
        '{scene_class}', 
        sceneData
    );
'''
                new_parts.append(replacement + remainder)
            else:
                print(f"Failed to find end of useEffect in {f}")
                new_parts.append('useEffect(() => {' + part)
        else:
            new_parts.append('useEffect(() => {' + part)
            
    # Also, we might need to remove any preceding comment like `// Initialize Phaser game when state changes to PLAYING`
    new_content = "".join(new_parts)
    
    new_content = re.sub(r'    // Initialize Phaser game.*?\n    // Handle Phaser engine', '    // Handle Phaser engine', new_content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(new_content)
    print(f"Fixed {f}")
