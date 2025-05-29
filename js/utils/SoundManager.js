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
    this.volume = 0.6; // デフォルト音量を下げる
    this.muted = false;
    this.scene = null;
    this.audioUnlocked = false; // モバイル音声ロック解除フラグ
    
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
    const soundKeys = ['nextGame', 'success', 'fail', 'push', 'jump', 'correct', 'destroy'];
    
    // Phaserのサウンドオブジェクトを取得
    soundKeys.forEach(key => {
      if (this.scene.cache.audio.exists(key)) {
        this.sounds[key] = this.scene.sound.add(key, { volume: 0.3 });
      } else {
        console.warn(`Sound ${key} not loaded`);
        // フォールバック
        this.sounds[key] = {
          play: () => console.log(`♪ ${key} sound would play here`)
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
    const unlockAudio = () => {
      if (this.audioUnlocked) return;
      
      try {
        // Phaserのサウンドシステムをアンロック
        this.scene.sound.unlock();
        this.audioUnlocked = true;
        
        // モバイルブラウザのために無音のサウンドを再生してコンテキストを有効化
        const silentSound = this.scene.sound.add('nextGame', { volume: 0 });
        silentSound.play();
        silentSound.stop();
        
        console.log('Audio unlocked for mobile');
        
        // イベントリスナーを削除
        this.scene.input.off('pointerdown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      } catch (error) {
        console.warn('Failed to unlock audio:', error);
      }
    };
    
    // 様々なインタラクションでアンロックを試行
    this.scene.input.once('pointerdown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio, { once: true });
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
      } catch (error) {
        console.error(`Error playing sound ${soundKey}:`, error);
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
}

export default SoundManager;