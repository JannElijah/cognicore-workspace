import Phaser from 'phaser';

/**
 * CogniCore Serious Games Shared UI Visual Overlays & Gating Helpers
 * - Visual Theme: Glassmorphic Cyberpunk HSL Styling
 */

/**
 * Formats domain identifiers like 'reflexes_and_focus' into 'REFLEXES & FOCUS'.
 */
function formatDomainLabel(domain = '') {
    return domain
        .replace(/_and_/gi, ' & ')
        .replace(/_/g, ' ')
        .toUpperCase();
}

/**
 * Reusable mini-diagram drawing primitives for visual game briefings.
 */
export const OverlayDiagrams = {
    /** Draw a rounded pill button/chip into `container`. */
    pill(scene, container, x, y, w, h, label, { fill = 0x1e293b, alpha = 0.95, stroke = 0x475569, strokeWidth = 1.5, textColor = '#f8fafc', fontSize = '14px', radius = 8 } = {}) {
        const g = scene.add.graphics();
        g.fillStyle(fill, alpha);
        g.lineStyle(strokeWidth, stroke, 1);
        g.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
        g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, radius);
        container.add(g);

        const t = scene.add.text(x, y, label, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize,
            fontStyle: 'bold',
            fill: textColor
        }).setOrigin(0.5);
        container.add(t);
        return { g, t };
    },

    /** Draw a 5-point star polygon into `graphics`. */
    star(g, cx, cy, outerR, innerR, colorHex, strokeHex = 0xffffff) {
        const pts = [];
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const a = (Math.PI / 5) * i - Math.PI / 2;
            pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        g.fillStyle(colorHex, 1);
        g.lineStyle(2, strokeHex, 0.9);
        g.fillPoints(pts, true);
        g.strokePoints(pts, true);
    },

    /** Draw a compact NxM grid with optional cell specs: `{ row, col, fill, stroke, label, textColor }`. */
    miniGrid(scene, container, cx, cy, rows, cols, cellSize, gap = 4, cellSpecs = []) {
        const totalW = cols * cellSize + (cols - 1) * gap;
        const totalH = rows * cellSize + (rows - 1) * gap;
        const startX = cx - totalW / 2 + cellSize / 2;
        const startY = cy - totalH / 2 + cellSize / 2;
        const specMap = new Map(cellSpecs.map(s => [`${s.row},${s.col}`, s]));

        const g = scene.add.graphics();
        container.add(g);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * (cellSize + gap);
                const y = startY + r * (cellSize + gap);
                const spec = specMap.get(`${r},${c}`) || {};
                const fill = spec.fill ?? 0x1e293b;
                const alpha = spec.alpha ?? 0.65;
                const stroke = spec.stroke ?? 0x334155;

                g.fillStyle(fill, alpha);
                g.lineStyle(spec.strokeWidth ?? 1.5, stroke, 1);
                g.fillRoundedRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize, 5);
                g.strokeRoundedRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize, 5);

                if (spec.label) {
                    const t = scene.add.text(x, y, spec.label, {
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: spec.fontSize || `${Math.max(11, Math.round(cellSize * 0.45))}px`,
                        fontStyle: 'bold',
                        fill: spec.textColor || '#ffffff'
                    }).setOrigin(0.5);
                    container.add(t);
                }
            }
        }
        return { startX, startY, totalW, totalH };
    },

    /** Draw a check/cross status badge. */
    statusBadge(scene, container, x, y, ok = true, label = null) {
        const color = ok ? 0x10b981 : 0xef4444;
        const sym = ok ? '✓' : '✕';
        const g = scene.add.graphics();
        g.fillStyle(color, 0.95);
        g.lineStyle(2, 0xffffff, 0.9);
        g.fillCircle(x, y, 12);
        g.strokeCircle(x, y, 12);
        container.add(g);

        const t = scene.add.text(x, y, sym, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        container.add(t);

        if (label) {
            const lt = scene.add.text(x + 18, y, label, {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '13px',
                fontStyle: 'bold',
                fill: ok ? '#34d399' : '#f87171'
            }).setOrigin(0, 0.5);
            container.add(lt);
        }
    },

    /** Draw a stylized pointer/click indicator at (x, y). */
    tapCursor(scene, container, x, y, accentHex = 0x38bdf8) {
        const g = scene.add.graphics();
        g.lineStyle(2, accentHex, 0.65);
        g.strokeCircle(x, y, 12);
        g.lineStyle(1.5, accentHex, 0.35);
        g.strokeCircle(x, y, 20);
        // Clean pointer arrow polygon
        g.fillStyle(0xffffff, 0.96);
        g.lineStyle(1.5, 0x0f172a, 1);
        g.fillPoints([
            { x, y },
            { x: x + 2, y: y + 18 },
            { x: x + 7, y: y + 13 },
            { x: x + 13, y: y + 20 },
            { x: x + 16, y: y + 17 },
            { x: x + 10, y: y + 11 },
            { x: x + 16, y: y + 9 }
        ], true);
        g.strokePoints([
            { x, y },
            { x: x + 2, y: y + 18 },
            { x: x + 7, y: y + 13 },
            { x: x + 13, y: y + 20 },
            { x: x + 16, y: y + 17 },
            { x: x + 10, y: y + 11 },
            { x: x + 16, y: y + 9 }
        ], true);
        container.add(g);
    }
};

