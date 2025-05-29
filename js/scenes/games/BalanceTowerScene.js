import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';

class BalanceTowerScene extends BaseGameScene {
  constructor() {
    super({ key: 'BalanceTowerScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 7; // 7秒間のゲーム
    this.towerBlocks = [];
    this.towerAngle = 0;
    this.angularVelocity = 0;
    this.isPlaying = false;
    this.isFallen = false;
    this.sensitivity = 0.5; // 傾きの感度
    
    this.createUI();
    this.createTower();
    this.createThumbZoneUI();
    
    // 傾きセンサーの初期化
    this.setupDeviceOrientation();
    
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'バランスタワー', {
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
    
    // タイムバー
    this.timeBarBg = this.add.rectangle(centerX, 100, 200, 20, 0x333333);
    this.timeBarBg.setStrokeStyle(2, 0x666666);
    this.timeBar = this.add.rectangle(centerX - 100, 100, 200, 16, 0x00ff00);
    this.timeBar.setOrigin(0, 0.5);
    
    this.add.text(centerX, 120, 'スマホを傾けてバランスを取れ！', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // フォールバック用のタッチコントロール説明
    this.add.text(centerX, this.game.config.height - 60, '※傾きセンサー非対応の場合は\n左右タップで操作', {
      fontSize: '10px',
      fontFamily: 'Courier New',
      color: '#888888'
    }).setOrigin(0.5);
  }

  createTower() {
    const centerX = this.game.config.width / 2;
    const groundY = this.game.config.height * 0.8;
    const blockHeight = 20;
    const towerHeight = 7;
    
    // 地面
    this.ground = this.add.rectangle(centerX, groundY + 10, this.game.config.width, 20, 0x654321);
    this.ground.setStrokeStyle(2, 0x543210);
    
    // タワーブロック作成
    for (let i = 0; i < towerHeight; i++) {
      const blockWidth = 40 - (i * 2); // 上に行くほど細くなる
      const y = groundY - (i * blockHeight) - blockHeight / 2;
      
      const block = this.add.rectangle(centerX, y, blockWidth, blockHeight, 0xcccccc);
      block.setStrokeStyle(2, 0x999999);
      block.originalY = y;
      block.originalX = centerX;
      this.towerBlocks.push(block);
    }
  }

  setupDeviceOrientation() {
    this.deviceOrientationSupported = false;
    this.currentGamma = 0;
    
    // DeviceOrientationEvent の対応チェック
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // iOS 13+ では許可が必要
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // リクエストは実際のユーザーインタラクション時に行う
        this.needsPermissionRequest = true;
      } else {
        this.setupOrientationListener();
      }
    }
    
    // フォールバック: タッチコントロール
    this.setupTouchControls();
  }

  setupOrientationListener() {
    window.addEventListener('deviceorientation', (event) => {
      if (this.isPlaying && !this.isFallen) {
        // gamma: 左右の傾き (-90 to 90)
        this.currentGamma = event.gamma || 0;
        this.deviceOrientationSupported = true;
      }
    });
  }

  setupTouchControls() {
    // 左右のタッチエリア
    const leftArea = this.add.rectangle(this.game.config.width * 0.25, this.game.config.height * 0.9, 
      this.game.config.width * 0.4, 60, 0x000000, 0.1);
    leftArea.setStrokeStyle(1, 0x444444);
    leftArea.setInteractive();
    leftArea.on('pointerdown', () => {
      if (this.isPlaying && !this.isFallen) {
        this.currentGamma = Math.max(this.currentGamma - 10, -30);
      }
    });
    
    const rightArea = this.add.rectangle(this.game.config.width * 0.75, this.game.config.height * 0.9, 
      this.game.config.width * 0.4, 60, 0x000000, 0.1);
    rightArea.setStrokeStyle(1, 0x444444);
    rightArea.setInteractive();
    rightArea.on('pointerdown', () => {
      if (this.isPlaying && !this.isFallen) {
        this.currentGamma = Math.min(this.currentGamma + 10, 30);
      }
    });
    
    this.add.text(this.game.config.width * 0.25, this.game.config.height * 0.9, '左', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#666666'
    }).setOrigin(0.5);
    
    this.add.text(this.game.config.width * 0.75, this.game.config.height * 0.9, '右', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#666666'
    }).setOrigin(0.5);
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 7;
    this.towerAngle = 0;
    this.angularVelocity = 0;
    this.isFallen = false;
    
    // iOS の場合、許可リクエスト
    if (this.needsPermissionRequest) {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            this.setupOrientationListener();
          }
        })
        .catch(console.error);
    }
    
    // タイマー開始
    this.gameTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        this.timeLeft -= 0.1;
        this.timeText.setText(`TIME: ${Math.max(0, this.timeLeft).toFixed(1)}`);
        
        // タイムバー更新
        const timeRatio = Math.max(0, this.timeLeft / 7);
        this.timeBar.setScale(timeRatio, 1);
        
        if (this.timeLeft <= 0) {
          this.endGame(true); // 成功
        }
      },
      loop: true
    });
    
    // 物理シミュレーション開始
    this.physicsTimer = this.time.addEvent({
      delay: 16, // 60FPS
      callback: () => this.updatePhysics(),
      loop: true
    });
    
    // 自動的な揺れを追加
    this.disturbanceTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isPlaying && !this.isFallen) {
          this.angularVelocity += (Math.random() - 0.5) * 0.02;
        }
      },
      loop: true
    });
  }

  updatePhysics() {
    if (!this.isPlaying || this.isFallen) return;
    
    // 重力による傾きの影響
    const gravity = 0.001;
    this.angularVelocity += Math.sin(this.towerAngle) * gravity;
    
    // ユーザーの傾き操作を反映
    if (this.deviceOrientationSupported) {
      const targetAngle = -this.currentGamma * 0.02; // gammaを角度に変換
      this.angularVelocity += (targetAngle - this.towerAngle) * 0.01;
    } else {
      // フォールバック: 現在のgammaをそのまま使用
      const targetAngle = -this.currentGamma * 0.02;
      this.angularVelocity += (targetAngle - this.towerAngle) * 0.01;
    }
    
    // 減衰
    this.angularVelocity *= 0.98;
    
    // 角度更新
    this.towerAngle += this.angularVelocity;
    
    // タワーの倒壊判定
    if (Math.abs(this.towerAngle) > Math.PI / 6) { // 30度以上で倒壊
      this.towerFall();
      return;
    }
    
    // タワーブロックの位置更新
    this.updateTowerPosition();
    
    // スコア加算（生存時間に応じて）
    this.score += 1;
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  updateTowerPosition() {
    const centerX = this.game.config.width / 2;
    
    this.towerBlocks.forEach((block, index) => {
      const height = index * 20;
      const offsetX = Math.sin(this.towerAngle) * height;
      
      block.x = centerX + offsetX;
      block.rotation = this.towerAngle;
    });
  }

  towerFall() {
    if (this.isFallen) return;
    
    this.isFallen = true;
    HapticManager.fail();
    
    // タワー倒壊アニメーション
    this.towerBlocks.forEach((block, index) => {
      const fallDirection = this.towerAngle > 0 ? 1 : -1;
      const delay = index * 50;
      
      this.time.delayedCall(delay, () => {
        this.tweens.add({
          targets: block,
          x: block.x + fallDirection * 100,
          y: block.y + 50,
          rotation: this.towerAngle + fallDirection * Math.PI / 4,
          alpha: 0.5,
          duration: 800,
          ease: 'Bounce.easeOut'
        });
      });
    });
    
    this.showQuickFeedback('倒壊！', 0xff0000, this.game.config.width / 2, this.game.config.height / 2);
    
    this.time.delayedCall(1000, () => {
      this.endGame(false); // 失敗
    });
  }

  endGame(success) {
    this.isPlaying = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    if (this.physicsTimer) this.physicsTimer.destroy();
    if (this.disturbanceTimer) this.disturbanceTimer.destroy();
    
    ScoreManager.addScore(this.score);
    ScoreManager.completeGame();
    
    // 結果表示
    if (success && !this.isFallen) {
      HapticManager.success();
      this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'SUCCESS!', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#00ff00'
      }).setOrigin(0.5);
      RetroEffects.createParticles(this, this.game.config.width / 2, this.game.config.height / 2, 'success');
    }
    
    this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
      this.scene.start('GameOverScene');
    });
  }
}

export default BalanceTowerScene;