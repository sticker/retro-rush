import ScoreManager from '../utils/ScoreManager.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';
import SoundManager from '../utils/SoundManager.js';

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.singleGameMode = data?.singleGameMode || false;
    this.gameKey = data?.gameKey || null;
  }
  
  create() {
    if (this.singleGameMode) {
      // 単一ゲームモードの結果表示
      this.showSingleGameResult();
    } else {
      // 通常モード
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
  }

  showGameTransition() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    const state = ScoreManager.getGameState();
    
    // 次のゲームへの遷移音を削除（カウントダウン時に再生するため）
    
    this.add.text(centerX, centerY - 60, 'NEXT GAME!', {
      fontSize: '28px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY - 10, `TOTAL SCORE: ${state.totalScore}`, {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 20, `GAME: ${state.currentGame}/5`, {
      fontSize: '16px',
      fontFamily: UI_CONFIG.FONT.family,
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
        fontFamily: UI_CONFIG.FONT.family,
        color: '#ff00ff'
      }).setOrigin(0.5);
      
      HapticManager.perfect();
      RetroEffects.createParticles(this, centerX, centerY - 80, 'perfect');
    }
    
    this.add.text(centerX, centerY - 40, 'ALL GAMES COMPLETE!', {
      fontSize: '24px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 10, `FINAL SCORE: ${state.totalScore}`, {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 40, `HIGH SCORE: ${state.highScore}`, {
      fontSize: '16px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // 完了したゲーム数表示
    this.add.text(centerX, centerY + 60, `GAMES COMPLETED: ${state.gamesCompleted}/5`, {
      fontSize: '14px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#00ffff'
    }).setOrigin(0.5);
    
    // REPLAYテキスト（ファミコン風）
    const buttonY = this.game.config.height * 0.8;
    const replayText = this.add.text(centerX, buttonY, '▶ REPLAY', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    replayText.setInteractive({ useHandCursor: true });
    
    replayText.on('pointerdown', () => {
      HapticManager.tap();
      RetroEffects.bounceEffect(this, replayText);
      
      this.time.delayedCall(200, () => {
        this.scene.start('MainMenuScene');
      });
    });
    
    replayText.on('pointerover', () => {
      replayText.setColor('#ffff00');
    });
    
    replayText.on('pointerout', () => {
      replayText.setColor('#ffffff');
    });
  }
  
  showSingleGameResult() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    const state = ScoreManager.getGameState();
    
    this.add.text(centerX, centerY - 60, 'GAME OVER', {
      fontSize: '28px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ff6347'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY, `SCORE: ${state.totalScore}`, {
      fontSize: '24px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // リトライボタン
    const retryButtonY = centerY + 80;
    const retryButton = this.add.rectangle(
      centerX,
      retryButtonY,
      200,
      UI_CONFIG.MIN_TAP_SIZE,
      0x00ff00
    );
    
    const retryText = this.add.text(centerX, retryButtonY, 'RETRY', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#000000'
    }).setOrigin(0.5);
    
    retryButton.setInteractive({ useHandCursor: true });
    
    retryButton.on('pointerdown', () => {
      HapticManager.tap();
      RetroEffects.bounceEffect(this, retryButton);
      RetroEffects.bounceEffect(this, retryText);
      
      this.time.delayedCall(200, () => {
        ScoreManager.resetGameState();
        this.scene.start(this.gameKey, { singleGameMode: true });
      });
    });
    
    retryButton.on('pointerover', () => {
      retryButton.setFillStyle(0x44ff44);
    });
    
    retryButton.on('pointerout', () => {
      retryButton.setFillStyle(0x00ff00);
    });
    
    // ゲーム選択に戻るボタン
    const backButtonY = retryButtonY + 70;
    const backButton = this.add.rectangle(
      centerX,
      backButtonY,
      200,
      UI_CONFIG.MIN_TAP_SIZE,
      0x666666
    );
    
    const backText = this.add.text(centerX, backButtonY, 'ゲーム選択', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backButton.setInteractive({ useHandCursor: true });
    
    backButton.on('pointerdown', () => {
      HapticManager.tap();
      RetroEffects.bounceEffect(this, backButton);
      RetroEffects.bounceEffect(this, backText);
      
      this.time.delayedCall(200, () => {
        this.scene.start('GameSelectScene');
      });
    });
    
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0x888888);
    });
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x666666);
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