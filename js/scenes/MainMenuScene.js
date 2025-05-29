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
    
    this.add.text(centerX, centerY - 80, 'RETRO RUSH', {
      fontSize: '36px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00',
      stroke: '#ff00ff',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // this.add.text(centerX, centerY - 30, 'RETRO RUSH', {
    //   fontSize: '24px',
    //   fontFamily: 'Courier New',
    //   color: '#00ffff'
    // }).setOrigin(0.5);
    
    const state = ScoreManager.getGameState();
    this.add.text(centerX, centerY + 30, `HIGH SCORE: ${state.highScore}`, {
      fontSize: '16px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // STARTテキスト（ファミコン風）
    const buttonY = this.game.config.height * 0.65;
    const startText = this.add.text(centerX, buttonY, '▶ START', {
      fontSize: '24px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    startText.setInteractive({ useHandCursor: true });
    
    // 隠しボタン（㊙）
    const secretButton = this.add.text(
      this.game.config.width - 40,
      this.game.config.height - 40,
      '㊙',
      {
        fontSize: '24px',
        fontFamily: UI_CONFIG.FONT.family,
        color: '#666666'
      }
    ).setOrigin(0.5);
    
    secretButton.setInteractive({ useHandCursor: true });
    
    startText.on('pointerdown', () => {
      // モバイルで音声アンロックを確実に実行
      SoundManager.setScene(this);
      
      HapticManager.tap();
      RetroEffects.bounceEffect(this, startText);
      
      this.time.delayedCall(200, () => {
        ScoreManager.resetGameState();
        const firstGame = ScoreManager.getCurrentGameScene();
        if (firstGame) {
          this.scene.start(firstGame);
        }
      });
    });
    
    startText.on('pointerover', () => {
      startText.setColor('#ffff00');
    });
    
    startText.on('pointerout', () => {
      startText.setColor('#ffffff');
    });
    
    // 隠しボタンのイベント
    secretButton.on('pointerdown', () => {
      // モバイルで音声アンロックを確実に実行
      SoundManager.setScene(this);
      
      HapticManager.tap();
      RetroEffects.bounceEffect(this, secretButton);
      
      this.time.delayedCall(200, () => {
        this.scene.start('GameSelectScene');
      });
    });
    
    secretButton.on('pointerover', () => {
      secretButton.setColor('#ff00ff');
    });
    
    secretButton.on('pointerout', () => {
      secretButton.setColor('#666666');
    });
    
    RetroEffects.addFlicker(this);
  }
}

export default MainMenuScene;