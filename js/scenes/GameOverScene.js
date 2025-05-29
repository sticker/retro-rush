import ScoreManager from '../utils/ScoreManager.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    const state = ScoreManager.getGameState();
    
    // ゲーム継続判定
    const hasMoreGames = state.gamesCompleted < 3 && state.lives > 0;
    
    if (hasMoreGames) {
      // 次のゲームへ
      this.showGameResult();
    } else {
      // 最終結果
      this.showFinalResult();
    }
  }

  showGameResult() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    const state = ScoreManager.getGameState();
    
    this.add.text(centerX, centerY - 60, 'GAME CLEAR!', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY - 10, `TOTAL SCORE: ${state.totalScore}`, {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 20, `LIVES: ${state.lives}`, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 50, `GAMES: ${state.gamesCompleted}/3`, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#00ffff'
    }).setOrigin(0.5);
    
    // 自動で次のゲームへ
    this.time.delayedCall(2000, () => {
      this.startNextGame();
    });
    
    // タップで早送り
    this.input.on('pointerdown', () => {
      this.startNextGame();
    });
  }

  showFinalResult() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    const state = ScoreManager.getGameState();
    
    const isNewHighScore = ScoreManager.updateHighScore();
    
    if (isNewHighScore) {
      this.add.text(centerX, centerY - 80, 'NEW HIGH SCORE!', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ff00ff'
      }).setOrigin(0.5);
      
      HapticManager.perfect();
      RetroEffects.createParticles(this, centerX, centerY - 80, 'perfect');
    }
    
    this.add.text(centerX, centerY - 40, 'GAME OVER', {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: state.lives > 0 ? '#00ff00' : '#ff0000'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 10, `FINAL SCORE: ${state.totalScore}`, {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 40, `HIGH SCORE: ${state.highScore}`, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // メニューに戻るボタン
    const buttonY = this.game.config.height * 0.8;
    const menuButton = this.add.rectangle(
      centerX, 
      buttonY, 
      200, 
      UI_CONFIG.MIN_TAP_SIZE, 
      0x0088ff
    );
    
    const menuText = this.add.text(centerX, buttonY, 'MENU', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    menuButton.setInteractive({ useHandCursor: true });
    
    menuButton.on('pointerdown', () => {
      HapticManager.tap();
      RetroEffects.bounceEffect(this, menuButton);
      RetroEffects.bounceEffect(this, menuText);
      
      this.time.delayedCall(200, () => {
        this.scene.start('MainMenuScene');
      });
    });
    
    menuButton.on('pointerover', () => {
      menuButton.setFillStyle(0x44aaff);
    });
    
    menuButton.on('pointerout', () => {
      menuButton.setFillStyle(0x0088ff);
    });
  }

  startNextGame() {
    const state = ScoreManager.getGameState();
    ScoreManager.incrementGame();
    
    // 次のゲームを決定
    const gameScenes = ['MoleWhackScene', 'RhythmJumpScene', 'ColorMatchScene'];
    const nextScene = gameScenes[state.currentGame % 3];
    
    this.scene.start(nextScene);
  }
}

export default GameOverScene;