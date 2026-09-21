import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    init(data) {
        this.nextScene = data.nextScene;
        this.nextSceneData = data.nextSceneData || {};
    }

    create() {
        // Pre-generate textures commonly used across all games
        
        // 1. Particle texture
        if (!this.textures.exists('particle')) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('particle', 8, 8);
            graphics.destroy();
        }

        // 2. Glow texture (used for hover effects)
        if (!this.textures.exists('glow')) {
            const glowGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            glowGraphics.fillStyle(0xffffff, 1);
            glowGraphics.fillCircle(16, 16, 16);
            glowGraphics.generateTexture('glow', 32, 32);
            glowGraphics.destroy();
        }

        // Immediately transition to the requested next scene
        if (this.nextScene) {
            this.scene.start(this.nextScene, this.nextSceneData);
        } else {
            console.error('[BootScene] No nextScene provided in init data!');
        }
    }
}
