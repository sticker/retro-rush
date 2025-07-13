import BaseGameScene from './BaseGameScene.js';
import UI_CONFIG from '../utils/UI_CONFIG.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import SoundManager from '../utils/SoundManager.js';

class GameSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameSelectScene' });
    this.scrollY = 0;
    this.scrollContainer = null;
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartScrollY = 0;
    this.velocity = 0;
    this.maxScroll = 0;
    this.scrollBarContainer = null;
    this.scrollBarThumb = null;
  }

  create() {
    const centerX = this.game.config.width / 2;
    
    // 背景
    this.add.rectangle(centerX, this.game.config.height / 2, this.game.config.width, this.game.config.height, 0x000000);
    
    // 固定ヘッダー部分
    const headerBg = this.add.rectangle(centerX, 50, this.game.config.width, 100, 0x000000);
    headerBg.setDepth(10);
    
    // タイトル
    this.add.text(centerX, 30, 'ゲーム選択', {
      fontSize: '28px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00'
    }).setOrigin(0.5).setDepth(11);
    
    // サブタイトル
    this.add.text(centerX, 70, '遊びたいゲームをタップ！', {
      fontSize: '16px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(11);
    
    // ゲーム一覧
    this.games = [
      { key: 'MoleWhackScene', name: 'モグラタタキ', color: 0x8b4513 },
      { key: 'RhythmJumpScene', name: 'リズムジャンプ', color: 0xff6347 },
      { key: 'ColorMatchScene', name: 'カラーマッチ', color: 0x1e90ff },
      { key: 'MissileDefenseScene', name: 'ミサイルディフェンス', color: 0xff0000 },
      { key: 'NumberChainScene', name: 'ナンバーチェイン', color: 0x9370db },
      { key: 'BalanceTowerScene', name: 'バランスタワー', color: 0xffa500 },
      { key: 'SpaceDebrisScene', name: 'スペースデブリ', color: 0x000033 },
      { key: 'ClockStopScene', name: 'クロックストップ', color: 0x4169e1 },
      { key: 'ShapeSortScene', name: 'シェイプソート', color: 0x2ecc71 },
      { key: 'RocketLandingScene', name: 'ロケットランディング', color: 0xff6600 },
      { key: 'MemoryFlashScene', name: 'メモリーフラッシュ', color: 0xff69b4 }
    ];
    
    // スクロール可能なコンテナを作成
    this.createScrollableContent();
    
    // スクロールバーを作成
    this.createScrollBar();
    
    // 戻るボタン（固定）
    this.createBackButton();
    
    // スクロール操作の設定
    this.setupScrollControls();
  }
  
  createScrollableContent() {
    // スクロール可能なコンテナ
    this.scrollContainer = this.add.container(0, 0);
    
    const centerX = this.game.config.width / 2;
    const startY = 140;
    const buttonHeight = 60;
    const buttonSpacing = 10;
    const buttonWidth = this.game.config.width - 60;
    
    // ゲームボタンをコンテナに追加
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
        fontFamily: UI_CONFIG.FONT.family,
        color: '#ffffff'
      }).setOrigin(0.5);
      
      // コンテナに追加
      this.scrollContainer.add([button, text]);
      
      // タップイベント
      button.on('pointerdown', () => {
        // スクロール中でない場合のみ反応
        if (Math.abs(this.velocity) < 2) {
          SoundManager.setScene(this);
          
          HapticManager.tap();
          RetroEffects.bounceEffect(this, button);
          RetroEffects.bounceEffect(this, text);
          
          this.time.delayedCall(200, () => {
            this.startSingleGame(game.key);
          });
        }
      });
      
      // ホバーエフェクト
      button.on('pointerover', () => {
        if (!this.isDragging) {
          button.setScale(1.05);
          text.setScale(1.05);
        }
      });
      
      button.on('pointerout', () => {
        button.setScale(1.0);
        text.setScale(1.0);
      });
    });
    
    // 最大スクロール量を計算
    const contentHeight = startY + (buttonHeight + buttonSpacing) * this.games.length;
    const viewportHeight = this.game.config.height - 100 - 120; // ヘッダーと戻るボタン分を除く
    this.maxScroll = Math.max(0, contentHeight - viewportHeight);
    
    // マスクを設定（スクロール領域を制限）
    const maskShape = this.make.graphics();
    maskShape.fillRect(0, 100, this.game.config.width, viewportHeight);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);
  }
  
  createScrollBar() {
    // スクロールバーが必要な場合のみ表示
    if (this.maxScroll <= 0) return;
    
    const scrollBarX = this.game.config.width - 10;
    const scrollBarTop = 110;
    const scrollBarHeight = this.game.config.height - 220; // ヘッダーと戻るボタン分を除く
    
    // スクロールバーの背景
    this.scrollBarContainer = this.add.rectangle(
      scrollBarX,
      scrollBarTop + scrollBarHeight / 2,
      6,
      scrollBarHeight,
      0x333333,
      0.3
    );
    
    // スクロールバーのつまみ
    const thumbHeight = Math.max(30, (scrollBarHeight * scrollBarHeight) / (scrollBarHeight + this.maxScroll));
    this.scrollBarThumb = this.add.rectangle(
      scrollBarX,
      scrollBarTop + thumbHeight / 2,
      6,
      thumbHeight,
      0xffffff,
      0.6
    );
    
    this.scrollBarContainer.setDepth(12);
    this.scrollBarThumb.setDepth(13);
  }
  
  setupScrollControls() {
    // タッチ/マウスでのスクロール
    this.input.on('pointerdown', (pointer) => {
      // 戻るボタンの領域は除外
      if (pointer.y > this.game.config.height - 120) return;
      
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.dragStartScrollY = this.scrollY;
      this.velocity = 0;
    });
    
    this.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;
      
      const deltaY = pointer.y - this.dragStartY;
      this.scrollY = this.dragStartScrollY - deltaY;
      
      // スクロール範囲を制限
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
      
      // 速度を計算（慣性スクロール用）
      this.velocity = deltaY;
    });
    
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
    
    // マウスホイールでのスクロール
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.scrollY += deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
      this.velocity = 0;
    });
  }
  
  createBackButton() {
    const centerX = this.game.config.width / 2;
    const backY = this.game.config.height - 60;
    
    // 戻るボタンの背景（固定）
    const buttonBg = this.add.rectangle(
      centerX,
      this.game.config.height - 60,
      this.game.config.width,
      120,
      0x000000
    );
    buttonBg.setDepth(10);
    
    const backButton = this.add.rectangle(
      centerX,
      backY,
      160,
      50,
      0x666666
    );
    backButton.setStrokeStyle(2, 0xffffff);
    backButton.setInteractive({ useHandCursor: true });
    backButton.setDepth(11);
    
    const backText = this.add.text(centerX, backY, '戻る', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
    backText.setDepth(11);
    
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
  
  update() {
    // 慣性スクロール
    if (!this.isDragging && Math.abs(this.velocity) > 0.1) {
      this.scrollY -= this.velocity * 0.05;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScroll);
      
      // 摩擦
      this.velocity *= 0.95;
      
      if (Math.abs(this.velocity) < 0.1) {
        this.velocity = 0;
      }
    }
    
    // スクロールコンテナの位置を更新
    if (this.scrollContainer) {
      this.scrollContainer.y = -this.scrollY;
    }
    
    // スクロールバーの位置を更新
    if (this.scrollBarThumb && this.maxScroll > 0) {
      const scrollBarTop = 110;
      const scrollBarHeight = this.game.config.height - 220;
      const thumbHeight = this.scrollBarThumb.height;
      const scrollRatio = this.scrollY / this.maxScroll;
      const thumbY = scrollBarTop + thumbHeight / 2 + scrollRatio * (scrollBarHeight - thumbHeight);
      
      this.scrollBarThumb.y = thumbY;
    }
  }
  
  startSingleGame(gameKey) {
    // 単一ゲームモードでゲームを開始
    this.scene.start(gameKey, { singleGameMode: true });
  }
}

export default GameSelectScene;