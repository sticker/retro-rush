import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';

class MissileDefenseScene extends BaseGameScene {
  constructor() {
    super({ key: 'MissileDefenseScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 7; // 7秒間のゲーム
    this.missiles = [];
    this.buildings = [];
    this.missilesDestroyed = 0;
    this.isPlaying = false;
    
    this.createUI();
    this.createBuildings();
    this.createThumbZoneUI();
    
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'ミサイルディフェンス', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 7', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(1, 0);
    
    // 撃墜数表示
    this.destroyedText = this.add.text(centerX, 100, '撃墜: ☆☆☆☆☆', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, 120, 'ミサイルをタップして撃墜せよ！', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
  }

  createBuildings() {
    const groundY = this.game.config.height * 0.85;
    const buildingWidth = 40;
    const buildingCount = 5;
    const spacing = (this.game.config.width - (buildingCount * buildingWidth)) / (buildingCount + 1);
    
    for (let i = 0; i < buildingCount; i++) {
      const x = spacing + (i * (buildingWidth + spacing)) + buildingWidth / 2;
      const height = Phaser.Math.Between(50, 80);
      
      const building = this.add.rectangle(x, groundY - height / 2, buildingWidth, height, 0x666666);
      building.setStrokeStyle(2, 0x444444);
      this.buildings.push(building);
      
      // ビルの窓
      for (let row = 0; row < Math.floor(height / 15); row++) {
        for (let col = 0; col < 2; col++) {
          const windowX = x - 12 + (col * 24);
          const windowY = groundY - height + 10 + (row * 15);
          const window = this.add.rectangle(windowX, windowY, 6, 8, 0xffff00);
          window.setAlpha(0.8);
        }
      }
    }
  }

  startGame() {
    this.isPlaying = true;
    // this.score = 0;
    // this.timeLeft = 7;
    // this.missilesDestroyed = 0;
    
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
    
    // ミサイル生成開始
    this.missileTimer = this.time.addEvent({
      delay: 1000, // 間隔を少し長く
      callback: () => this.spawnMissile(),
      loop: true
    });
    
    this.spawnMissile(); // 最初のミサイルを即座に生成
  }

  spawnMissile() {
    if (!this.isPlaying) return;
    
    const startX = Phaser.Math.Between(50, this.game.config.width - 50);
    const startY = 150;
    const targetY = this.game.config.height * 0.85;
    
    // ミサイル本体
    const missile = this.add.rectangle(startX, startY, 12, 30, 0xff0000);
    missile.setStrokeStyle(2, 0xaa0000);
    
    // ミサイルの先端
    const tip = this.add.triangle(startX, startY - 20, 0, 15, 6, 0, -6, 0, 0xffff00);
    
    // ミサイルの炎エフェクト（軽量化）
    const flame = this.add.circle(startX, startY + 20, 6, 0xff8800);
    flame.setAlpha(0.6);
    
    missile.tip = tip;
    missile.flame = flame;
    missile.isDestroyed = false;
    
    // 共通タップ判定システムを使用
    this.addTapHandler(missile, (obj) => {
      if (this.isPlaying && !obj.isDestroyed) {
        this.destroyMissile(obj);
      }
    }, { cooldown: 10 }); // さらに短く
    
    this.missiles.push(missile);
    
    // ミサイル移動
    this.tweens.add({
      targets: [missile, tip, flame],
      y: `+=${targetY - startY}`,
      duration: 3000,
      ease: 'Linear',
      onUpdate: () => {
        if (missile.tip) {
          missile.tip.x = missile.x;
          missile.flame.x = missile.x;
        }
      },
      onComplete: () => {
        if (!missile.isDestroyed) {
          this.missileHitGround(missile);
        }
      }
    });
  }

  destroyMissile(missile) {
    // 重複防止
    if (missile.isDestroyed || !missile.active) return;
    
    missile.isDestroyed = true;
    this.removeTapHandler(missile); // タップハンドラーを削除
    
    this.missilesDestroyed++;
    this.score += 200;
    
    // ミサイル撃墜エフェクト
    HapticManager.success();
    RetroEffects.createParticles(this, missile.x, missile.y, 'success');
    this.showQuickFeedback('撃墜!', 0x00ff00, missile.x, missile.y - 30);
    
    // ミサイルを削除
    if (missile && missile.destroy) missile.destroy();
    if (missile.tip && missile.tip.destroy) missile.tip.destroy();
    if (missile.flame && missile.flame.destroy) missile.flame.destroy();
    
    const index = this.missiles.indexOf(missile);
    if (index > -1) {
      this.missiles.splice(index, 1);
    }
    
    // UI更新
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.updateDestroyedDisplay();
    
    if (this.missilesDestroyed >= 5) {
      this.endGame();
    }
  }

  missileHitGround(missile) {
    if (missile.isDestroyed) return;
    
    // 爆発エフェクト
    HapticManager.fail();
    RetroEffects.createParticles(this, missile.x, missile.y, 'fail');
    this.showQuickFeedback('被弾!', 0xff0000, missile.x, missile.y - 30);
    
    // ミサイルを削除
    if (missile && missile.destroy) missile.destroy();
    if (missile.tip && missile.tip.destroy) missile.tip.destroy();
    if (missile.flame && missile.flame.destroy) missile.flame.destroy();
    
    const index = this.missiles.indexOf(missile);
    if (index > -1) {
      this.missiles.splice(index, 1);
    }
  }

  updateDestroyedDisplay() {
    let display = '';
    for (let i = 0; i < 5; i++) {
      display += i < this.missilesDestroyed ? '★' : '☆';
    }
    this.destroyedText.setText(`撃墜: ${display}`);
  }

  endGame() {
    this.isPlaying = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    if (this.missileTimer) this.missileTimer.destroy();
    
    // 残ったミサイルを削除
    this.missiles.forEach(missile => {
      if (!missile.isDestroyed) {
        missile.destroy();
        if (missile.tip) missile.tip.destroy();
        if (missile.flame) missile.flame.destroy();
      }
    });
    this.missiles = [];
    
    ScoreManager.addScore(this.score);
    ScoreManager.completeGame();
    
    // 結果表示
    const resultText = this.missilesDestroyed >= 5 ? 'PERFECT!' : `${this.missilesDestroyed}/5 撃墜`;
    const resultColor = this.missilesDestroyed >= 5 ? 0x00ff00 : 0xffff00;
    
    this.add.text(this.game.config.width / 2, this.game.config.height / 2, resultText, {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: Phaser.Display.Color.IntegerToColor(resultColor).rgba
    }).setOrigin(0.5);
    
    this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
      this.endGameAndTransition();
    });
  }
}

export default MissileDefenseScene;