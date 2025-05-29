import UI_CONFIG from './UI_CONFIG.js';

/**
 * フォントヘルパー
 * UI_CONFIG.FONTの設定に基づいて統一されたテキストスタイルを提供
 */
class FontHelper {
  /**
   * テキストスタイルを取得
   * @param {Object} customStyle - カスタムスタイル（fontSize, color等）
   * @returns {Object} Phaser用のテキストスタイルオブジェクト
   */
  static getTextStyle(customStyle = {}) {
    return {
      fontFamily: UI_CONFIG.FONT.family,
      ...customStyle
    };
  }
}

export default FontHelper;