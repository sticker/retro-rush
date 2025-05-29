import MainMenuScene from './scenes/MainMenuScene.js';
import GameSelectScene from './scenes/GameSelectScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import MoleWhackScene from './scenes/games/MoleWhackScene.js';
import RhythmJumpScene from './scenes/games/RhythmJumpScene.js';
import ColorMatchScene from './scenes/games/ColorMatchScene.js';
import MissileDefenseScene from './scenes/games/MissileDefenseScene.js';
import BalanceTowerScene from './scenes/games/BalanceTowerScene.js';
import NumberChainScene from './scenes/games/NumberChainScene.js';

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
    GameSelectScene,
    MoleWhackScene,
    RhythmJumpScene,
    ColorMatchScene,
    MissileDefenseScene,
    BalanceTowerScene,
    NumberChainScene,
    GameOverScene
  ]
};

// ゲーム開始
const game = new Phaser.Game(config);