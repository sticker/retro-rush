import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';

class NumberChainScene extends BaseGameScene {
  constructor() {
    super({ key: 'NumberChainScene' });
  }

  create() {
    this.score = 0;
    this.timeLeft = 8; // 8秒間のゲーム
    this.currentNumber = 1;
    this.numberButtons = [];
    this.isPlaying = false;
    this.chain = [];
    this.chainLines = [];
    
    this.createUI();
    this.createNumbers();
    this.createThumbZoneUI();
    
    this.createCountdown(() => {
      this.startGame();
    });
  }

  createUI() {
    const centerX = this.game.config.width / 2;
    
    this.add.text(centerX, 30, 'ナンバーチェイン', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(50, 80, 'SCORE: 0', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    });
    
    this.timeText = this.add.text(this.game.config.width - 50, 80, 'TIME: 8', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    }).setOrigin(1, 0);
    
    // 次の数字表示
    this.nextNumberText = this.add.text(centerX, 100, '次は: [1]', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#00ff00'
    }).setOrigin(0.5);
    
    this.add.text(centerX, 120, '1→2→3→4→5の順でタップ！', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ffff00'
    }).setOrigin(0.5);
    
    // チェーン表示エリア
    this.chainText = this.add.text(centerX, 140, '', {
      fontSize: '16px',
      fontFamily: 'Courier New',
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
        fontFamily: 'Courier New',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      button.numberValue = number;
      button.numberText = text;
      button.isClicked = false;
      
      button.setInteractive({ useHandCursor: true });
      // より寛容な連続タップ対応
      const handleClick = () => {
        if (this.isPlaying && !button.isClicked) {
          // 正しい番号の場合のみ即座にフラグを設定
          if (button.numberValue === this.currentNumber) {
            button.isClicked = true;
            button.disableInteractive(); // インタラクティブを無効化
          }
          this.clickNumber(button);
        }
      };
      
      button.on('pointerdown', handleClick);
      button.on('pointerup', handleClick);
      
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
    this.isPlaying = true;
    this.score = 0;
    this.timeLeft = 8;
    this.currentNumber = 1;
    this.chain = [];
    
    this.updateUI();
    
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
      repeat: 7
    });
  }

  clickNumber(button) {
    // 既にゲームが終了しているか、既にクリック済みの場合は何もしない
    if (!this.isPlaying || button.isClicked) return;
    
    if (button.numberValue === this.currentNumber) {
      // 正解 - 即座にフラグを設定
      button.isClicked = true;
      button.disableInteractive();
      button.setFillStyle(0x00ff00);
      button.setScale(1.0);
      
      this.chain.push(button.numberValue);
      this.currentNumber++;
      
      // エフェクト
      HapticManager.success();
      RetroEffects.createParticles(this, button.x, button.y, 'success');
      this.showQuickFeedback('正解！', 0x00ff00, button.x, button.y - 40);
      
      // チェーンライン描画
      if (this.chain.length > 1) {
        this.drawChainLine();
      }
      
      // スコア加算
      const timeBonus = Math.floor(this.timeLeft * 10);
      const chainBonus = this.chain.length * 50;
      this.score += 100 + timeBonus + chainBonus;
      
      // UI更新
      this.updateUI();
      
      // クリア判定（遅延実行で画面停止を防ぐ）
      if (this.currentNumber > 5) {
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
      button.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        button.clearTint();
      });
    }
  }

  drawChainLine() {
    if (this.chain.length < 2) return;
    
    const prevButton = this.numberButtons.find(b => b.numberValue === this.chain[this.chain.length - 2]);
    const currentButton = this.numberButtons.find(b => b.numberValue === this.chain[this.chain.length - 1]);
    
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
    this.scoreText.setText(`SCORE: ${this.score}`);
    
    if (this.currentNumber <= 5) {
      this.nextNumberText.setText(`次は: [${this.currentNumber}]`);
    } else {
      this.nextNumberText.setText('完成！');
    }
    
    // チェーン表示
    const chainDisplay = this.chain.map((num, index) => {
      if (index < this.chain.length - 1) {
        return `${num}→`;
      }
      return num.toString();
    }).join('');
    
    this.chainText.setText(chainDisplay);
  }

  completeChain() {
    if (!this.isPlaying) return; // 既に完了している場合は何もしない
    
    this.isPlaying = false;
    
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
    const timeBonus = Math.floor(this.timeLeft * 50);
    this.score += completionBonus + timeBonus;
    this.updateUI();
    
    this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'CHAIN COMPLETE!', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ff00ff'
    }).setOrigin(0.5);
    
    this.time.delayedCall(1500, () => {
      this.endGame();
    });
  }

  endGame() {
    this.isPlaying = false;
    
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
    
    ScoreManager.addScore(this.score);
    ScoreManager.completeGame();
    
    // 結果表示
    const completed = this.chain.length === 5;
    if (!completed) {
      this.add.text(this.game.config.width / 2, this.game.config.height / 2, `${this.chain.length}/5 完了`, {
        fontSize: '20px',
        fontFamily: 'Courier New',
        color: '#ffff00'
      }).setOrigin(0.5);
    }
    
    this.time.delayedCall(UI_CONFIG.TRANSITION.showResult, () => {
      this.scene.start('GameOverScene');
    });
  }
}

export default NumberChainScene;