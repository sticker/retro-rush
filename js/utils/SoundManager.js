/**
 * サウンド管理クラス
 * 効果音とBGMの再生を管理
 */
class SoundManager {
  static instance = null;
  
  constructor() {
    if (SoundManager.instance) {
      return SoundManager.instance;
    }
    
    this.sounds = {};
    this.volume = 0.3; // デフォルト音量を下げる
    this.muted = false;
    this.scene = null;
    this.audioUnlocked = false; // モバイル音声ロック解除フラグ
    this.fallbackAudios = {}; // HTML5 Audio fallback for iOS
    
    SoundManager.instance = this;
  }
  
  /**
   * シーンを設定
   */
  static setScene(scene) {
    const instance = new SoundManager();
    instance.scene = scene;
    
    // すべての音声を事前ロード
    instance.preloadSounds();
  }
  
  /**
   * 音声を事前ロード
   */
  preloadSounds() {
    if (!this.scene) return;
    
    // Phaserのサウンドキーを取得
    const soundKeys = ['nextGame', 'success', 'fail', 'push', 'jump', 'correct', 'destroy', 'beep'];
    const soundFiles = {
      'nextGame': 'assets/sounds/NextGame.mp3',
      'success': 'assets/sounds/success.mp3',
      'fail': 'assets/sounds/fail.mp3',
      'push': 'assets/sounds/push.wav',
      'jump': 'assets/sounds/jump.mp3',
      'correct': 'assets/sounds/correct.mp3',
      'destroy': 'assets/sounds/destroy.wav',
      'beep': 'assets/sounds/beep.mp3'
    };
    
    // Phaserのサウンドオブジェクトを取得
    soundKeys.forEach(key => {
      if (this.scene.cache.audio.exists(key)) {
        this.sounds[key] = this.scene.sound.add(key, { volume: 0.2 });
        
        // iOS用HTML5 Audio fallbackも作成
        try {
          const audio = new Audio(soundFiles[key]);
          audio.preload = 'auto';
          audio.volume = 0.2;
          this.fallbackAudios[key] = audio;
        } catch (e) {
          // エラーは無視
        }
      } else {
        // フォールバック
        this.sounds[key] = {
          play: () => {}
        };
      }
    });
    
    // モバイル対応: 音声コンテキストのロック解除を設定
    this.setupMobileAudioUnlock();
  }
  
