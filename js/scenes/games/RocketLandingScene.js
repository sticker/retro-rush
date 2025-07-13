import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import SoundManager from '../../utils/SoundManager.js';

class RocketLandingScene extends BaseGameScene {
  constructor() {
    super({ key: 'RocketLandingScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 10; // 10秒間のゲーム
    this.successfulLandings = 0;
    this.requiredLandings = 1; // 1回成功でクリア
    this.isPlaying = false;
    this.rocketSpeed = 0;
    this.gravity = 0.1; // 重力を強めに
    this.thrustPower = -0.25; // 噴射力も強めに
    this.maxSpeed = 3; // 最高速度を上げる
    this.isThrusting = false;
    this.isProcessingLanding = false; // 着陸処理中フラグ
    this.isLanded = false; // 着陸済みフラグ
    
    this.createUI();
    this.createLandingPad();
    this.createRocket();
    this.createThrustButton();
    this.createThumbZoneUI();
    
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'ロケットランディング', {
      fontSize: '24px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 10', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(1, 0);
    
    // 着陸成功数表示
    // this.landingText = this.add.text(centerX, 120, `着陸: 0/${this.requiredLandings}`, {
    //   fontSize: '20px',
    //   fontFamily: UI_CONFIG.FONT.family,
    //   color: '#00ffff'
    // }).setOrigin(0.5);
  }

  createLandingPad() {
    const groundY = this.game.config.height * 0.8;
    const centerX = this.game.config.width / 2;
    
    // 地面
    this.add.rectangle(centerX, groundY + 20, this.game.config.width, 40, 0x666666);
    
    // 着陸パッド（より広く）
    this.landingPad = this.add.rectangle(centerX, groundY, 200, 10, 0x00ff00);
    this.landingPadY = groundY;
    
    // 着陸パッドのマーカー
    this.add.text(centerX - 90, groundY + 15, '◀', {
      fontSize: '16px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#00ff00'
    });
    
    this.add.text(centerX + 90, groundY + 15, '▶', {
      fontSize: '16px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#00ff00'
    });
  }

  createRocket() {
    const centerX = this.game.config.width / 2;
    const startY = 100; // もう少し高い位置から開始
    
    // ロケット本体（三角形として表現）
    this.rocket = this.add.triangle(centerX, startY, 0, -20, -10, 10, 10, 10, 0xff6600);
    this.rocketStartY = startY;
    
    // 炎エフェクト用
    this.flame = this.add.triangle(centerX, startY + 15, 0, 0, -5, 10, 5, 10, 0xffff00);
    this.flame.setVisible(false);
  }

  createThrustButton() {
    const buttonY = this.game.config.height * 0.9;
    const centerX = this.game.config.width / 2;
    
    this.thrustButton = this.add.rectangle(
      centerX, 
      buttonY, 
      250, 
      UI_CONFIG.MIN_TAP_SIZE, 
      0xff0066
    );
    
    this.add.text(centerX, buttonY, '噴射', {
      fontSize: '22px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // タップで噴射
    this.thrustButton.setInteractive();
    this.thrustButton.on('pointerdown', () => {
      this.isThrusting = true;
    });
    
    this.thrustButton.on('pointerup', () => {
      this.isThrusting = false;
    });
    
    this.thrustButton.on('pointerout', () => {
      this.isThrusting = false;
    });
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 10;
    this.successfulLandings = 0;
    // resetRocket()の呼び出しを削除（ロケットは既に初期位置にある）
    
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
      repeat: 9
    });
  }

  resetRocket() {
    // ロケットを初期位置に戻す
    const centerX = this.game.config.width / 2;
    this.rocket.setPosition(centerX, this.rocketStartY);
    this.flame.setPosition(centerX, this.rocketStartY + 15);
    this.rocketSpeed = 0;
    this.isProcessingLanding = false; // フラグをリセット
    this.isLanded = false; // 着陸済みフラグもリセット
  }

  update() {
    if (!this.isPlaying || this.isLanded) return; // 着陸済みなら何もしない
    
    // 重力を適用
    this.rocketSpeed += this.gravity;
    
    // 噴射中の処理
    if (this.isThrusting) {
      this.rocketSpeed += this.thrustPower;
      this.flame.setVisible(true);
      this.flame.setPosition(this.rocket.x, this.rocket.y + 15);
      
      // 噴射エフェクト
      if (Phaser.Math.Between(0, 1) === 0) {
        this.createThrustParticle();
      }
    } else {
      this.flame.setVisible(false);
    }
    
    // 速度制限
    this.rocketSpeed = Phaser.Math.Clamp(this.rocketSpeed, -this.maxSpeed, this.maxSpeed);
    
    // ロケットを移動
    this.rocket.y += this.rocketSpeed;
    this.flame.y = this.rocket.y + 15;
    
    // 着陸判定
    if (!this.isProcessingLanding && this.rocket.y >= this.landingPadY - 10) {
      this.isProcessingLanding = true;
      this.checkLanding();
    }
    
    // 画面外判定
    if (!this.isProcessingLanding && this.rocket.y > this.game.config.height) {
      this.isProcessingLanding = true;
      this.crashRocket();
    }
  }

  createThrustParticle() {
    const particle = this.add.circle(
      this.rocket.x + Phaser.Math.Between(-5, 5),
      this.rocket.y + 20,
      3,
      0xffaa00
    );
    
    this.tweens.add({
      targets: particle,
      y: particle.y + 30,
      alpha: 0,
      duration: 300,
      onComplete: () => particle.destroy()
    });
  }

  checkLanding() {
    // 着陸速度をチェック（適度な判定）
    if (Math.abs(this.rocketSpeed) < 2.3) {
      // 成功
      this.successfulLanding();
    } else {
      // 失敗（速すぎる）
      this.crashRocket();
    }
  }

  successfulLanding() {
    // 着陸済みフラグを立てる（これによりupdate関数が停止）
    this.isLanded = true;
    
    // ロケットを着陸パッドに固定
    this.rocketSpeed = 0;
    this.rocket.y = this.landingPadY - 10;
    this.flame.y = this.rocket.y + 15;

    this.isThrusting = false;
    this.successfulLandings++;
    this.score += 1500;
    
    SoundManager.playCorrect();
    HapticManager.success();
    
    // 成功エフェクト
    RetroEffects.createParticles(this, this.rocket.x, this.rocket.y, 'success');
    this.showQuickFeedback('PERFECT!', 0x00ff00, this.rocket.x, this.rocket.y - 40);
    
    // UI更新
    this.scoreText.setText(`SCORE: ${this.score}`);
    // this.landingText.setText(`着陸: ${this.successfulLandings}/${this.requiredLandings}`);
    
    // クリアチェック
    if (this.successfulLandings >= this.requiredLandings) {
      // 即座にゲーム終了（ナイス！表示のため）
      this.endGame();
    } else {
      // 次のロケット
      this.time.delayedCall(1000, () => this.resetRocket());
    }
  }

  crashRocket() {
    this.isThrusting = false;
    
    SoundManager.playDestroy();
    HapticManager.fail();
    
    // 爆発エフェクト
    RetroEffects.createParticles(this, this.rocket.x, this.rocket.y, 'fail');
    this.showQuickFeedback('CRASH!', 0xff0000, this.rocket.x, this.rocket.y - 40);
    
    // 次のロケット
    this.time.delayedCall(1000, () => this.resetRocket());
  }

  endGame() {
    this.isPlaying = false;
    this.isThrusting = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    
    ScoreManager.addScore(this.score);
    
    // クリア判定
    const isCleared = this.successfulLandings >= this.requiredLandings;
    
    if (isCleared) {
      // クリア時のみゲーム完了としてカウント
      ScoreManager.completeGame();
      this.showClearEffect(() => {
        this.endGameAndTransition();
      });
    } else {
      this.showFailEffect();
      this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
        this.endGameAndTransition();
      });
    }
  }
}

export default RocketLandingScene;