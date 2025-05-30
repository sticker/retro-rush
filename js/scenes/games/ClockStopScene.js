import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import SoundManager from '../../utils/SoundManager.js';

// クロックストップ - 12時ピッタリを狙え！
class ClockStopScene extends BaseGameScene {
    constructor() {
        super({ key: 'ClockStopScene' });
        this.gameTime = 9; // ゲーム時間（秒）
        this.clearCondition = 3; // クリア条件（成功回数）
        this.successCount = 0; // 成功回数
        this.isPlaying = false;
        this.clockHand = null;
        this.currentSpeed = 200; // 初期回転速度（度/秒）
        this.canTap = true; // タップ可能フラグ
        this.targetAngle = 0; // 12時の角度（0度）
        this.gameEnded = false; // ゲーム終了フラグ
    }

    create() {
        // ゲーム状態をリセット
        this.gameTime = 9;
        this.successCount = 0;
        this.isPlaying = false;
        this.clockHand = null;
        this.currentSpeed = 1.5;
        this.canTap = true;
        this.gameEnded = false;
        
        // 背景
        this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            0x222222
        );

        // タイトル
        this.add.text(this.game.config.width / 2, 40, 'クロックストップ', {
            fontSize: '24px',
            color: '#ffff00',
            fontFamily: UI_CONFIG.FONT.family
        }).setOrigin(0.5);

        // 成功回数表示
        this.scoreText = this.add.text(30, 80, `成功: ${'★'.repeat(this.successCount)}${'☆'.repeat(this.clearCondition - this.successCount)}`, {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: UI_CONFIG.FONT.family
        });

        // 残り時間表示
        this.timeText = this.add.text(this.game.config.width - 30, 80, `残り${this.gameTime}秒`, {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: UI_CONFIG.FONT.family
        }).setOrigin(1, 0);

        // 時計を作成
        this.createClock();

