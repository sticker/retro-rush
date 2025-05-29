import UI_CONFIG from '../utils/UI_CONFIG.js';
import RetroEffects from '../utils/RetroEffects.js';
import HapticManager from '../utils/HapticManager.js';
import SoundManager from '../utils/SoundManager.js';

// ベースシーンクラス（共通機能）
class BaseGameScene extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.tapHandlers = new Map(); // タップハンドラー管理
    this.tapCooldown = 50; // 連続タップのクールダウン（ミリ秒）
    this.singleGameMode = false; // 単一ゲームモードフラグ
    this.clearEffectShown = false; // クリア演出表示フラグ
  }
  
  init(data) {
    this.singleGameMode = data?.singleGameMode || false;
    // サウンドマネージャーにシーンを設定
    SoundManager.setScene(this);
  }
  createThumbZoneUI() {
    const height = this.game.config.height;
    const thumbStartY = height * UI_CONFIG.THUMB_ZONE.startY;
    
    // 操作エリアの視覚的表示
    const thumbZone = this.add.rectangle(
      this.game.config.width / 2,
      thumbStartY + (height * UI_CONFIG.THUMB_ZONE.endY - thumbStartY) / 2,
      this.game.config.width - UI_CONFIG.DEAD_ZONE * 2,
      height * UI_CONFIG.THUMB_ZONE.endY - thumbStartY,
      0x000000,
      0
    );
    thumbZone.setStrokeStyle(1, 0x333333, 0.3);
    
    return thumbZone;
  }
  
  showQuickFeedback(text, color, x, y) {
    const feedback = this.add.text(x, y, text, {
      fontSize: '16px',
      fill: Phaser.Display.Color.IntegerToColor(color).rgba,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: feedback,
      alpha: 0,
      y: y - 20,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => feedback.destroy()
    });
  }
  
  createCountdown(callback) {
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    let count = 3;
    
    // カウントダウン開始時に音楽を再生
    SoundManager.playGameStart();
    
    const countdownText = this.add.text(centerX, centerY, count.toString(), {
      fontSize: '48px',
      color: '#ffff00',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    const countdownTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        count--;
        HapticManager.countdown();
        
        if (count > 0) {
          countdownText.setText(count.toString());
          RetroEffects.bounceEffect(this, countdownText);
        } else if (count === 0) {
          countdownText.setText('GO!');
          countdownText.setStyle({ color: '#00ff00' });
          RetroEffects.bounceEffect(this, countdownText);
        } else {
          countdownText.destroy();
          // コールバックでゲーム開始（音楽は再生しない）
          callback();
        }
      },
      repeat: 4
    });
  }
  
  /**
   * 共通タップ判定システム
   * 連続タップを適切に処理し、重複実行を防ぐ
   */
  addTapHandler(gameObject, handler, options = {}) {
    const {
      cooldown = this.tapCooldown,
      once = false,
      preventDouble = true
    } = options;
    
    let lastTapTime = 0;
    
    const wrappedHandler = (pointer) => {
      const currentTime = Date.now();
      
      // クールダウンチェック
      if (preventDouble && currentTime - lastTapTime < cooldown) {
        return;
      }
      
      lastTapTime = currentTime;
      
      // ハンドラー実行
      try {
        handler.call(this, gameObject, pointer);
        
        // 一度だけの実行の場合
        if (once) {
          this.removeTapHandler(gameObject);
        }
      } catch (error) {
        console.error('Tap handler error:', error);
      }
    };
    
    // イベント登録
    gameObject.setInteractive({ useHandCursor: true });
    gameObject.on('pointerdown', wrappedHandler);
    
    // ハンドラーを保存
    this.tapHandlers.set(gameObject, {
      handler: wrappedHandler,
      originalHandler: handler,
      options
    });
    
    return gameObject;
  }
  
  /**
   * タップハンドラーを削除
   */
  removeTapHandler(gameObject) {
    const handlerData = this.tapHandlers.get(gameObject);
    if (handlerData) {
      gameObject.off('pointerdown', handlerData.handler);
      this.tapHandlers.delete(gameObject);
    }
  }
  
  /**
   * ゲームオブジェクトのタップを一時的に無効化
   */
  disableTap(gameObject) {
    gameObject.disableInteractive();
  }
  
  /**
   * ゲームオブジェクトのタップを再有効化
   */
  enableTap(gameObject) {
    gameObject.setInteractive({ useHandCursor: true });
  }
  
  /**
   * シーン破棄時のクリーンアップ
   */
  shutdown() {
    this.tapHandlers.clear();
    super.shutdown();
  }
  
  /**
   * ゲームクリア時の共通処理
   */
  showClearEffect(onComplete) {
    // 既に表示済みの場合は何もしない
    if (this.clearEffectShown) {
      if (onComplete) onComplete();
      return;
    }
    
    // 表示フラグを設定
    this.clearEffectShown = true;
    
    const centerX = this.game.config.width / 2;
    const centerY = this.game.config.height / 2;
    
    // 成功音を再生
    SoundManager.playSuccess();
    
    // 「ナイス!」演出
    const niceText = this.add.text(centerX, centerY, 'ナイス!', {
      fontSize: '48px',
      fontFamily: 'Courier New',
      color: '#00ff00',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // エフェクト
    RetroEffects.bounceEffect(this, niceText);
    RetroEffects.createParticles(this, centerX, centerY, 'perfect');
    HapticManager.perfect();
    
    // 1秒後に次へ
    this.time.delayedCall(1000, () => {
      niceText.destroy();
      if (onComplete) onComplete();
    });
  }
  
  /**
   * ゲーム失敗時の共通処理
   */
  showFailEffect() {
    // 失敗音を再生
    SoundManager.playFail();
  }
  
  /**
   * ゲーム終了時の共通処理
   */
  endGameAndTransition() {
    if (this.singleGameMode) {
      // 単一ゲームモードの場合
      this.scene.start('GameOverScene', {
        singleGameMode: true,
        gameKey: this.scene.key
      });
    } else {
      // 通常モードの場合
      this.scene.start('GameOverScene');
    }
  }
}

export default BaseGameScene;