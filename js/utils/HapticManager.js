// 振動フィードバック管理
class HapticManager {
  static isSupported() {
    // Vibration APIのサポートチェック
    return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
  }
  
  static vibrate(pattern) {
    try {
      if (this.isSupported()) {
        // iOSでは動作しないが、エラーは出さない
        const result = navigator.vibrate(pattern);
        if (!result) {
          console.log('Vibration not supported on this device');
        }
      }
    } catch (e) {
      // エラーは静かに処理（iOSなど非対応環境のため）
      console.log('Vibration not available:', e.message);
    }
  }
  
  static success() {
    this.vibrate([0, 20, 30, 20]);
  }
  
  static fail() {
    this.vibrate([0, 50]);
  }
  
  static perfect() {
    this.vibrate([0, 10, 10, 10, 10, 10]);
  }
  
  static tap() {
    this.vibrate([10]); // シンプルな10ms振動
  }
  
  static countdown() {
    this.vibrate([30]);
  }
}

export default HapticManager;