import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import BootScene from '../games/BootScene';

/**
 * A centralized React Hook for safely instantiating and tearing down a Phaser Game instance.
 * - Enforces single-canvas initialization even under React 18 Strict Mode.
 * - Handles auto-scaling logic for desktop vs. mobile.
 * - Boots the global `BootScene` first to pre-allocate memory and textures.
 */
export function usePhaserEngine(containerRef, gameState, sceneClass, sceneKey, sceneData) {
    const phaserInstanceRef = useRef(null);

    useEffect(() => {
        if (gameState !== 'PLAYING' || !containerRef.current) {
            return;
        }

        // Prevent double instantiation
        if (phaserInstanceRef.current) {
            return;
        }

        console.log(`[usePhaserEngine] Booting Phaser for ${sceneKey}...`);

        const config = {
            type: Phaser.AUTO,
            parent: containerRef.current,
            backgroundColor: '#09090b',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: window.innerWidth < 768 ? window.innerWidth : 800,
                height: window.innerWidth < 768 ? Math.round(window.innerWidth * 0.75) : 600,
            },
            scene: [BootScene, sceneClass]
        };

        const game = new Phaser.Game(config);
        phaserInstanceRef.current = game;
        window.phaserGame = game;

        // Transition gracefully through the BootScene to the target scene
        game.events.once('ready', () => {
            game.scene.start('BootScene', {
                nextScene: sceneKey,
                nextSceneData: sceneData
            });
        });

        // Cleanup function for React unmount
        return () => {
            if (phaserInstanceRef.current) {
                console.log(`[usePhaserEngine] Tearing down Phaser for ${sceneKey}...`);
                phaserInstanceRef.current.destroy(true);
                phaserInstanceRef.current = null;
                window.phaserGame = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, sceneKey]); // Exclude containerRef, sceneClass, and sceneData from deps as they shouldn't trigger re-boots

    return phaserInstanceRef;
}
