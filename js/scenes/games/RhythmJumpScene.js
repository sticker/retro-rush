import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import SoundManager from '../../utils/SoundManager.js';

class RhythmJumpScene extends BaseGameScene {
  constructor() {
    super({ key: 'RhythmJumpScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 8; // 8秒間のゲーム
    this.obstacles = [];
    this.isPlaying = false;
    this.isJumping = false;
    this.beatInterval = 800; // ビート間隔
    
    this.createUI();
    this.createPlayer();
    this.createJumpButton();
    this.createThumbZoneUI();
    
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'リズムジャンプ', {
      fontSize: '24px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 8', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(1, 0);
  }

  createPlayer() {
    const groundY = this.game.config.height * 0.7;
    this.player = this.add.circle(100, groundY, 20, 0x00ff00);
    this.playerGroundY = groundY;
  }

  createJumpButton() {
    const buttonY = this.game.config.height * 0.85;
    const centerX = this.game.config.width / 2;
    
    this.jumpButton = this.add.rectangle(
      centerX, 
      buttonY, 
      200, 
      UI_CONFIG.MIN_TAP_SIZE, 
      0x0088ff
    );
    
    this.add.text(centerX, buttonY, 'JUMP', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 共通タップ判定システムを使用
    this.addTapHandler(this.jumpButton, () => {
      this.jump();
    }, { cooldown: 30 });
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 8;
    
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
      repeat: 7
    });
    
    // リズムビート開始
    this.beatTimer = this.time.addEvent({
      delay: this.beatInterval,
      callback: () => this.createBeat(),
      loop: true
    });
    
    // 最初の障害物を早めに出現
    this.time.delayedCall(100, () => {
      this.createObstacle();
    });
    
    // 障害物生成開始
    this.obstacleTimer = this.time.addEvent({
      delay: 1200, // 適度な間隔に調整
      callback: () => this.createObstacle(),
      loop: true
    });
  }

  createBeat() {
    if (!this.isPlaying) return;
    
    // ビートインジケーター表示
    const beat = this.add.circle(50, 50, 15, 0xff00ff);
    RetroEffects.bounceEffect(this, beat);
    
    this.time.delayedCall(200, () => {
      if (beat) beat.destroy();
    });
  }

  createObstacle() {
    if (!this.isPlaying) return;
    
    const obstacle = this.add.rectangle(
      this.game.config.width + 10,
      this.playerGroundY,
      10,
      40,
      0xff0000
    );
    
    this.obstacles.push(obstacle);
    
    // 障害物移動（少し遅く）
    this.tweens.add({
      targets: obstacle,
      x: -250,
      duration: 3500,
      ease: 'Linear',
      onComplete: () => {
        obstacle.destroy();
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
          this.obstacles.splice(index, 1);
        }
      }
    });
  }

  jump() {
    if (!this.isPlaying || this.isJumping) return;
    
    this.isJumping = true;
    // ジャンプ音を再生
    SoundManager.playJump();
    HapticManager.tap();
    
    // ジャンプアニメーション（高さと時間を調整）
    this.tweens.add({
      targets: this.player,
      y: this.playerGroundY - 80, // より高く
      duration: 200, // やや長め
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false;
      }
    });
    
    // スコア加算（リズムに合わせたボーナス）
    this.score += 50;
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  update() {
    if (!this.isPlaying) return;
    
    // 衝突判定
    this.obstacles.forEach(obstacle => {
      if (!obstacle.active) return;
      
      const playerBounds = this.player.getBounds();
      const obstacleBounds = obstacle.getBounds();
      
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, obstacleBounds)) {
        if (!this.isJumping) {
          this.hitObstacle(obstacle);
        }
      }
    });
  }

  hitObstacle(obstacle) {
    HapticManager.fail();
    RetroEffects.createParticles(this, obstacle.x, obstacle.y, 'fail');
    
    obstacle.destroy();
    const index = this.obstacles.indexOf(obstacle);
    if (index > -1) {
      this.obstacles.splice(index, 1);
    }
    
    // ライフ概念を削除
    this.showQuickFeedback('HIT!', 0xff0000, this.player.x, this.player.y - 30);
  }

  endGame() {
    this.isPlaying = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    if (this.beatTimer) this.beatTimer.destroy();
    if (this.obstacleTimer) this.obstacleTimer.destroy();
    
    // 残った障害物を削除
    this.obstacles.forEach(obstacle => obstacle.destroy());
    this.obstacles = [];
    
    ScoreManager.addScore(this.score);
    
    // クリア判定
    const isCleared = this.score >= 300;
    
    if (isCleared) {
      // クリア時のみゲーム完了としてカウント
      ScoreManager.completeGame();
      this.showClearEffect();
    } else {
      this.showFailEffect();
    }
    
    this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
      this.endGameAndTransition();
    });
  }
}

export default RhythmJumpScene;