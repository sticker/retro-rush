import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import SoundManager from '../../utils/SoundManager.js';

/**
 * メモリーフラッシュゲーム
 * プレイヤーは光る順番を記憶し、同じ順番でボタンをタップする
 */
class MemoryFlashScene extends BaseGameScene {
  constructor() {
    super({ key: 'MemoryFlashScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 7; // 7秒間のゲーム
    this.isPlaying = false;
    this.isShowingSequence = false;
    this.currentSequence = [];
    this.playerSequence = [];
    this.sequenceLength = 3; // 最初は3個から
    this.completedSequences = 0;
    this.targetSequences = 2; // 2回成功でクリア
    this.colorButtons = [];
    
    // 4つの色ボタン用の色定義
    this.colors = [
      { name: 'RED', value: 0xff3333, darkValue: 0x800000 },
      { name: 'GREEN', value: 0x33ff33, darkValue: 0x008000 },
      { name: 'BLUE', value: 0x3333ff, darkValue: 0x000080 },
      { name: 'YELLOW', value: 0xffff33, darkValue: 0x808000 }
    ];
    
    // UI作成
    this.createUI();
    this.createColorButtons();
    this.createThumbZoneUI();
    
    // カウントダウン開始
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'メモリーフラッシュ', {
      fontSize: '24px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 7', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(1, 0);
    
    // 進行状況表示
    this.progressText = this.add.text(centerX, 100, '覚えて！', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#00ff00'
    }).setOrigin(0.5);
  }

  createColorButtons() {
    const thumbStartY = this.game.config.height * UI_CONFIG.THUMB_ZONE.startY;
    const thumbEndY = this.game.config.height * UI_CONFIG.THUMB_ZONE.endY;
    const centerX = this.game.config.width / 2;
    const centerY = thumbStartY + (thumbEndY - thumbStartY) / 2;
    
    // 2x2配置でボタンを作成
    const buttonSize = 60;
    const spacing = 30;
    
    const positions = [
      { x: centerX - buttonSize / 2 - spacing / 2, y: centerY - buttonSize / 2 - spacing / 2 }, // 左上
      { x: centerX + buttonSize / 2 + spacing / 2, y: centerY - buttonSize / 2 - spacing / 2 }, // 右上
      { x: centerX - buttonSize / 2 - spacing / 2, y: centerY + buttonSize / 2 + spacing / 2 }, // 左下
      { x: centerX + buttonSize / 2 + spacing / 2, y: centerY + buttonSize / 2 + spacing / 2 }  // 右下
    ];
    
    this.colors.forEach((color, index) => {
      const pos = positions[index];
      
      // ボタン作成
      const button = this.add.circle(pos.x, pos.y, buttonSize / 2, color.darkValue);
      button.setStrokeStyle(3, 0xffffff);
      button.colorIndex = index;
      button.normalColor = color.darkValue;
      button.flashColor = color.value;
      
      // 共通タップ判定システムを使用
      this.addTapHandler(button, (obj) => {
        if (this.isPlaying && !this.isShowingSequence) {
          this.onButtonTap(obj.colorIndex);
        }
      }, { cooldown: 30 });
      
      this.colorButtons.push(button);
    });
  }

  startGame() {
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 7;
    this.completedSequences = 0;
    this.sequenceLength = 3;
    
    // タイマー開始
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timeText.setText(`TIME: ${this.timeLeft}`);
        
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      repeat: 6
    });
    
    // 最初のシーケンス開始
    this.startNewSequence();
  }

  startNewSequence() {
    if (!this.isPlaying) return;
    
    // 新しいシーケンスを生成
    this.currentSequence = [];
    this.playerSequence = [];
    
    for (let i = 0; i < this.sequenceLength; i++) {
      this.currentSequence.push(Phaser.Math.Between(0, 3));
    }
    
    this.progressText.setText(`覚えて！ (${this.sequenceLength}個)`);
    this.progressText.setColor('#00ff00');
    
    // シーケンス表示開始
    this.showSequence();
  }

  showSequence() {
    this.isShowingSequence = true;
    let sequenceIndex = 0;
    
    // 最初の少し待機
    this.time.delayedCall(300, () => {
      this.showNextButton();
    });
    
    const showNextButton = () => {
      if (sequenceIndex >= this.currentSequence.length) {
        // シーケンス表示完了
        this.isShowingSequence = false;
        this.progressText.setText('タップして！');
        this.progressText.setColor('#ffff00');
        return;
      }
      
      const buttonIndex = this.currentSequence[sequenceIndex];
      this.flashButton(buttonIndex);
      
      sequenceIndex++;
      
      // 次のボタンを500ms後に表示
      this.time.delayedCall(500, showNextButton);
    };
    
    this.showNextButton = showNextButton;
  }

  flashButton(buttonIndex) {
    const button = this.colorButtons[buttonIndex];
    
    // ボタンを光らせる
    button.setFillStyle(button.flashColor);
    SoundManager.playBeep();
    RetroEffects.bounceEffect(this, button, 0.1);
    
    // 300ms後に元の色に戻す
    this.time.delayedCall(300, () => {
      button.setFillStyle(button.normalColor);
    });
  }

  onButtonTap(buttonIndex) {
    const button = this.colorButtons[buttonIndex];
    
    // タップエフェクト
    SoundManager.playPush();
    HapticManager.tap();
    button.setFillStyle(button.flashColor);
    
    this.time.delayedCall(150, () => {
      button.setFillStyle(button.normalColor);
    });
    
    // プレイヤーのシーケンスに追加
    this.playerSequence.push(buttonIndex);
    
    // 正解チェック
    const currentIndex = this.playerSequence.length - 1;
    
    if (this.playerSequence[currentIndex] !== this.currentSequence[currentIndex]) {
      // 間違い
      this.onSequenceWrong();
    } else if (this.playerSequence.length === this.currentSequence.length) {
      // シーケンス完了
      this.onSequenceComplete();
    }
  }

  onSequenceComplete() {
    this.completedSequences++;
    this.score += 200 + (this.sequenceLength * 50); // 長いシーケンスほど高得点
    this.scoreText.setText(`SCORE: ${this.score}`);
    
    HapticManager.success();
    this.showQuickFeedback('Perfect!', 0x00ff00, this.game.config.width / 2, this.game.config.height / 2);
    
    if (this.completedSequences >= this.targetSequences) {
      // ゲームクリア
      this.endGame();
    } else {
      // 次のシーケンス（より長く）
      this.sequenceLength = Math.min(6, this.sequenceLength + 1); // 最大6個まで
      
      this.time.delayedCall(800, () => {
        if (this.isPlaying) {
          this.startNewSequence();
        }
      });
    }
  }

  onSequenceWrong() {
    this.showQuickFeedback('Miss!', 0xff0000, this.game.config.width / 2, this.game.config.height / 2);
    HapticManager.fail();
    
    // やり直し（同じ長さで）
    this.time.delayedCall(800, () => {
      if (this.isPlaying) {
        this.startNewSequence();
      }
    });
  }

  endGame() {
    this.isPlaying = false;
    this.isShowingSequence = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    
    ScoreManager.addScore(this.score);
    
    // クリア判定
    const isCleared = this.completedSequences >= this.targetSequences;
    
    if (isCleared) {
      // クリア時のみゲーム完了としてカウント
      ScoreManager.completeGame();
      
      // クリア演出
      this.showClearEffect(() => {
        this.endGameAndTransition();
      });
    } else {
      // 失敗演出
      this.showFailEffect();
      this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
        this.endGameAndTransition();
      });
    }
  }
}

export default MemoryFlashScene;