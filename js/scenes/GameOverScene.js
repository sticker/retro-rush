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
    // 明示的にリセットしてから設定
    this.singleGameMode = false;
    this.gameKey = null;
    
    // dataが渡された場合のみ設定を変更
    if (data) {
      if (data.singleGameMode === true) {
        this.singleGameMode = true;
      }
      if (data.gameKey) {
        this.gameKey = data.gameKey;
      }
    }
  }
  
  create() {
    if (this.singleGameMode) {
      // 単一ゲームモードの結果表示
      this.showSingleGameResult();
    } else {
      // 通常モード
      const state = ScoreManager.getGameState();
      
      // 次のゲームがあるかチェック（incrementはまだしない）
      // currentGame + 1 < 9 つまり、currentGame < 8 なら次のゲームがある
      const hasMoreGames = state.currentGame < state.gameSequence.length - 1;
      
      if (hasMoreGames) {
        // 次のゲームへ
        this.showGameTransition();
      } else {
        // 最終結果（9ゲーム完了）
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
    
    // this.add.text(centerX, centerY + 20, `GAME: ${state.currentGame}/9`, {
    //   fontSize: '16px',
    //   fontFamily: UI_CONFIG.FONT.family,
    //   color: '#00ffff'
    // }).setOrigin(0.5);
    
    // 進行度インジケーター（9つの丸）
    const indicatorY = centerY + 50;
    const indicatorSpacing = 22;
    const totalWidth = indicatorSpacing * 8; // 9つの丸の間隔
    const startX = centerX - totalWidth / 2;
    
    // 各ゲームのクリア状況を取得（currentGameは現在のゲームのインデックス、0ベース）
    const completedGames = new Set();
    const gamesPlayed = state.currentGame + 1; // プレイ済みゲーム数（1個目なら0+1=1）
    
    for (let i = 0; i < gamesPlayed; i++) {
      const gameKey = state.gameSequence[i];
      if (state.completedGames.has(gameKey + i)) {
        completedGames.add(i);
      }
    }
    
    for (let i = 0; i < 9; i++) {
      const x = startX + (indicatorSpacing * i);
      
      if (i < gamesPlayed) {
        // プレイ済みのゲーム
        if (completedGames.has(i)) {
          // クリアしたゲーム - 緑のチェックマーク
          const checkCircle = this.add.circle(x, indicatorY, 8, 0x00ff00);
          checkCircle.setStrokeStyle(2, 0x00ff00);
          
          const check = this.add.text(x, indicatorY, '✓', {
            fontSize: '12px',
            fontFamily: UI_CONFIG.FONT.family,
            color: '#ffffff'
          }).setOrigin(0.5);
        } else {
          // 失敗したゲーム - 赤いバツマーク
          const failCircle = this.add.circle(x, indicatorY, 8, 0xff0000);
          failCircle.setStrokeStyle(2, 0xff0000);
          
          const cross = this.add.text(x, indicatorY, '×', {
            fontSize: '12px',
            fontFamily: UI_CONFIG.FONT.family,
            color: '#ffffff'
          }).setOrigin(0.5);
        }
      } else {
        // 未プレイのゲーム
        const emptyCircle = this.add.circle(x, indicatorY, 8, 0x333333, 0);
        emptyCircle.setStrokeStyle(2, 0x666666);
      }
    }
    
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
    // this.add.text(centerX, centerY + 60, `GAMES COMPLETED: ${state.gamesCompleted}/9`, {
    //   fontSize: '14px',
    //   fontFamily: UI_CONFIG.FONT.family,
    //   color: '#00ffff'
    // }).setOrigin(0.5);
    
    // 進行度インジケーター（9つの丸）
    const indicatorY = centerY + 85;
    const indicatorSpacing = 22;
    const totalWidth = indicatorSpacing * 8;
    const startX = centerX - totalWidth / 2;
    
    // 各ゲームのクリア状況を取得
    const completedGames = new Set();
    // 最終結果画面では全9ゲーム（0-8）をチェックする必要がある
    // currentGameは8なので、<=を使って8も含める
    for (let i = 0; i <= state.currentGame; i++) {
      const gameKey = state.gameSequence[i];
      if (state.completedGames.has(gameKey + i)) {
        completedGames.add(i);
      }
    }
    
    for (let i = 0; i < 9; i++) {
      const x = startX + (indicatorSpacing * i);
      
      if (completedGames.has(i)) {
        // クリアしたゲーム - 緑のチェックマーク
        const checkCircle = this.add.circle(x, indicatorY, 6, 0x00ff00);
        checkCircle.setStrokeStyle(1.5, 0x00ff00);
        
        const check = this.add.text(x, indicatorY, '✓', {
          fontSize: '10px',
          fontFamily: UI_CONFIG.FONT.family,
          color: '#ffffff'
        }).setOrigin(0.5);
      } else if (i <= state.currentGame) {
        // プレイしたが失敗したゲーム - 赤い×
        const failCircle = this.add.circle(x, indicatorY, 6, 0xff0000);
        failCircle.setStrokeStyle(1.5, 0xff0000);
        
        const cross = this.add.text(x, indicatorY, '×', {
          fontSize: '10px',
          fontFamily: UI_CONFIG.FONT.family,
          color: '#ffffff'
        }).setOrigin(0.5);
      } else {
        // 未プレイのゲーム
        const emptyCircle = this.add.circle(x, indicatorY, 6, 0x333333, 0);
        emptyCircle.setStrokeStyle(1.5, 0x666666);
      }
    }
    
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
    // 次のゲームに進む前にカウントを増やす
    ScoreManager.incrementGame();
    
    const nextGame = ScoreManager.getCurrentGameScene();
    if (nextGame) {
      // 通常モードを維持して次のゲームへ
      this.scene.start(nextGame, { singleGameMode: false });
    } else {
      // すべてのゲームが完了した場合はメニューに戻る
      this.scene.start('MainMenuScene');
    }
  }
}

export default GameOverScene;