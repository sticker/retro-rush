import UI_CONFIG from '../utils/UI_CONFIG.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';

// ベースシーンクラス（共通機能）
class BaseGameScene extends Phaser.Scene {
  createThumbZoneUI() {
    const height = this.game.config.height;
    const thumbStartY = height * UI_CONFIG.THUMB_ZONE.startY;
    
    // 操作エリアの視覚的表示
    const thumbZone = this.add.rectangle(
      this.game.config.width / 2,
      thumbStartY + (height * UI_CONFIG.THUMB_ZONE.endY - thumbStartY) / 2,
      this.game.config.width - UI_CONFIG.DEAD_ZONE * 2,
      height * UI_CONFIG.THUMB_ZONE.endY - thumbStartY,
      0x000000,
      0
    );
    thumbZone.setStrokeStyle(1, 0x333333, 0.3);
    
    return thumbZone;
  }
  
  showQuickFeedback(text, color, x, y) {
    const feedback = this.add.text(x, y, text, {
      fontSize: '16px',
      fill: Phaser.Display.Color.IntegerToColor(color).rgba,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: feedback,
      alpha: 0,
      y: y - 20,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => feedback.destroy()
    });
  }
  
  createCountdown(callback) {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    let count = 3;
    
    const countdownText = this.add.text(centerX, centerY, count.toString(), {
      fontSize: '48px',
      color: '#ffff00',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    const countdownTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        count--;
        HapticManager.countdown();
        
        if (count > 0) {
          countdownText.setText(count.toString());
          RetroEffects.bounceEffect(this, countdownText);
        } else if (count === 0) {
          countdownText.setText('GO!');
          countdownText.setStyle({ color: '#00ff00' });
          RetroEffects.bounceEffect(this, countdownText);
        } else {
          countdownText.destroy();
          callback();
        }
      },
      repeat: 4
    });
  }
}

export default BaseGameScene;