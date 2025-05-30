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
          console.log(`Created fallback audio for ${key}`);
        } catch (e) {
          console.warn(`Failed to create fallback audio for ${key}:`, e);
        }
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
    
    console.log('Setting up mobile audio unlock...');
    
    // ユーザーインタラクションで音声コンテキストをアンロック
    const unlockAudio = async () => {
      if (this.audioUnlocked) return;
      
      console.log('Attempting to unlock audio...');
      
      try {
        // Web Audio APIコンテキストの状態をチェック
        const audioContext = this.scene.sound.context;
        console.log('AudioContext state:', audioContext ? audioContext.state : 'No context');
        
        if (audioContext && audioContext.state === 'suspended') {
          console.log('Resuming AudioContext...');
          await audioContext.resume();
          console.log('AudioContext resumed, new state:', audioContext.state);
        }
        
        // Phaserのサウンドシステムをアンロック
        console.log('Unlocking Phaser sound system...');
        const unlockResult = this.scene.sound.unlock();
        console.log('Phaser unlock result:', unlockResult);
        
        // すべてのサウンドファイルがロードされているかチェック
        const loadedSounds = [];
        Object.keys(this.sounds).forEach(key => {
          const sound = this.sounds[key];
          if (sound && sound.play && typeof sound.play === 'function') {
            loadedSounds.push(key);
          }
        });
        console.log('Available sounds:', loadedSounds);
        
        // 各サウンドを事前にテスト再生
        for (const key of loadedSounds) {
          const sound = this.sounds[key];
          try {
            console.log(`Testing sound: ${key}`);
            // 音量0で短時間再生して初期化
            sound.setVolume(0);
            const playPromise = sound.play();
            
            // Promiseを返す場合は待機
            if (playPromise && typeof playPromise.then === 'function') {
              await playPromise;
            }
            
            // 少し待ってから停止
            await new Promise(resolve => setTimeout(resolve, 50));
            sound.stop();
            sound.setVolume(this.volume);
            console.log(`Sound ${key} test completed`);
          } catch (e) {
            console.warn(`Failed to test sound ${key}:`, e);
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
          console.log('Native Audio test completed');
        } catch (e) {
          console.warn('Native Audio test failed:', e);
        }
        
        this.audioUnlocked = true;
        console.log('Audio unlock completed successfully');
        
        // イベントリスナーを削除
        this.scene.input.off('pointerdown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        
        // テスト音を再生して確認
        this.scene.time.delayedCall(100, () => {
          console.log('Testing a real sound playback...');
          SoundManager.play('beep');
        });
        
      } catch (error) {
        console.error('Failed to unlock audio:', error);
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
    
    console.log(`Attempting to play sound: ${soundKey}`);
    console.log(`Audio unlocked: ${instance.audioUnlocked}`);
    console.log(`Muted: ${instance.muted}`);
    console.log(`Sound exists: ${!!instance.sounds[soundKey]}`);
    
    if (instance.muted) {
      console.log('Sound is muted, skipping playback');
      return;
    }
    
    if (!instance.sounds[soundKey]) {
      console.warn(`Sound ${soundKey} not found in loaded sounds`);
      return;
    }
    
    // モバイルで音声がアンロックされていない場合
    if (!instance.audioUnlocked && instance.scene) {
      console.log('Audio not unlocked yet, setting up unlock and retrying...');
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
        console.log(`Playing sound ${soundKey}...`);
        
        // 既に再生中の場合は停止してから再生
        if (sound.isPlaying) {
          console.log(`Stopping currently playing ${soundKey}`);
          sound.stop();
        }
        
        const volume = (config.volume || 1.0) * instance.volume;
        console.log(`Setting volume to ${volume} for ${soundKey}`);
        sound.setVolume(volume);
        
        const playResult = sound.play();
        console.log(`Play result for ${soundKey}:`, playResult);
        
        // 再生状態を確認と iOS fallback
        setTimeout(() => {
          console.log(`Sound ${soundKey} isPlaying: ${sound.isPlaying}`);
          
          // iOSでPhaserが再生に失敗した場合、HTML5 Audioを試行
          if (!sound.isPlaying && instance.fallbackAudios[soundKey]) {
            console.log(`Phaser audio failed for ${soundKey}, trying HTML5 Audio fallback...`);
            try {
              const fallbackAudio = instance.fallbackAudios[soundKey];
              fallbackAudio.currentTime = 0;
              fallbackAudio.volume = volume;
              const fallbackPromise = fallbackAudio.play();
              if (fallbackPromise) {
                fallbackPromise.then(() => {
                  console.log(`HTML5 Audio fallback succeeded for ${soundKey}`);
                }).catch(e => {
                  console.error(`HTML5 Audio fallback failed for ${soundKey}:`, e);
                });
              }
            } catch (fallbackError) {
              console.error(`HTML5 Audio fallback error for ${soundKey}:`, fallbackError);
            }
          }
        }, 100);
        
      } catch (error) {
        console.error(`Error playing sound ${soundKey}:`, error);
        
        // Phaser再生でエラーが起きた場合もHTML5 Audioを試行
        if (instance.fallbackAudios[soundKey]) {
          console.log(`Trying HTML5 Audio fallback due to Phaser error for ${soundKey}...`);
          try {
            const fallbackAudio = instance.fallbackAudios[soundKey];
            fallbackAudio.currentTime = 0;
            fallbackAudio.volume = (config.volume || 1.0) * instance.volume;
            fallbackAudio.play();
          } catch (fallbackError) {
            console.error(`HTML5 Audio fallback also failed for ${soundKey}:`, fallbackError);
          }
        }
      }
    } else {
      console.warn(`Sound object for ${soundKey} is not valid for playback`);
      
      // Phaserサウンドが無効な場合もHTML5 Audioを試行
      if (instance.fallbackAudios[soundKey]) {
        console.log(`Using HTML5 Audio fallback for invalid Phaser sound ${soundKey}...`);
        try {
          const fallbackAudio = instance.fallbackAudios[soundKey];
          fallbackAudio.currentTime = 0;
          fallbackAudio.volume = (config.volume || 1.0) * instance.volume;
          fallbackAudio.play();
        } catch (fallbackError) {
          console.error(`HTML5 Audio fallback failed for ${soundKey}:`, fallbackError);
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