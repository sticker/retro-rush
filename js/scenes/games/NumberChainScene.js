import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import SoundManager from '../../utils/SoundManager.js';

class NumberChainScene extends BaseGameScene {
  constructor() {
    super({ key: 'NumberChainScene' });
  }

  create() {
    // ゲーム状態を一元管理（最初から正しい値を設定）
    this.gameState = {
      score: 0,
      timeLeft: 8,
      currentNumber: 1,
      chain: [],
      isPlaying: false
    };
    
    this.numberButtons = [];
    this.chainLines = [];
    
    this.createUI();
    this.createNumbers();
    this.createThumbZoneUI();
    
    // UIを最初に更新
    this.updateUI();
    
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'ナンバーチェイン', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 8', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(1, 0);
    
    // 次の数字表示
    this.nextNumberText = this.add.text(centerX, 100, '次は: [1]', {
      fontSize: '18px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.add.text(centerX, 120, '1→2→3→4→5の順でタップ！', {
      fontSize: '12px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // チェーン表示エリア
    this.chainText = this.add.text(centerX, 140, '', {
      fontSize: '16px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ffffff'
    }).setOrigin(0.5);
  }

  createNumbers() {
    const thumbStartY = this.game.config.height * UI_CONFIG.THUMB_ZONE.startY;
    const playArea = {
      x: UI_CONFIG.DEAD_ZONE,
      y: thumbStartY + 20,
      width: this.game.config.width - (UI_CONFIG.DEAD_ZONE * 2),
      height: (this.game.config.height * UI_CONFIG.THUMB_ZONE.endY) - thumbStartY - 40
    };
    
    // 1-5の数字をランダムに配置
    const numbers = [1, 2, 3, 4, 5];
    const positions = this.generateRandomPositions(numbers.length, playArea);
    
    numbers.forEach((number, index) => {
      const pos = positions[index];
      const button = this.add.circle(pos.x, pos.y, 25, 0x4444ff);
      button.setStrokeStyle(3, 0x6666ff);
      
      const text = this.add.text(pos.x, pos.y, number.toString(), {
        fontSize: '24px',
        fontFamily: UI_CONFIG.FONT.family,
        color: '#ffffff'
      }).setOrigin(0.5);
      
      button.numberValue = number;
      button.numberText = text;
      button.isClicked = false;
      
      // 共通タップ判定システムを使用
      this.addTapHandler(button, (obj) => {
        if (this.gameState.isPlaying && !obj.isClicked) {
          this.clickNumber(obj);
        }
      }, { cooldown: 50 });
      
      button.on('pointerover', () => {
        if (!button.isClicked) {
          button.setScale(1.1);
          button.setFillStyle(0x6666ff);
        }
      });
      
      button.on('pointerout', () => {
        if (!button.isClicked) {
          button.setScale(1.0);
          button.setFillStyle(0x4444ff);
        }
      });
      
      this.numberButtons.push(button);
    });
  }

  generateRandomPositions(count, area) {
    const positions = [];
    const minDistance = 80;
    
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let validPosition = false;
      let pos;
      
      while (!validPosition && attempts < 50) {
        pos = {
          x: area.x + 40 + Math.random() * (area.width - 80),
          y: area.y + 40 + Math.random() * (area.height - 80)
        };
        
        validPosition = true;
        for (const existingPos of positions) {
          const distance = Math.sqrt(
            Math.pow(pos.x - existingPos.x, 2) + 
            Math.pow(pos.y - existingPos.y, 2)
          );
          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }
        attempts++;
      }
      
      positions.push(pos);
    }
    
    return positions;
  }

  startGame() {
    // isPlayingだけをtrueに変更（他の状態はリセットしない）
    this.gameState.isPlaying = true;
    
    // タイマー開始
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameState.timeLeft--;
        this.timeText.setText(`TIME: ${this.gameState.timeLeft}`);
        
        if (this.gameState.timeLeft <= 0) {
          this.endGame();
        }
      },
      repeat: 7
    });
  }

  clickNumber(button) {
    // 既にゲームが終了している場合は何もしない
    if (!this.gameState.isPlaying) return;
    
    // 現在の数字をローカル変数に保存（巻き戻り防止）
    const expectedNumber = this.gameState.currentNumber;
    
    if (button.numberValue === expectedNumber) {
      // 正解
      button.isClicked = true;
      button.setFillStyle(0x00ff00);
      button.setScale(1.0);
      
      // 状態を一度に更新
      this.gameState.chain.push(button.numberValue);
      this.gameState.currentNumber = expectedNumber + 1;
      
      // エフェクト
      SoundManager.playCorrect();
      HapticManager.success();
      RetroEffects.createParticles(this, button.x, button.y, 'success');
      this.showQuickFeedback('正解！', 0x00ff00, button.x, button.y - 40);
      
      // チェーンライン描画
      if (this.gameState.chain.length > 1) {
        this.drawChainLine();
      }
      
      // スコア加算
      const timeBonus = Math.floor(this.gameState.timeLeft * 10);
      const chainBonus = this.gameState.chain.length * 50;
      this.gameState.score += 100 + timeBonus + chainBonus;
      
      // UI更新
      this.updateUI();
      
      // クリア判定（遅延実行で画面停止を防ぐ）
      if (this.gameState.currentNumber > 5) {
        this.time.delayedCall(100, () => {
          this.completeChain();
        });
      }
    } else {
      // 間違い - タイマーを停めない
      HapticManager.fail();
      RetroEffects.createParticles(this, button.x, button.y, 'fail');
      this.showQuickFeedback('違います！', 0xff0000, button.x, button.y - 40);
      
      // ボタンを赤く点滅（軽量化）
      button.setFillStyle(0xff6666);
      this.time.delayedCall(200, () => {
        if (!button.isClicked) {
          button.setFillStyle(0x4444ff);
        }
      });
    }
  }

  drawChainLine() {
    if (this.gameState.chain.length < 2) return;
    
    const prevButton = this.numberButtons.find(b => b.numberValue === this.gameState.chain[this.gameState.chain.length - 2]);
    const currentButton = this.numberButtons.find(b => b.numberValue === this.gameState.chain[this.gameState.chain.length - 1]);
    
    if (prevButton && currentButton) {
      // Graphics オブジェクトを使用してラインを描画
      const graphics = this.add.graphics();
      graphics.lineStyle(4, 0x00ff00, 0.8);
      graphics.beginPath();
      graphics.moveTo(prevButton.x, prevButton.y);
      graphics.lineTo(currentButton.x, currentButton.y);
      graphics.strokePath();
      
      // ライン描画アニメーション
      graphics.setAlpha(0);
      this.tweens.add({
        targets: graphics,
        alpha: 0.8,
        duration: 300,
        ease: 'Power2.easeOut'
      });
      
      // チェーンライン配列に追加（後で削除用）
      if (!this.chainLines) {
        this.chainLines = [];
      }
      this.chainLines.push(graphics);
    }
  }

  updateUI() {
    // ゲーム状態から読み取る（常に最新の状態を反映）
    this.scoreText.setText(`SCORE: ${this.gameState.score}`);
    
    if (this.gameState.currentNumber <= 5) {
      this.nextNumberText.setText(`次は: [${this.gameState.currentNumber}]`);
    } else {
      this.nextNumberText.setText('完成！');
    }
    
    // チェーン表示
    const chainDisplay = this.gameState.chain.map((num, index) => {
      if (index < this.gameState.chain.length - 1) {
        return `${num}→`;
      }
      return num.toString();
    }).join('');
    
    this.chainText.setText(chainDisplay);
  }

  completeChain() {
    if (!this.gameState.isPlaying) return; // 既に完了している場合は何もしない
    
    this.gameState.isPlaying = false;
    
    HapticManager.perfect();
    
    // 完成エフェクト
    this.numberButtons.forEach((button, index) => {
      this.time.delayedCall(index * 100, () => {
        RetroEffects.createParticles(this, button.x, button.y, 'perfect');
        RetroEffects.bounceEffect(this, button);
        RetroEffects.bounceEffect(this, button.numberText);
      });
    });
    
    // 完成ボーナス
    const completionBonus = 500;
    const timeBonus = Math.floor(this.gameState.timeLeft * 50);
    this.gameState.score += completionBonus + timeBonus;
    this.updateUI();
    
    this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'CHAIN COMPLETE!', {
      fontSize: '20px',
      fontFamily: UI_CONFIG.FONT.family,
      color: '#ff00ff'
    }).setOrigin(0.5);
    
    this.time.delayedCall(1500, () => {
      this.endGame(true); // 成功として終了
    });
  }

  endGame(fromCompleteChain = false) {
    this.gameState.isPlaying = false;
    
    if (this.gameTimer) this.gameTimer.destroy();
    
    // チェーンラインをクリーンアップ
    if (this.chainLines) {
      this.chainLines.forEach(line => {
        if (line && line.destroy) {
          line.destroy();
        }
      });
      this.chainLines = [];
    }
    
    ScoreManager.addScore(this.gameState.score);
    
    // クリア判定
    const isCleared = this.gameState.chain.length === 5;
    
    if (isCleared) {
      // クリア時のみゲーム完了としてカウント
      ScoreManager.completeGame();
      if (!fromCompleteChain) {
        // completeChain()から呼ばれた場合は既にエフェクトが表示されているのでスキップ
        this.showClearEffect();
      }
    } else {
      this.showFailEffect();
      this.add.text(this.game.config.width / 2, this.game.config.height / 2, `${this.gameState.chain.length}/5 完了`, {
        fontSize: '20px',
        fontFamily: UI_CONFIG.FONT.family,
        color: '#ffff00'
      }).setOrigin(0.5);
    }
    
    this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
      this.endGameAndTransition();
    });
  }
}

export default NumberChainScene;