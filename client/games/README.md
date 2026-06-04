# Phaser 3 Game Scene Telemetry & Micro-Behavior Tracking Guide

This guide outlines the standard telemetry patterns required for all Phaser 3 game scenes on the CogniCore platform. When adding a new game, you **must** implement these tracking patterns to feed high-fidelity micro-behaviors to the Random Forest cognitive archetype classifier.

---

## 1. Metric Specifications

### A. Hesitation Latency (`hesitation_ms`)
Measures the duration between the start of a stimulus or a phase shift (e.g., targets flashing ends, puzzle spawning) and the player's very first cursor movement or mouse click in the canvas.
*   **Data Type:** `REAL` (milliseconds)
*   **Trigger Moment:** Reset on every new puzzle or target state change.
*   **Interaction Event:** First global pointer move (`pointermove`) or click (`pointerdown`) on the canvas frame.

### B. Frustration Spam Click Count (`spam_click_count`)
Detects panic or frustration by counting click actions in non-interactive areas (dead zones) with high frequency.
*   **Data Type:** `INTEGER` (cumulative session count)
*   **Trigger Threshold:** Clicks on empty space (`gameObjects.length === 0`) spaced **less than 200 milliseconds** apart (equivalent to > 5 clicks/second).

---

## 2. Step-by-Step Implementation Template

### Step 1: Initialize Session Variables
In the scene's `init(data)` block, initialize the tracking states:

```javascript
init(data) {
    // ... standard DDA/session setup ...

    // Micro-behavior metrics
    this.stimulusSpawnTime = 0;
    this.firstInteractionRegistered = false;
    this.firstInteractionLatency = 0;
    this.spamClickCount = 0;
    this.lastMissTime = 0;
}
```

### Step 2: Bind Global Pointer Listeners
In the scene's `create()` block, bind global Phaser input listeners:

```javascript
create() {
    // ... layout / graphics drawing ...

    // Micro-behavior tracking listeners
    this.input.on('pointerdown', (pointer, gameObjects) => {
        this.registerFirstInteraction();
        
        // If clicking a dead zone (non-interactive area)
        if (gameObjects.length === 0) {
            const now = this.time.now;
            // Catch clicks faster than 5 per second (delta < 200ms)
            if (now - this.lastMissTime < 200) {
                this.spamClickCount++;
            }
            this.lastMissTime = now;
        }
    });

    this.input.on('pointermove', () => {
        this.registerFirstInteraction();
    });
}
```

### Step 3: Mark Stimulus Spawning Moments
Whenever a new wave, puzzle, or grid sequence becomes interactable (active state change), mark the base timestamp:

```javascript
startNewPuzzle() {
    // ... drawing puzzle elements ...

    // Mark stimulus spawn time and clear interaction flag
    this.stimulusSpawnTime = this.time.now;
    this.firstInteractionRegistered = false;
    this.firstInteractionLatency = 0;
}
```

### Step 4: Add the First Interaction Helper
Define the method that calculates latency once per stimulus interval:

```javascript
registerFirstInteraction() {
    if (!this.firstInteractionRegistered && this.stimulusSpawnTime > 0) {
        this.firstInteractionLatency = this.time.now - this.stimulusSpawnTime;
        this.firstInteractionRegistered = true;
    }
}
```

### Step 5: Append to dispatchMetricTelemetry
Ensure both metrics are appended to the POST payload sent to the `/api/submit-metrics` backend API:

```javascript
async dispatchMetricTelemetry(reactionTimeMs, accuracyRate) {
    if (!this.sessionId) return;

    const payload = {
        session_id: this.sessionId,
        cognitive_domain: "your_parent_domain",
        game_type: "your_game_type",
        reaction_time: reactionTimeMs,
        accuracy_rate: accuracyRate,
        difficulty: this.difficultyLevel,
        error_count: accuracyRate === 1.0 ? 0 : 1,
        
        // Micro-behavior metric integrations
        hesitation_ms: this.firstInteractionLatency || 0,
        spam_click_count: this.spamClickCount
    };

    try {
        await fetch(`${this.apiUrl}/api/submit-metrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.warn('[Telemetry Dispatch] Failed to send telemetry', e);
    }
}
```