export function createTutorialOverlay(scene, { title, domain = '', subtitle, lead, cards, tip, instructions, themeColorHex = 0x38bdf8, onStart }) {
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

    // Master container holds all non-button visual layers for clean single-call teardown
    const uiContainer = scene.add.container(0, 0).setDepth(BASE_DEPTH + 1);

    // 2. Glassmorphic Modal Box Card
    const modal = scene.add.graphics();
    const modalW = 880;
    const modalH = 610;
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
    uiContainer.add(modal);

    const themeColorStr = '#' + themeColorHex.toString(16).padStart(6, '0');
    const isVisualMode = Array.isArray(cards) && cards.length > 0;

    // Title text (Phaser requires numeric letterSpacing; fontStyle renders bold)
    const titleText = scene.add.text(width / 2, modalY + (isVisualMode ? 38 : 48), title, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: isVisualMode ? '36px' : '42px',
        fontStyle: 'bold',
        fill: themeColorStr,
        letterSpacing: 2
    }).setOrigin(0.5);
    uiContainer.add(titleText);

    // Domain tag / subtitle
    const subLabel = subtitle || `COGNITIVE DOMAIN: ${formatDomainLabel(domain)}`;
    const domainText = scene.add.text(width / 2, modalY + (isVisualMode ? 72 : 92), subLabel, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: isVisualMode ? '15px' : '18px',
        fontStyle: 'bold',
        fill: '#38bdf8',
        letterSpacing: 1
    }).setOrigin(0.5);
    uiContainer.add(domainText);

    // Divider
    const dividerY = modalY + (isVisualMode ? 96 : 118);
    const divider = scene.add.graphics();
    divider.lineStyle(1.5, 0x1e293b, 1);
    divider.lineBetween(modalX + 36, dividerY, modalX + modalW - 36, dividerY);
    uiContainer.add(divider);

    // Button geometry calculated early so layout sections auto-fit cleanly above it
    const btnW = 320;
    const btnH = isVisualMode ? 54 : 62;
    const btnX = width / 2;
    const btnY = modalY + modalH - (isVisualMode ? 46 : 54);

    if (isVisualMode) {
        let contentTop = dividerY + 18;

        // Concise 1-line plain-English objective
        if (lead) {
            const leadText = scene.add.text(width / 2, contentTop, lead, {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '18px',
                fontStyle: 'bold',
                fill: '#f1f5f9',
                wordWrap: { width: modalW - 84 },
                align: 'center'
            }).setOrigin(0.5, 0);
            uiContainer.add(leadText);
            contentTop += leadText.height + 16;
        }

        // Optional bottom pro-tip / control strip right above LAUNCH button
        let cardsBottom = btnY - btnH / 2 - 18;
        if (tip) {
            const tipY = btnY - btnH / 2 - 26;
            const tipBg = scene.add.graphics();
            tipBg.fillStyle(0x0f172a, 0.9);
            tipBg.lineStyle(1, 0x38bdf8, 0.45);
            tipBg.fillRoundedRect(modalX + 36, tipY - 17, modalW - 72, 34, 8);
            tipBg.strokeRoundedRect(modalX + 36, tipY - 17, modalW - 72, 34, 8);
            uiContainer.add(tipBg);

            const tipText = scene.add.text(width / 2, tipY, tip, {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                fontStyle: 'bold',
                fill: '#7dd3fc',
                align: 'center'
            }).setOrigin(0.5);
            uiContainer.add(tipText);
            cardsBottom = tipY - 29;
        }

        // Render 2 or 3 visual rule cards side-by-side
        const count = cards.length;
        const sidePad = 32;
        const gap = 20;
        const cardW = Math.floor((modalW - sidePad * 2 - gap * (count - 1)) / count);
        const cardH = Math.max(250, cardsBottom - contentTop);
        const firstCardLeft = modalX + sidePad;

        cards.forEach((card, idx) => {
            const cardLeft = firstCardLeft + idx * (cardW + gap);
            const cardCx = cardLeft + cardW / 2;
            const accentStr = card.color || themeColorStr;
            const accentHex = Phaser.Display.Color.HexStringToColor(accentStr).color;

            const cardBg = scene.add.graphics();
            cardBg.fillStyle(0x0f172a, 0.96);
            cardBg.lineStyle(2, accentHex, 0.85);
            cardBg.fillRoundedRect(cardLeft, contentTop, cardW, cardH, 14);
            cardBg.strokeRoundedRect(cardLeft, contentTop, cardW, cardH, 14);
            uiContainer.add(cardBg);

            // Step/rule badge header pill
            OverlayDiagrams.pill(scene, uiContainer, cardCx, contentTop + 26, cardW - 28, 30, card.badge, {
                fill: accentHex,
                alpha: 0.16,
                stroke: accentHex,
                strokeWidth: 1.5,
                textColor: accentStr,
                fontSize: '14px',
                radius: 8
            });

            // Diagram viewport
            const diagW = cardW - 28;
            const diagH = Math.min(138, Math.round(cardH * 0.44));
            const diagCy = contentTop + 52 + diagH / 2 + 4;

            const diagBg = scene.add.graphics();
            diagBg.fillStyle(0x020617, 0.78);
            diagBg.lineStyle(1, 0x1e293b, 0.9);
            diagBg.fillRoundedRect(cardCx - diagW / 2, diagCy - diagH / 2, diagW, diagH, 10);
            diagBg.strokeRoundedRect(cardCx - diagW / 2, diagCy - diagH / 2, diagW, diagH, 10);
            uiContainer.add(diagBg);

            if (typeof card.drawDiagram === 'function') {
                card.drawDiagram(scene, uiContainer, cardCx, diagCy, diagW, diagH, OverlayDiagrams);
            }

            // Card caption & readable explanation
            const textTop = diagCy + diagH / 2 + 14;
            const cardHeading = scene.add.text(cardCx, textTop, card.title, {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '17px',
                fontStyle: 'bold',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0);
            uiContainer.add(cardHeading);

            const bodyText = scene.add.text(cardCx, textTop + 26, card.text, {
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '15px',
                fontStyle: 'normal',
                fill: '#cbd5e1',
                wordWrap: { width: cardW - 28 },
                align: 'center',
                lineSpacing: 4
            }).setOrigin(0.5, 0);
            uiContainer.add(bodyText);
        });
    } else {
        // Fallback plain bullet-list mode for callers passing raw `instructions`
        const instructionsTop = modalY + 140;
        const maxInstructionsH = (btnY - btnH / 2 - 20) - instructionsTop;
        const instructionsText = scene.add.text(width / 2, instructionsTop, instructions || '', {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '25px',
            fontStyle: 'bold',
            fill: '#f1f5f9',
            lineSpacing: 12,
            wordWrap: { width: modalW - 96 },
            align: 'left'
        }).setOrigin(0.5, 0);

        if (instructionsText.height > maxInstructionsH) {
            instructionsText.setFontSize(22);
            instructionsText.setLineSpacing(8);
        }
        if (instructionsText.height > maxInstructionsH) {
            instructionsText.setScale(maxInstructionsH / instructionsText.height);
        }
        uiContainer.add(instructionsText);
    }

    const btnBg = scene.add.graphics();
    btnBg.setDepth(BASE_DEPTH + 3);
    btnBg.fillStyle(themeColorHex, 0.85);
    btnBg.lineStyle(2, 0xffffff, 0.9);
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);

    const btnText = scene.add.text(btnX, btnY, 'LAUNCH MODULE', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
        fill: '#ffffff',
        letterSpacing: 1
    }).setOrigin(0.5).setDepth(BASE_DEPTH + 4);

    btnBg.setInteractive(new Phaser.Geom.Rectangle(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH), Phaser.Geom.Rectangle.Contains);

    btnBg.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(themeColorHex, 1.0);
        btnBg.lineStyle(2.5, 0xffffff, 1.0);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    });

    btnBg.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(themeColorHex, 0.85);
        btnBg.lineStyle(2, 0xffffff, 0.9);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    });

    btnBg.on('pointerdown', () => {
        overlayBg.destroy();
        uiContainer.destroy(true);
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
