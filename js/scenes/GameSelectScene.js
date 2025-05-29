import BaseGameScene from './BaseGameScene.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import SoundManager from '../utils/SoundManager.js';

class GameSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameSelectScene' });
  }

  create() {
    const centerX = this.game.config.width / 2;
    
    // タイトル
    this.add.text(centerX, 30, 'ゲーム選択', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // サブタイトル
    this.add.text(centerX, 70, '遊びたいゲームをタップ！', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // ゲーム一覧
    this.games = [
      { key: 'MoleWhackScene', name: 'モグラタタキ', color: 0x8b4513 },
      { key: 'RhythmJumpScene', name: 'リズムジャンプ', color: 0xff6347 },
      { key: 'ColorMatchScene', name: 'カラーマッチ', color: 0x1e90ff },
      { key: 'MissileDefenseScene', name: 'ミサイルディフェンス', color: 0xff0000 },
      { key: 'NumberChainScene', name: 'ナンバーチェイン', color: 0x9370db },
      { key: 'BalanceTowerScene', name: 'バランスタワー', color: 0xffa500 }
    ];
    
    // ゲームボタン作成
    this.createGameButtons();
    
    // 戻るボタン
    this.createBackButton();
  }
  
  createGameButtons() {
    const centerX = this.game.config.width / 2;
    const startY = 140;
    const buttonHeight = 60;
    const buttonSpacing = 10;
    const buttonWidth = this.game.config.width - 60;
    
    this.games.forEach((game, index) => {
      const y = startY + (buttonHeight + buttonSpacing) * index;
      
      // ボタン背景
      const button = this.add.rectangle(
        centerX,
        y,
        buttonWidth,
        buttonHeight,
        game.color
      );
      button.setStrokeStyle(3, 0xffffff);
      button.setInteractive({ useHandCursor: true });
      
      // ゲーム名
      const text = this.add.text(centerX, y, game.name, {
        fontSize: '20px',
        fontFamily: 'Courier New',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      // タップイベント
      button.on('pointerdown', () => {
        // モバイルで音声アンロックを確実に実行
        SoundManager.setScene(this);
        
        HapticManager.tap();
        RetroEffects.bounceEffect(this, button);
        RetroEffects.bounceEffect(this, text);
        
        // 選択したゲームのみをプレイ
        this.time.delayedCall(200, () => {
          this.startSingleGame(game.key);
        });
      });
      
      // ホバーエフェクト
      button.on('pointerover', () => {
        button.setScale(1.05);
        text.setScale(1.05);
      });
      
      button.on('pointerout', () => {
        button.setScale(1.0);
        text.setScale(1.0);
      });
    });
  }
  
  createBackButton() {
    const centerX = this.game.config.width / 2;
    const backY = this.game.config.height - 80;
    
    const backButton = this.add.rectangle(
      centerX,
      backY,
      160,
      50,
      0x666666
    );
    backButton.setStrokeStyle(2, 0xffffff);
    backButton.setInteractive({ useHandCursor: true });
    
    const backText = this.add.text(centerX, backY, '戻る', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    backButton.on('pointerdown', () => {
      HapticManager.tap();
      RetroEffects.bounceEffect(this, backButton);
      RetroEffects.bounceEffect(this, backText);
      
      this.time.delayedCall(200, () => {
        this.scene.start('MainMenuScene');
      });
    });
    
    backButton.on('pointerover', () => {
      backButton.setScale(1.05);
      backText.setScale(1.05);
    });
    
    backButton.on('pointerout', () => {
      backButton.setScale(1.0);
      backText.setScale(1.0);
    });
  }
  
  startSingleGame(gameKey) {
    // 単一ゲームモードでゲームを開始
    this.scene.start(gameKey, { singleGameMode: true });
  }
}

export default GameSelectScene;