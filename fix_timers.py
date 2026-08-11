import glob
import re

for fpath in glob.glob('d:/cognicore-workspace/client/games/*Scene.js'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'this.timeLeft -= 1000;' in content and 'SpeedTapScene.js' not in fpath:
        new_timer_logic = """    updateTimer() {
        if (!this.sessionStartTime || this.timeLeft <= 0) return;
        
        const elapsed = this.time.now - this.sessionStartTime;
        this.timeLeft = Math.max(0, this.gameDuration - elapsed);
        const seconds = Math.ceil(this.timeLeft / 1000);
        
        if (this.timerText && this.timerText.active) {
            this.timerText.setText(`00:${seconds < 10 ? '0' : ''}${seconds}`);
        }

        if (this.timeLeft <= 0 && !this.isGameOver) {
            this.isGameOver = true;
            this.endGame();
        }
    }"""
        
        # Replace the body of updateTimer
        content = re.sub(r'    updateTimer\(\) \{[\s\S]*?this\.timeLeft -= 1000;[\s\S]*?if \(this\.timeLeft <= 0\) \{[\s\S]*?this\.endGame\(\);[\s\S]*?\}[\s\S]*?\}', new_timer_logic.strip(), content)
        
        # Track sessionStartTime in startGameplay
        content = content.replace('startGameplay() {', 'startGameplay() {\n        this.sessionStartTime = this.time.now;\n        this.isGameOver = false;')

        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

print('Updated updateTimer in all scenes')