        // 指示テキスト
        this.instructionText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height - 100,
            '12時ピッタリで\nタップ！',
            {
                fontSize: '20px',
                color: '#00ff00',
                fontFamily: UI_CONFIG.FONT.family,
                align: 'center'
            }
        ).setOrigin(0.5);

        // タップハンドラー（画面全体）
        this.input.on('pointerdown', () => {
            if (this.isPlaying && this.canTap) {
                this.checkTiming();
            }
        });

        // カウントダウン開始
        this.createCountdown(() => {
            this.startGame();
        });
    }

    createClock() {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;
        const radius = 100;

        // 時計の外枠
        const clockFrame = this.add.circle(centerX, centerY, radius + 10, 0x000000);
        clockFrame.setStrokeStyle(4, 0xffffff);

        // 時計の文字盤
        const clockFace = this.add.circle(centerX, centerY, radius, 0x333333);
        clockFace.setStrokeStyle(2, 0x666666);

        // 時計の数字
        const numbers = ['12', '3', '6', '9'];
        const angles = [-90, 0, 90, 180];
        
        numbers.forEach((num, index) => {
            const angle = angles[index] * Math.PI / 180;
            const x = centerX + Math.cos(angle) * (radius - 25);
            const y = centerY + Math.sin(angle) * (radius - 25);
            
            const text = this.add.text(x, y, num, {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: UI_CONFIG.FONT.family
            }).setOrigin(0.5);
            
            // 12時を強調
            if (num === '12') {
                text.setStyle({ 
                    fontSize: '24px',
                    color: '#ffff00',
                    stroke: '#ff0000',
                    strokeThickness: 2
                });
            }
        });

        // 小さな目盛り
        for (let i = 0; i < 12; i++) {
            if (i % 3 !== 0) { // 3, 6, 9, 12以外
                const angle = (i * 30 - 90) * Math.PI / 180;
                const x1 = centerX + Math.cos(angle) * (radius - 10);
                const y1 = centerY + Math.sin(angle) * (radius - 10);
                const x2 = centerX + Math.cos(angle) * (radius - 5);
                const y2 = centerY + Math.sin(angle) * (radius - 5);
                
                const line = this.add.line(0, 0, x1, y1, x2, y2, 0x666666, 1);
            }
        }

        // 中心の軸
        this.add.circle(centerX, centerY, 8, 0xffff00);
        this.add.circle(centerX, centerY, 5, 0x000000);

        // 時計の針
        this.clockHand = this.add.container(centerX, centerY);
        
        // 針の本体
        const hand = this.add.rectangle(0, -40, 6, 80, 0xff0000);
        hand.setOrigin(0.5, 1);
        
        // 針の先端
        const tip = this.add.triangle(0, -80, -4, 0, 4, 0, 0, -10, 0xff0000);
        
        this.clockHand.add([hand, tip]);
        
        // 初期位置（ランダム）
        this.clockHand.angle = Phaser.Math.Between(0, 359);
    }

    startGame() {
        this.isPlaying = true;
        this.instructionText.setColor('#ffffff');
        
        // 針の回転を開始
        this.startRotation();

        // ゲームタイマー
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.gameTime--;
                this.timeText.setText(`残り${this.gameTime}秒`);
                
                if (this.gameTime <= 0) {
                    this.endGame();
                }
            },
            repeat: this.gameTime - 1
        });
    }

    startRotation() {
        // 針の回転速度をランダムに変更（度/秒単位で設定）
        // ラウンドごとに速度を上げる
        const baseSpeed = 270 + (this.successCount * 60); // 成功するごとに速くなる（基準速度270度/秒 = 1.3秒で1回転）
        this.currentSpeed = Phaser.Math.FloatBetween(baseSpeed * 0.8, baseSpeed * 1.2);
        
        // 時計回りか反時計回りかもランダム
        if (Phaser.Math.Between(0, 1) === 0) {
            this.currentSpeed *= -1;
        }
        
        // 速度変化の演出
        const speedText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 + 150,
            this.currentSpeed > 0 ? '高速回転中' : '逆回転中',
            {
                fontSize: '16px',
                color: '#00ffff',
                fontFamily: UI_CONFIG.FONT.family
            }
        ).setOrigin(0.5);
        
        this.tweens.add({
            targets: speedText,
            alpha: 0,
            duration: 1000,
            onComplete: () => speedText.destroy()
        });
        
        // 回転音
        SoundManager.play('push');
    }

    update(time, delta) {
        if (!this.isPlaying || !this.clockHand) return;

        // 針を回転（delta timeベースで一定速度を保証）
        const rotationAmount = (this.currentSpeed * delta) / 1000; // delta はミリ秒なので秒に変換
        this.clockHand.angle += rotationAmount;
        
        // 角度を0-360の範囲に正規化
        if (this.clockHand.angle < 0) {
            this.clockHand.angle += 360;
        } else if (this.clockHand.angle >= 360) {
            this.clockHand.angle -= 360;
        }
    }

    checkTiming() {
        if (!this.canTap) return;
        
        this.canTap = false;
        
        // 現在の角度を取得（0度が12時）
        let currentAngle = this.clockHand.angle;
        
        // 角度を0-360の範囲に正規化
        while (currentAngle < 0) currentAngle += 360;
        while (currentAngle >= 360) currentAngle -= 360;
        
        // 12時（0度）との差分を計算
        let diff = Math.abs(currentAngle - 0);
        if (diff > 180) {
            diff = 360 - diff;
        }
        
        // 判定
        let result = 'miss';
        let feedbackText = '';
        let feedbackColor = 0xff0000;
        let score = 0;
        
        if (diff <= 10) {
            // パーフェクト！
            result = 'perfect';
            feedbackText = 'パーフェクト！';
            feedbackColor = 0xffff00;
            score = 200;
            this.successCount++;
        } else if (diff <= 25) {
            // グッド
            result = 'good';
            feedbackText = 'グッド！';
            feedbackColor = 0x00ff00;
            score = 100;
            this.successCount++;
        } else {
            // ミス
            result = 'miss';
            feedbackText = 'ミス！';
            feedbackColor = 0xff0000;
            score = 0;
        }
        
        // フィードバック表示
        this.showTimingFeedback(result, feedbackText, feedbackColor);
        
        // スコア加算
        if (score > 0) {
            ScoreManager.addScore(score);
        }
        
        // 成功回数更新
        this.scoreText.setText(`成功: ${'★'.repeat(this.successCount)}${'☆'.repeat(Math.max(0, this.clearCondition - this.successCount))}`);
        
        // クリア判定
        if (this.successCount >= this.clearCondition) {
            this.clearGame();
            return;
        }
        
        // 次のラウンドへ
        this.time.delayedCall(500, () => {
            if (this.isPlaying) {
                this.canTap = true;
                this.startRotation();
            }
        });
    }

    showTimingFeedback(result, text, color) {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;
        
        // フィードバックテキスト
        const feedback = this.add.text(centerX, centerY - 150, text, {
            fontSize: '32px',
            color: Phaser.Display.Color.IntegerToColor(color).rgba,
            fontFamily: UI_CONFIG.FONT.family,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // エフェクト
        RetroEffects.bounceEffect(this, feedback);
        
        if (result === 'perfect') {
            // パーフェクト時の特別演出
            RetroEffects.createParticles(this, centerX, centerY, 'perfect');
            HapticManager.perfect();
            SoundManager.play('correct');
            
            // 時計を光らせる
            const flash = this.add.circle(centerX, centerY, 120, 0xffff00, 0.5);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 1.5,
                duration: 500,
                onComplete: () => flash.destroy()
            });
        } else if (result === 'good') {
            HapticManager.success();
            SoundManager.play('jump');
        } else {
            HapticManager.fail();
            SoundManager.playBeep();
            
            // 画面を揺らす
            this.cameras.main.shake(200, 0.005);
        }
        
        // フィードバックを消す
        this.tweens.add({
            targets: feedback,
            alpha: 0,
            y: centerY - 180,
            duration: 1000,
            onComplete: () => feedback.destroy()
        });
    }

    clearGame() {
        // 既に終了している場合は何もしない
        if (this.gameEnded) return;
        
        this.gameEnded = true;
        this.isPlaying = false;
        this.canTap = false;
        
        // タイマー停止
        if (this.gameTimer) this.gameTimer.remove();

        // 針の回転を停止
        this.currentSpeed = 0;

        // スコア計算
        const timeBonus = this.gameTime * 20;
        const totalScore = (this.successCount * 200) + timeBonus;
        ScoreManager.addScore(totalScore);
        
        // クリア完了を記録（重要！）
        ScoreManager.completeGame();

        // クリア演出
        this.showClearEffect(() => {
            this.endGameAndTransition();
        });
    }

    endGame() {
        // 既に終了している場合は何もしない
        if (this.gameEnded) return;
        
        this.gameEnded = true;
        this.isPlaying = false;
        this.canTap = false;

        // タイマー停止
        if (this.gameTimer) this.gameTimer.remove();

        // 針の回転を停止
        this.currentSpeed = 0;

        // 失敗判定
        const isSuccess = this.successCount >= this.clearCondition;
        
        if (!isSuccess) {
            this.showFailEffect();
            
            // 失敗メッセージ
            const failText = this.add.text(
                this.game.config.width / 2,
                this.game.config.height / 2,
                '時間切れ...',
                {
                    fontSize: '32px',
                    color: '#ff0000',
                    fontFamily: UI_CONFIG.FONT.family
                }
            ).setOrigin(0.5);
            
            RetroEffects.bounceEffect(this, failText);
        }

        // スコア計算
        const score = this.successCount * 150;
        ScoreManager.addScore(score);

        // 1.5秒後に画面遷移
        this.time.delayedCall(1500, () => {
            this.endGameAndTransition();
        });
    }
}

export default ClockStopScene;