import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';

class ColorMatchScene extends BaseGameScene {
  constructor() {
    super({ key: 'ColorMatchScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 6; // 6秒間のゲーム
    this.isPlaying = false;
    this.currentColor = null;
    this.colorButtons = [];
    
    this.colors = [
      { name: 'RED', value: 0xff0000 },
      { name: 'GREEN', value: 0x00ff00 },
      { name: 'BLUE', value: 0x0000ff },
      { name: 'YELLOW', value: 0xffff00 }
    ];
    
    this.createUI();
    this.createColorButtons();
    this.createThumbZoneUI();
    
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'カラーマッチ', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 6', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(1, 0);
    
    // 色表示エリア
    const centerY = this.game.config.height * 0.35;
    this.colorDisplay = this.add.circle(centerX, centerY, 40, 0xffffff);
    this.colorDisplay.setStrokeStyle(3, 0x000000);
    
    this.colorNameText = this.add.text(centerX, centerY + 80, '', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  createColorButtons() {
    const thumbStartY = this.game.config.height * UI_CONFIG.THUMB_ZONE.startY + 100;
    const width = this.game.config.width;
    const buttonSize = 60;
    
    // 2x2のボタン配置
    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = (width / 3) * (col + 1);
      const y = thumbStartY + (row * 80);
      
      const button = this.add.circle(x, y, buttonSize / 2, this.colors[i].value);
      button.setStrokeStyle(2, 0xffffff);
      button.colorData = this.colors[i];
      
      // 共通タップ判定システムを使用
      this.addTapHandler(button, (obj) => {
        if (this.isPlaying) {
          this.checkColor(obj.colorData);
        }
      }, { cooldown: 100 }); // 色判定には少し長めのクールダウン
      
      button.on('pointerover', () => {
        button.setScale(1.1);
      });
      
      button.on('pointerout', () => {
        button.setScale(1.0);
      });
      
      this.colorButtons.push(button);
    }
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 6;
    
    // タイマー開始
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(`TIME: ${this.timeLeft}`);
        
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      repeat: 5
    });
    
    // 色変更開始
    this.showNewColor();
    this.colorTimer = this.time.addEvent({
      delay: 1500,
      callback: () => this.showNewColor(),
      loop: true
    });
  }

  showNewColor() {
    if (!this.isPlaying) return;
    
    this.currentColor = Phaser.Utils.Array.GetRandom(this.colors);
    this.colorDisplay.setFillStyle(this.currentColor.value);
    this.colorNameText.setText(this.currentColor.name);
    
    RetroEffects.bounceEffect(this, this.colorDisplay);
  }

  checkColor(selectedColor) {
    if (!this.currentColor) return;
    
    const isCorrect = selectedColor.name === this.currentColor.name;
    
    if (isCorrect) {
      this.score += 200;
      this.scoreText.setText(`SCORE: ${this.score}`);
      
      HapticManager.success();
      RetroEffects.createParticles(this, this.colorDisplay.x, this.colorDisplay.y, 'success');
      this.showQuickFeedback('CORRECT!', 0x00ff00, this.colorDisplay.x, this.colorDisplay.y - 60);
      
      // 即座に次の色を表示
      this.showNewColor();
    } else {
      HapticManager.fail();
      RetroEffects.createParticles(this, this.colorDisplay.x, this.colorDisplay.y, 'fail');
      this.showQuickFeedback('WRONG!', 0xff0000, this.colorDisplay.x, this.colorDisplay.y - 60);
      
      // ライフ概念を削除
    }
  }

  endGame() {
    this.isPlaying = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    if (this.colorTimer) this.colorTimer.destroy();
    
    ScoreManager.addScore(this.score);
    ScoreManager.completeGame();
    
    this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
      this.endGameAndTransition();
    });
  }
}

export default ColorMatchScene;