import Phaser from 'phaser';

/**
 * CogniCore Serious Games Shared UI Visual Overlays & Gating Helpers
 * - Visual Theme: Glassmorphic Cyberpunk HSL Styling
 */

export function createTutorialOverlay(scene, { title, domain, instructions, themeColorHex, onStart }) {
    scene.isTutorialActive = true;
    const width = scene.scale.width;
    const height = scene.scale.height;

    // 1. Transparent blocking backdrop
    const overlayBg = scene.add.graphics();
    overlayBg.fillStyle(0x09090b, 0.88);
    overlayBg.fillRect(0, 0, width, height);
    overlayBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    // 2. Glassmorphic Modal Box Card
    const modal = scene.add.graphics();
    const modalW = 550;
    const modalH = 400;
    const modalX = (width - modalW) / 2;
    const modalY = (height - modalH) / 2;

    modal.lineStyle(2.5, themeColorHex, 0.95);
    modal.fillStyle(0x0f172a, 0.96);
    modal.fillRoundedRect(modalX, modalY, modalW, modalH, 16);
    modal.strokeRoundedRect(modalX, modalY, modalW, modalH, 16);

    const themeColorStr = '#' + themeColorHex.toString(16).padStart(6, '0');

    // Title text
    const titleText = scene.add.text(width / 2, modalY + 40, title, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '32px',
        fontWeight: 'bold',
        fill: themeColorStr,
        letterSpacing: '0.1em'
    }).setOrigin(0.5);

    // Domain tag
    const domainText = scene.add.text(width / 2, modalY + 80, `COGNITIVE DOMAIN: ${domain.toUpperCase()}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        fontWeight: '700',
        fill: '#a855f7'
    }).setOrigin(0.5);

    // Divider
    const divider = scene.add.graphics();
    divider.lineStyle(1.5, 0x1e293b, 1);
    divider.lineBetween(modalX + 40, modalY + 110, modalX + modalW - 40, modalY + 110);

    // Instructions bullet points
    const instructionsText = scene.add.text(width / 2, modalY + 140, instructions, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '18px',
        fontWeight: '500',
        fill: '#e2e8f0',
        lineSpacing: 12
    }).setOrigin(0.5, 0);

    // Button controls
    const btnW = 220;
    const btnH = 50;
    const btnX = width / 2;
    const btnY = modalY + modalH - 60;

    const btnBg = scene.add.graphics();
    btnBg.fillStyle(themeColorHex, 0.85);
    btnBg.lineStyle(2, 0xffffff, 0.9);
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const btnText = scene.add.text(btnX, btnY, 'LAUNCH MODULE', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '16px',
        fontWeight: 'bold',
        fill: '#ffffff'
    }).setOrigin(0.5);

    btnBg.setInteractive(new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains);

    btnBg.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(themeColorHex, 1.0);
        btnBg.lineStyle(2.5, 0xffffff, 1.0);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    });

    btnBg.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(themeColorHex, 0.85);
        btnBg.lineStyle(2, 0xffffff, 0.9);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    });

    btnBg.on('pointerdown', () => {
        overlayBg.destroy();
        modal.destroy();
        titleText.destroy();
        domainText.destroy();
        divider.destroy();
        instructionsText.destroy();
        btnBg.destroy();
        btnText.destroy();

        scene.isTutorialActive = false;
        onStart();
    });
}

export function createMlHud(scene, themeColorHex) {
    const height = scene.scale.height;
    const themeColorStr = '#' + themeColorHex.toString(16).padStart(6, '0');
    scene.mlHudText = scene.add.text(20, height - 35, '', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        fontWeight: '600',
        fill: themeColorStr
    });
    updateMlHud(scene);
}

export function updateMlHud(scene) {
    if (scene.mlHudText) {
        const archetype = scene.archetype || 'Initializing...';
        const conf = Math.round((scene.archetypeConfidence || 0.0) * 100);
        const diff = scene.difficultyLevel || 1;
        scene.mlHudText.setText(
            `ML FEEDBACK HUD | COGNITIVE ARCHETYPE: ${archetype.toUpperCase()} (${conf}% CONFIDENCE) | DDA: LVL ${diff}`
        );
    }
}
