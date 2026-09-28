import os

filepath = r'd:\cognicore-workspace\client\games\SpeedTapScene.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject pool initialization into create()
pool_setup = '''        // Setup ML HUD & Tutorial Overlay
        
        // --- OBJECT POOLING OPTIMIZATION ---
        // Pre-allocating sprite memory prevents the JS Garbage Collector 
        // from pausing the game during intense waves of rapid clicks.
        this.targetPool = this.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 50,
            runChildUpdate: false
        });
        
        createMlHud'''
content = content.replace('        // Setup ML HUD & Tutorial Overlay\n        createMlHud', pool_setup)

# 2. Refactor spawnObject to pull from pool
spawn_old = '''        // Create sprite from cached texture
        const sprite = this.add.image(x, y, textureKey);'''
spawn_new = '''        // --- OBJECT POOLING: Retrieve instead of instantiating ---
        const sprite = this.targetPool.get(x, y, textureKey);
        if (!sprite) return; // Pool is exhausted

        sprite.setActive(true).setVisible(true);
        sprite.setTexture(textureKey);
        sprite.setPosition(x, y);'''
content = content.replace(spawn_old, spawn_new)

# 3. Refactor removeTarget to killAndHide
remove_old = '''    removeTarget(sprite) {
        this.activeTargets = this.activeTargets.filter(t => t !== sprite);
        sprite.destroy();
    }'''
remove_new = '''    removeTarget(sprite) {
        this.activeTargets = this.activeTargets.filter(t => t !== sprite);
        
        // --- OBJECT POOLING: Recycle instead of destroying ---
        this.tweens.killTweensOf(sprite);
        this.targetPool.killAndHide(sprite);
        sprite.disableInteractive();
    }'''
content = content.replace(remove_old, remove_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactored SpeedTapScene.js with Object Pooling")
