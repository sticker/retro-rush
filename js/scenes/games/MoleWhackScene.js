import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import SoundManager from '../../utils/SoundManager.js';

class MoleWhackScene extends BaseGameScene {
  constructor() {
    super({ key: 'MoleWhackScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 5; // 5秒間のゲーム
    this.moles = [];
    this.isPlaying = false;
    
    // UI作成
    this.createUI();
    this.createMoles();
    this.createThumbZoneUI();
    
    // カウントダウン開始
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'モグラタタキ', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 5', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(1, 0);
  }

  createMoles() {
    const thumbStartY = this.game.config.height * UI_CONFIG.THUMB_ZONE.startY;
    const thumbEndY = this.game.config.height * UI_CONFIG.THUMB_ZONE.endY;
    const width = this.game.config.width;
    
    // 3x3のモグラ配置
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = (width / 4) * (col + 1);
        const y = thumbStartY + ((thumbEndY - thumbStartY) / 4) * (row + 1);
        
        const mole = this.add.circle(x, y, 25, 0x8b4513);
        mole.setStrokeStyle(2, 0x654321);
        mole.setVisible(false);
        
        // 共通タップ判定システムを使用
        this.addTapHandler(mole, (obj) => {
          if (this.isPlaying && obj.visible) {
            this.hitMole(obj);
          }
        }, { cooldown: 30 });
        
        this.moles.push(mole);
      }
    }
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 5;
    
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
      repeat: 4
    });
    
    // モグラ出現開始
    this.moleTimer = this.time.addEvent({
      delay: 800,
      callback: () => this.showRandomMole(),
      loop: true
    });
  }

  showRandomMole() {
    if (!this.isPlaying) return;
    
    // ランダムなモグラを表示
    const hiddenMoles = this.moles.filter(mole => !mole.visible);
    if (hiddenMoles.length > 0) {
      const mole = Phaser.Utils.Array.GetRandom(hiddenMoles);
      mole.setVisible(true);
      
      // 1秒後に自動で隠す
      this.time.delayedCall(1000, () => {
        if (mole.visible) {
          mole.setVisible(false);
        }
      });
    }
  }

  hitMole(mole) {
    // 重複ヒットを防ぐ
    if (!mole.visible) return;
    
    mole.setVisible(false);
    
    this.score += 100;
    this.scoreText.setText(`SCORE: ${this.score}`);
    
    // ヒット音を再生
    SoundManager.playPush();
    HapticManager.success();
    RetroEffects.createParticles(this, mole.x, mole.y, 'success');
    this.showQuickFeedback('+100', 0x00ff00, mole.x, mole.y);
  }

  endGame() {
    this.isPlaying = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    if (this.moleTimer) this.moleTimer.destroy();
    
    // 全モグラを隠す
    this.moles.forEach(mole => mole.setVisible(false));
    
    ScoreManager.addScore(this.score);
    ScoreManager.completeGame();
    
    // クリア判定（例: 300点以上でクリア）
    const isCleared = this.score >= 300;
    
    if (isCleared) {
      // クリア演出
      this.showClearEffect(() => {
        this.endGameAndTransition();
      });
    } else {
      // 失敗演出
      this.showFailEffect();
      this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
        this.endGameAndTransition();
      });
    }
  }
}

export default MoleWhackScene;