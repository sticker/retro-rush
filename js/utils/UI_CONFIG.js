// UI定数
const UI_CONFIG = {
  // 親指が届きやすい範囲（画面下部60%）
  THUMB_ZONE: {
    startY: 0.4,
    endY: 0.9
  },
  // タップエリアの最小サイズ
  MIN_TAP_SIZE: 48,
  // タップエリア間の間隔
  TAP_PADDING: 8,
  // 画面端の無効エリア
  DEAD_ZONE: 16,
  // 連続タップ防止時間
  TAP_COOLDOWN: 100,
  // 高速画面遷移
  TRANSITION: {
    showResult: 500,
    autoNext: 300,
    betweenGames: 200
  }
};

export default UI_CONFIG;