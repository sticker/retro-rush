import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import GameSelectScene from './scenes/GameSelectScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import MoleWhackScene from './scenes/games/MoleWhackScene.js';
import RhythmJumpScene from './scenes/games/RhythmJumpScene.js';
import ColorMatchScene from './scenes/games/ColorMatchScene.js';
import MissileDefenseScene from './scenes/games/MissileDefenseScene.js';
import BalanceTowerScene from './scenes/games/BalanceTowerScene.js';
import NumberChainScene from './scenes/games/NumberChainScene.js';
import SpaceDebrisScene from './scenes/games/SpaceDebrisScene.js';
import ClockStopScene from './scenes/games/ClockStopScene.js';
import ShapeSortScene from './scenes/games/ShapeSortScene.js';

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
  audio: {
    disableWebAudio: false, // WebAudioを有効に
    noAudio: false // 音声を有効に
  },
  scene: [
    PreloadScene,
    MainMenuScene,
    GameSelectScene,
    MoleWhackScene,
    RhythmJumpScene,
    ColorMatchScene,
    MissileDefenseScene,
    BalanceTowerScene,
    NumberChainScene,
    SpaceDebrisScene,
    ClockStopScene,
    ShapeSortScene,
    GameOverScene
  ]
};

// ゲーム開始
const game = new Phaser.Game(config);

// モバイル端末での音声コンテキストアンロック
// ユーザーインタラクションで音声を有効化
const enableAudio = () => {
  try {
    if (game.sound && game.sound.locked) {
      game.sound.unlock();
    }
    // モバイルブラウザのためのAudioContextアンロック
    if (window.AudioContext || window.webkitAudioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    }
  } catch (error) {
    console.warn('Audio unlock failed:', error);
  }
};

// 様々なイベントで音声アンロックを試行
document.addEventListener('touchstart', enableAudio, { once: true });
document.addEventListener('touchend', enableAudio, { once: true });
document.addEventListener('click', enableAudio, { once: true });
document.addEventListener('keydown', enableAudio, { once: true });