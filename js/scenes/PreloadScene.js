import RetroEffects from '../utils/RetroEffects.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';

class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    
    // ローディング画面
    this.add.text(centerX, centerY - 50, 'RETRO RUSH', {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // プログレスバー背景
    const progressBox = this.add.rectangle(centerX, centerY + 20, 240, 20, 0x222222);
    progressBox.setStrokeStyle(2, 0x666666);
    
    // プログレスバー
    const progressBar = this.add.rectangle(centerX - 118, centerY + 20, 0, 16, 0x00ff00);
    progressBar.setOrigin(0, 0.5);
    
    // ローディングテキスト
    const loadingText = this.add.text(centerX, centerY + 50, 'Loading...', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // プログレスイベント
    this.load.on('progress', (value) => {
      progressBar.width = 236 * value;
      loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
    });
    
    // 完了イベント
    this.load.on('complete', () => {
      loadingText.setText('Complete!');
    });
    
    // フォントをロード
    this.load.bitmapFont(UI_CONFIG.FONT.key, 
      'assets/fonts/x12y12pxMaruMinya.png',
      'assets/fonts/x12y12pxMaruMinya.xml'
    );
    
    // 音声ファイルをロード
    this.load.audio('nextGame', 'assets/sounds/NextGame.mp3');
    this.load.audio('success', 'assets/sounds/success.mp3');
    this.load.audio('fail', 'assets/sounds/fail.mp3');
    this.load.audio('push', 'assets/sounds/push.wav');
    this.load.audio('jump', 'assets/sounds/jump.mp3');
    this.load.audio('correct', 'assets/sounds/correct.mp3');
    this.load.audio('destroy', 'assets/sounds/destroy.wav');
  }

  create() {
    // エフェクト追加
    RetroEffects.addFlicker(this);
    
    // 少し待ってからメインメニューへ
    this.time.delayedCall(500, () => {
      this.scene.start('MainMenuScene');
    });
  }
}

export default PreloadScene;