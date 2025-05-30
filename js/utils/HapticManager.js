// 振動フィードバック管理
class HapticManager {
  static isSupported() {
    // Vibration APIのサポートチェック
    return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }
  
  static vibrate(pattern) {
    try {
      if (this.isSupported()) {
        // Chrome for Android等で動作
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // エラーは静かに処理（iOSなど非対応環境のため）
    }
  }
  
  static success() {
    this.vibrate([50, 50, 100]); // 短・短・長のパターン
  }
  
  static fail() {
    this.vibrate([200]); // 長めの振動
  }
  
  static perfect() {
    this.vibrate([50, 50, 50, 50, 200]); // 短い振動の後に長い振動
  }
  
  static tap() {
    this.vibrate([30]); // シンプルなタップ振動
  }
  
  static countdown() {
    this.vibrate([100]); // カウントダウン用
  }
}

export default HapticManager;