import os

filepath = r'd:\cognicore-workspace\client\games\FocusFinderScene.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Setup object pool in create()
pool_setup = '''        // 3. Spawning Loops
        // --- OBJECT POOLING OPTIMIZATION ---
        this.targetPool = this.add.group({
            classType: Phaser.GameObjects.Image,
            maxSize: 60,
            runChildUpdate: false
        });
        
        createMlHud'''
content = content.replace('        // 3. Spawning Loops\n        createMlHud', pool_setup)


# 2. Refactor spawnTargetObject
old_spawn_target = '''        const container = this.add.container(x, y);
        const size = 52;

        // Use pre-cached GPU texture sprite
        const texKey = f__;
        let sprite;
        if (this.textures.exists(texKey)) {
            sprite = this.add.image(0, 0, texKey);
            // Normalize to match 52px display size (texture is 64px)
            sprite.setScale(size / 64);
        } else {
            // Fallback: draw live if texture wasn't cached (shouldn't happen)
            sprite = this.add.graphics();
            this.drawShapeGraphic(sprite, this.targetShape, this.colorsMap[this.targetColor], size);
        }
        container.add(sprite);

        // Setup interaction - center the hit area correctly for sprite texture bounds
        const hitArea = (sprite.width && sprite.width > 0)
            ? new Phaser.Geom.Circle(sprite.width / 2, sprite.height / 2, sprite.width / 2)
            : new Phaser.Geom.Circle(0, 0, size / 2);
        if (sprite.setInteractive) {
            sprite.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        }
        sprite.on('pointerdown', () => {
            this.handleTargetClick(container);
        });

        // Enable Arcade Physics for movement
        this.physics.add.existing(container);
        container.body.setSize(size, size);
        container.body.setOffset(-size / 2, -size / 2);
        container.body.setCollideWorldBounds(true);

        if (this.movementSpeed > 0) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            container.body.setVelocity(
                Math.cos(angle) * this.movementSpeed,
                Math.sin(angle) * this.movementSpeed
            );
            container.body.setBounce(1, 1);
        }

        container.setData('isTarget', true);
        this.spawnedObjects.push(container);'''

new_spawn_target = '''        const size = 52;
        const texKey = f__;
        
        const sprite = this.targetPool.get(x, y, texKey);
        if (!sprite) return;
        
        sprite.setActive(true).setVisible(true).setAlpha(1).setScale(size / 64).setPosition(x, y);
        sprite.setTexture(texKey);
        
        const hitArea = new Phaser.Geom.Circle(sprite.width / 2, sprite.height / 2, sprite.width / 2);
        sprite.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        
        // Remove old listeners to prevent duplicates from pooling
        sprite.removeAllListeners('pointerdown');
        sprite.on('pointerdown', () => {
            this.handleTargetClick(sprite);
        });

        this.physics.add.existing(sprite);
        sprite.body.setSize(size, size);
        sprite.body.setOffset(6, 6); // roughly center 52px in 64px tex
        sprite.body.setCollideWorldBounds(true);

        if (this.movementSpeed > 0) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            sprite.body.setVelocity(
                Math.cos(angle) * this.movementSpeed,
                Math.sin(angle) * this.movementSpeed
            );
            sprite.body.setBounce(1, 1);
        } else {
            sprite.body.setVelocity(0, 0);
        }

        sprite.setData('isTarget', true);
        this.spawnedObjects.push(sprite);'''
content = content.replace(old_spawn_target, new_spawn_target)


# 3. Refactor spawnDistractorObject
old_spawn_dist = '''        const container = this.add.container(x, y);
        const size = 52;

        // Use pre-cached GPU texture sprite
        const texKey = f__;
        let sprite;
        if (this.textures.exists(texKey)) {
            sprite = this.add.image(0, 0, texKey);
            sprite.setScale(size / 64);
        } else {
            sprite = this.add.graphics();
            this.drawShapeGraphic(sprite, dShape, this.colorsMap[dColor], size);
        }
        container.add(sprite);

        // Setup interaction - center the hit area correctly for sprite texture bounds
        const hitArea = (sprite.width && sprite.width > 0)
            ? new Phaser.Geom.Circle(sprite.width / 2, sprite.height / 2, sprite.width / 2)
            : new Phaser.Geom.Circle(0, 0, size / 2);
        if (sprite.setInteractive) {
            sprite.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        }
        sprite.on('pointerdown', () => {
            this.handleDistractorClick(container);
        });

        // Enable Arcade Physics
        this.physics.add.existing(container);
        container.body.setSize(size, size);
        container.body.setOffset(-size / 2, -size / 2);
        container.body.setCollideWorldBounds(true);

        if (this.movementSpeed > 0) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            container.body.setVelocity(
                Math.cos(angle) * this.movementSpeed,
                Math.sin(angle) * this.movementSpeed
            );
            container.body.setBounce(1, 1);
        }

        container.setData('isTarget', false);
        this.spawnedObjects.push(container);'''

new_spawn_dist = '''        const size = 52;
        const texKey = f__;
        
        const sprite = this.targetPool.get(x, y, texKey);
        if (!sprite) return;
        
        sprite.setActive(true).setVisible(true).setAlpha(1).setScale(size / 64).setPosition(x, y);
        sprite.setTexture(texKey);
        
        const hitArea = new Phaser.Geom.Circle(sprite.width / 2, sprite.height / 2, sprite.width / 2);
        sprite.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
        
        // Remove old listeners to prevent duplicates from pooling
        sprite.removeAllListeners('pointerdown');
        sprite.on('pointerdown', () => {
            this.handleDistractorClick(sprite);
        });

        this.physics.add.existing(sprite);
        sprite.body.setSize(size, size);
        sprite.body.setOffset(6, 6);
        sprite.body.setCollideWorldBounds(true);

        if (this.movementSpeed > 0) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            sprite.body.setVelocity(
                Math.cos(angle) * this.movementSpeed,
                Math.sin(angle) * this.movementSpeed
            );
            sprite.body.setBounce(1, 1);
        } else {
            sprite.body.setVelocity(0, 0);
        }

        sprite.setData('isTarget', false);
        this.spawnedObjects.push(sprite);'''
content = content.replace(old_spawn_dist, new_spawn_dist)

# 4. Refactor generateWave clear loop
old_clear = '''        // Clear existing wave items
        this.spawnedObjects.forEach(obj => obj.destroy());
        this.spawnedObjects = [];'''
new_clear = '''        // Clear existing wave items (Object Pooling Recycling)
        this.spawnedObjects.forEach(obj => {
            this.targetPool.killAndHide(obj);
            obj.disableInteractive();
            if (obj.body) obj.body.setVelocity(0, 0);
        });
        this.spawnedObjects = [];'''
content = content.replace(old_clear, new_clear)

# 5. Handle Distractor fade out completion
old_dist_complete = '''                this.spawnedObjects = this.spawnedObjects.filter(obj => obj !== container);
                container.destroy();'''
new_dist_complete = '''                this.spawnedObjects = this.spawnedObjects.filter(obj => obj !== container);
                this.targetPool.killAndHide(container);
                container.disableInteractive();'''
content = content.replace(old_dist_complete, new_dist_complete)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("FocusFinderScene.js refactored with Object Pooling")
