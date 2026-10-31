import Phaser from 'phaser';

/**
 * CogniCore Serious Games Shared UI Visual Overlays & Gating Helpers
 * - Visual Theme: Glassmorphic Cyberpunk HSL Styling
 */

export function createTutorialOverlay(scene, { title, domain, instructions, themeColorHex, onStart }) {
    scene.isTutorialActive = true;
    const width = scene.scale.width;
    const height = scene.scale.height;
    const BASE_DEPTH = 2000; // Guarantee modal is on top of all scene elements

    // 1. Transparent blocking backdrop
    const overlayBg = scene.add.graphics();
    overlayBg.setDepth(BASE_DEPTH);
    overlayBg.fillStyle(0x09090b, 0.92);
    overlayBg.fillRect(0, 0, width, height);
    overlayBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    // 2. Glassmorphic Modal Box Card
    const modal = scene.add.graphics();
    modal.setDepth(BASE_DEPTH + 1);
    const modalW = 820;
    const modalH = 560;
    const modalX = (width - modalW) / 2;
    const modalY = (height - modalH) / 2;

    modal.lineStyle(2.5, themeColorHex, 0.95);
    modal.fillStyle(0x0a1024, 0.98);
    modal.fillRoundedRect(modalX, modalY, modalW, modalH, 18);
    modal.strokeRoundedRect(modalX, modalY, modalW, modalH, 18);

    // Tech Corner Accents
    modal.lineStyle(3, 0x00f0ff, 0.85);
    modal.lineBetween(modalX, modalY + 16, modalX, modalY);
    modal.lineBetween(modalX, modalY, modalX + 16, modalY);
    modal.lineBetween(modalX + modalW - 16, modalY, modalX + modalW, modalY);
    modal.lineBetween(modalX + modalW, modalY, modalX + modalW, modalY + 16);

    const themeColorStr = '#' + themeColorHex.toString(16).padStart(6, '0');

    // Title text (setDepth on GameObject)
    const titleText = scene.add.text(width / 2, modalY + 42, title, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '32px',
        fontWeight: 'bold',
        fill: themeColorStr,
        letterSpacing: '0.08em'
    }).setOrigin(0.5).setDepth(BASE_DEPTH + 2);

    // Domain tag (setDepth on GameObject)
    const domainText = scene.add.text(width / 2, modalY + 78, `COGNITIVE DOMAIN: ${domain.toUpperCase()}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        fill: '#38bdf8'
    }).setOrigin(0.5).setDepth(BASE_DEPTH + 2);

    // Divider
    const divider = scene.add.graphics();
    divider.setDepth(BASE_DEPTH + 1);
    divider.lineStyle(1.5, 0x1e293b, 1);
    divider.lineBetween(modalX + 40, modalY + 104, modalX + modalW - 40, modalY + 104);

    // Instructions bullet points (Large, high-contrast, setDepth on GameObject)
    const instructionsText = scene.add.text(width / 2, modalY + 130, instructions, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '20px',
        fontWeight: 'bold',
        fill: '#f1f5f9',
        lineSpacing: 16,
        wordWrap: { width: modalW - 90 },
        align: 'left'
    }).setOrigin(0.5, 0).setDepth(BASE_DEPTH + 2);

    // Button controls
    const btnW = 280;
    const btnH = 56;
    const btnX = width / 2;
    const btnY = modalY + modalH - 52;

    const btnBg = scene.add.graphics();
    btnBg.setDepth(BASE_DEPTH + 3);
    btnBg.fillStyle(themeColorHex, 0.85);
    btnBg.lineStyle(2, 0xffffff, 0.9);
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const btnText = scene.add.text(btnX, btnY, 'LAUNCH MODULE', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '18px',
        fontWeight: 'bold',
        fill: '#ffffff'
    }).setOrigin(0.5).setDepth(BASE_DEPTH + 4);

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
    scene.mlHudText = scene.add.text(20, height - 22, '', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        fontWeight: '600',
        fill: themeColorStr
    }).setAlpha(0.65);
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
