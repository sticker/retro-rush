import ScoreManager from '../utils/ScoreManager.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';
import SoundManager from '../utils/SoundManager.js';

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    
    this.add.text(centerX, centerY - 80, 'レトロラッシュ', {
      fontSize: '36px',
      fontFamily: 'Courier New',
      color: '#ffff00',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY - 30, 'RETRO RUSH', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#00ffff'
    }).setOrigin(0.5);
    
    const state = ScoreManager.getGameState();
    this.add.text(centerX, centerY + 30, `HIGH SCORE: ${state.highScore}`, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // STARTボタン
    const buttonY = this.game.config.height * 0.65;
    const startButton = this.add.rectangle(
      centerX, 
      buttonY, 
      200, 
      UI_CONFIG.MIN_TAP_SIZE, 
      0x00ff00
    );
    
    const startText = this.add.text(centerX, buttonY, 'START', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#000000'
    }).setOrigin(0.5);
    
    startButton.setInteractive({ useHandCursor: true });
    
    // ゲーム選択ボタン
    const selectButtonY = buttonY + 70;
    const selectButton = this.add.rectangle(
      centerX,
      selectButtonY,
      200,
      UI_CONFIG.MIN_TAP_SIZE,
      0x1e90ff
    );
    
    const selectText = this.add.text(centerX, selectButtonY, 'ゲーム選択', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    selectButton.setInteractive({ useHandCursor: true });
    
    startButton.on('pointerdown', () => {
      // モバイルで音声アンロックを確実に実行
      SoundManager.setScene(this);
      
      HapticManager.tap();
      RetroEffects.bounceEffect(this, startButton);
      RetroEffects.bounceEffect(this, startText);
      
      this.time.delayedCall(200, () => {
        ScoreManager.resetGameState();
        const firstGame = ScoreManager.getCurrentGameScene();
        if (firstGame) {
          this.scene.start(firstGame);
        }
      });
    });
    
    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x44ff44);
    });
    
    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x00ff00);
    });
    
    // ゲーム選択ボタンのイベント
    selectButton.on('pointerdown', () => {
      // モバイルで音声アンロックを確実に実行
      SoundManager.setScene(this);
      
      HapticManager.tap();
      RetroEffects.bounceEffect(this, selectButton);
      RetroEffects.bounceEffect(this, selectText);
      
      this.time.delayedCall(200, () => {
        this.scene.start('GameSelectScene');
      });
    });
    
    selectButton.on('pointerover', () => {
      selectButton.setFillStyle(0x4682b4);
    });
    
    selectButton.on('pointerout', () => {
      selectButton.setFillStyle(0x1e90ff);
    });
    
    RetroEffects.addFlicker(this);
  }
}

export default MainMenuScene;