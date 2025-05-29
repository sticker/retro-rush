import MainMenuScene from './scenes/MainMenuScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import MoleWhackScene from './scenes/games/MoleWhackScene.js';
import RhythmJumpScene from './scenes/games/RhythmJumpScene.js';
import ColorMatchScene from './scenes/games/ColorMatchScene.js';

// Phaserゲーム設定
const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    MainMenuScene,
    MoleWhackScene,
    RhythmJumpScene,
    ColorMatchScene,
    GameOverScene
  ]
};

// ゲーム開始
const game = new Phaser.Game(config);