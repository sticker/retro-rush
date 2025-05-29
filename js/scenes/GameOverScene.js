import ScoreManager from '../utils/ScoreManager.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const state = ScoreManager.getGameState();
    
    // 次のゲームがあるかチェック
    ScoreManager.incrementGame();
    const hasMoreGames = ScoreManager.hasMoreGames();
    
    if (hasMoreGames) {
      // 次のゲームへ
      this.showGameTransition();
    } else {
      // 最終結果（5ゲーム完了）
      this.showFinalResult();
    }
  }

  showGameTransition() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    const state = ScoreManager.getGameState();
    
    this.add.text(centerX, centerY - 60, 'NEXT GAME!', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY - 10, `TOTAL SCORE: ${state.totalScore}`, {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 20, `GAME: ${state.currentGame}/5`, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#00ffff'
    }).setOrigin(0.5);
    
    // 進行度バー
    const progressBarWidth = 200;
    const progressBg = this.add.rectangle(centerX, centerY + 50, progressBarWidth, 10, 0x333333);
    progressBg.setStrokeStyle(1, 0x666666);
    
    const progress = (state.currentGame - 1) / 5;
    const progressBar = this.add.rectangle(
      centerX - progressBarWidth / 2 + (progressBarWidth * progress / 2), 
      centerY + 50, 
      progressBarWidth * progress, 
      8, 
      0x00ff00
    );
    progressBar.setOrigin(0, 0.5);
    
    // 自動で次のゲームへ
    this.time.delayedCall(1500, () => {
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
    
    this.add.text(centerX, centerY - 40, 'ALL GAMES COMPLETE!', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#00ff00'
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
    
    // 完了したゲーム数表示
    this.add.text(centerX, centerY + 60, `GAMES COMPLETED: ${state.gamesCompleted}/5`, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#00ffff'
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
    const nextGame = ScoreManager.getCurrentGameScene();
    if (nextGame) {
      this.scene.start(nextGame);
    } else {
      // すべてのゲームが完了した場合はメニューに戻る
      this.scene.start('MainMenuScene');
    }
  }
}

export default GameOverScene;