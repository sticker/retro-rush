import ScoreManager from '../utils/ScoreManager.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';

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
    
    const buttonY = this.game.config.height * 0.7;
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
    
    startButton.on('pointerdown', () => {
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
    
    RetroEffects.addFlicker(this);
  }
}

export default MainMenuScene;