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
  }
  
  /**
   * 効果音を再生
   */
  static play(soundKey, config = {}) {
    const instance = new SoundManager();
    
    if (instance.muted || !instance.sounds[soundKey]) {
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