  /**
   * モバイル端末の音声ロック解除を設定
   */
  setupMobileAudioUnlock() {
    if (this.audioUnlocked || !this.scene) return;
    
    // ユーザーインタラクションで音声コンテキストをアンロック
    const unlockAudio = async () => {
      if (this.audioUnlocked) return;
      
      try {
        // Web Audio APIコンテキストの状態をチェック
        const audioContext = this.scene.sound.context;
        
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        // Phaserのサウンドシステムをアンロック
        this.scene.sound.unlock();
        
        // 各サウンドを事前にテスト再生
        const loadedSounds = [];
        Object.keys(this.sounds).forEach(key => {
          const sound = this.sounds[key];
          if (sound && sound.play && typeof sound.play === 'function') {
            loadedSounds.push(key);
          }
        });
        
        for (const key of loadedSounds) {
          const sound = this.sounds[key];
          try {
            // 音量0で短時間再生して初期化
            const originalVolume = sound.volume || this.volume;
            sound.setVolume(0);
            const playPromise = sound.play();
            
            // Promiseを返す場合は待機
            if (playPromise && typeof playPromise.then === 'function') {
              await playPromise;
            }
            
            // 少し待ってから停止
            await new Promise(resolve => setTimeout(resolve, 50));
            sound.stop();
            // 元の音量に戻す
            sound.setVolume(originalVolume);
          } catch (e) {
            // エラーは無視
          }
        }
        
        // iOS Safari用: オーディオファイルを直接作成してテスト
        try {
          const testAudio = new Audio();
          testAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H0xm0gBzuJ0fDOgS4HJmrF8N1+PggVW7Ll7qpTFApB';
          testAudio.volume = 0;
          const playPromise = testAudio.play();
          if (playPromise) {
            await playPromise;
            testAudio.pause();
          }
        } catch (e) {
          // エラーは無視
        }
        
        this.audioUnlocked = true;
        
        // イベントリスナーを削除
        this.scene.input.off('pointerdown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        
        // スマホ用: 極小音量でテスト音を再生して音声システムを確実に有効化
        this.scene.time.delayedCall(100, () => {
          SoundManager.play('beep', { volume: 0.01 }); // 極小音量
        });
        
      } catch (error) {
        // エラーは無視して続行
      }
    };
    
    // 様々なインタラクションでアンロックを試行
    this.scene.input.once('pointerdown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('touchend', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });
  }
  
  /**
   * 効果音を再生
   */
  static play(soundKey, config = {}) {
    const instance = new SoundManager();
    
    if (instance.muted || !instance.sounds[soundKey]) {
      return;
    }
    
    // モバイルで音声がアンロックされていない場合
    if (!instance.audioUnlocked && instance.scene) {
      instance.setupMobileAudioUnlock();
      // アンロックされるまで再生を延期
      instance.scene.time.delayedCall(100, () => {
        SoundManager.play(soundKey, config);
      });
      return;
    }
    
    const sound = instance.sounds[soundKey];
    
    // Phaserのサウンドオブジェクトの場合
    if (sound && sound.play && typeof sound.play === 'function') {
      try {
        // 既に再生中の場合は停止してから再生
        if (sound.isPlaying) {
          sound.stop();
        }
        
        const volume = (config.volume || 1.0) * instance.volume;
        sound.setVolume(volume);
        sound.play();
        
        // iOSでPhaserが再生に失敗した場合、HTML5 Audioを試行
        setTimeout(() => {
          if (!sound.isPlaying && instance.fallbackAudios[soundKey]) {
            try {
              const fallbackAudio = instance.fallbackAudios[soundKey];
              fallbackAudio.currentTime = 0;
              fallbackAudio.volume = volume;
              fallbackAudio.play();
            } catch (fallbackError) {
              // エラーは無視
            }
          }
        }, 100);
        
      } catch (error) {
        // Phaser再生でエラーが起きた場合もHTML5 Audioを試行
        if (instance.fallbackAudios[soundKey]) {
          try {
            const fallbackAudio = instance.fallbackAudios[soundKey];
            fallbackAudio.currentTime = 0;
            fallbackAudio.volume = (config.volume || 1.0) * instance.volume;
            fallbackAudio.play();
          } catch (fallbackError) {
            // エラーは無視
          }
        }
      }
    } else {
      // Phaserサウンドが無効な場合もHTML5 Audioを試行
      if (instance.fallbackAudios[soundKey]) {
        try {
          const fallbackAudio = instance.fallbackAudios[soundKey];
          fallbackAudio.currentTime = 0;
          fallbackAudio.volume = (config.volume || 1.0) * instance.volume;
          fallbackAudio.play();
        } catch (fallbackError) {
          // エラーは無視
        }
      }
    }
  }
  
  /**
   * ボリュームを設定
   */
  static setVolume(volume) {
    const instance = new SoundManager();
    instance.volume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * ミュート切り替え
   */
  static toggleMute() {
    const instance = new SoundManager();
    instance.muted = !instance.muted;
    return instance.muted;
  }
  
  /**
   * 特定のゲーム用効果音
   */
  static playGameStart() {
    SoundManager.play('nextGame');
  }
  
  static playSuccess() {
    SoundManager.play('success');
  }
  
  static playFail() {
    SoundManager.play('fail');
  }
  
  static playPush() {
    SoundManager.play('push');
  }
  
  static playJump() {
    SoundManager.play('jump');
  }
  
  static playCorrect() {
    SoundManager.play('correct');
  }
  
  static playDestroy() {
    SoundManager.play('destroy');
  }
  
  static playBeep() {
    SoundManager.play('beep');
  }
}

export default SoundManager;