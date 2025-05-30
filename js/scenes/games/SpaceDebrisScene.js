import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import SoundManager from '../../utils/SoundManager.js';

// スペースデブリ - 宇宙船を隕石から守れ！
class SpaceDebrisScene extends BaseGameScene {
    constructor() {
        super({ key: 'SpaceDebrisScene' });
        this.gameTime = 10; // ゲーム時間（秒）
        this.clearCondition = 5; // クリア条件（破壊数）
        this.destroyedCount = 0; // 破壊した隕石数
        this.isPlaying = false;
        this.meteors = [];
        this.spaceship = null;
        this.gameEnded = false; // ゲーム終了フラグ
    }

    create() {
        // ゲーム状態をリセット
        this.gameTime = 10;
        this.destroyedCount = 0;
        this.isPlaying = false;
        this.meteors = [];
        this.spaceship = null;
        this.gameEnded = false;
        
        // 背景
        this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            0x000033
        );

        // 星をちりばめる
        for (let i = 0; i < 30; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, this.game.config.width),
                Phaser.Math.Between(0, this.game.config.height),
                Phaser.Math.Between(1, 2),
                0xffffff,
                0.8
            );
            
            // 星のまたたき
            this.tweens.add({
                targets: star,
                alpha: 0.3,
                duration: Phaser.Math.Between(500, 1500),
                yoyo: true,
                repeat: -1
            });
        }

        // タイトル
        this.add.text(this.game.config.width / 2, 40, 'スペースデブリ', {
            fontSize: '24px',
            color: '#00ffff',
            fontFamily: UI_CONFIG.FONT.family
        }).setOrigin(0.5);

        // スコア表示
        this.scoreText = this.add.text(30, 80, `破壊: ${'★'.repeat(this.destroyedCount)}${'☆'.repeat(this.clearCondition - this.destroyedCount)}`, {
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

        // 宇宙船を作成
        this.createSpaceship();

        // 指示テキスト
        this.instructionText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height - 60,
            '宇宙船を守れ！',
            {
                fontSize: '20px',
                color: '#ffff00',
                fontFamily: UI_CONFIG.FONT.family
            }
        ).setOrigin(0.5);

        // カウントダウン開始
        this.createCountdown(() => {
            this.startGame();
        });
    }

    createSpaceship() {
        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height * 0.75;

        // 宇宙船のグループ
        this.spaceship = this.add.container(centerX, centerY);

        // 宇宙船の本体（より宇宙船らしい形状に）
        const body = this.add.polygon(0, 0, [
            -15, 15,    // 左下
            -20, 5,     // 左中
            -10, -15,   // 左上
            0, -25,     // 先端
            10, -15,    // 右上
            20, 5,      // 右中
            15, 15,     // 右下
            0, 10       // 下中央
        ], 0x00ff00);
        body.setStrokeStyle(2, 0xffffff);

        // コックピット（中央に配置）
        const cockpit = this.add.circle(-20, -30, 6, 0x00ffff);
        cockpit.setStrokeStyle(1.5, 0xffffff);

        // エンジン炎（下向きに3つ、位置を少し左に調整）
        const flame1 = this.add.triangle(-20, 5, -15, 10, -18, 25, -12, 25, 0xffaa00);
        const flame2 = this.add.triangle(-10, 5, -5, 10, -8, 28, -2, 28, 0xff6600);
        const flame3 = this.add.triangle(0, 5, 5, 10, 2, 25, 8, 25, 0xffaa00);

        // 炎のアニメーション
        this.tweens.add({
            targets: [flame1, flame2, flame3],
            scaleY: { from: 0.8, to: 1.3 },
            alpha: { from: 0.5, to: 1 },
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.spaceship.add([flame1, flame2, flame3, body, cockpit]);

        // 宇宙船の微妙な浮遊感
        this.tweens.add({
            targets: this.spaceship,
            y: centerY + 5,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    startGame() {
        this.isPlaying = true;
        this.gameEnded = false;
        this.instructionText.destroy();

        // 隕石生成タイマー
        this.meteorTimer = this.time.addEvent({
            delay: 1200,
            callback: () => this.createMeteor(),
            loop: true
        });

        // 最初の隕石を即座に生成
        this.createMeteor();

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

    createMeteor() {
        if (!this.isPlaying) return;

        // 画面の端からランダムに出現
        const side = Phaser.Math.Between(0, 3);
        let x, y, angle;

        switch (side) {
            case 0: // 上
                x = Phaser.Math.Between(0, this.game.config.width);
                y = -30;
                angle = Phaser.Math.Between(45, 135);
                break;
            case 1: // 右
                x = this.game.config.width + 30;
                y = Phaser.Math.Between(0, this.game.config.height * 0.6);
                angle = Phaser.Math.Between(135, 225);
                break;
            case 2: // 下
                x = Phaser.Math.Between(0, this.game.config.width);
                y = this.game.config.height + 30;
                angle = Phaser.Math.Between(225, 315);
                break;
            case 3: // 左
                x = -30;
                y = Phaser.Math.Between(0, this.game.config.height * 0.6);
                angle = Phaser.Math.Between(-45, 45);
                break;
        }

        // 隕石を作成
        const meteorContainer = this.add.container(x, y);
        const size = Phaser.Math.Between(20, 35);
        
        // 隕石の本体（多角形でランダムな形状）
        const points = [];
        const vertices = Phaser.Math.Between(6, 8);
        for (let i = 0; i < vertices; i++) {
            const a = (Math.PI * 2 / vertices) * i;
            const r = size + Phaser.Math.Between(-5, 5);
            points.push(r * Math.cos(a));
            points.push(r * Math.sin(a));
        }
        
        const meteor = this.add.polygon(0, 0, points, 0x666666);
        meteor.setStrokeStyle(2, 0x999999);
        meteorContainer.add(meteor);

        // クレーター
        for (let i = 0; i < 3; i++) {
            const crater = this.add.circle(
                Phaser.Math.Between(-size/2, size/2),
                Phaser.Math.Between(-size/2, size/2),
                Phaser.Math.Between(3, 6),
                0x444444
            );
            meteorContainer.add(crater);
        }

        // 隕石を宇宙船に向かって移動
        const angleToShip = Phaser.Math.Angle.Between(x, y, this.spaceship.x, this.spaceship.y);
        const speed = Phaser.Math.Between(60, 100);
        
        // Physics bodyを作成
        meteorContainer.velocity = {
            x: Math.cos(angleToShip) * speed,
            y: Math.sin(angleToShip) * speed
        };

        // 回転
        meteorContainer.rotationSpeed = Phaser.Math.FloatBetween(-2, 2);

        // タップ判定用の透明な大きい円を作成（クリック判定を広くする）
        const hitArea = this.add.circle(0, 0, size + 20, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        meteorContainer.add(hitArea);
        
        // タップで破壊できるように設定（判定エリアを広げた円に設定）
        this.addTapHandler(hitArea, () => {
            if (!this.isPlaying) return;
            
            this.destroyMeteor(meteorContainer);
        });

        // コンテナにサイズ情報を保存
        meteorContainer.meteorSize = size;
        this.meteors.push(meteorContainer);

        // 接近音
        SoundManager.play('push');
    }

    destroyMeteor(meteorContainer) {
        // 破壊エフェクト
        const x = meteorContainer.x;
        const y = meteorContainer.y;
        
        // 爆発エフェクト
        RetroEffects.createParticles(this, x, y, 'fail');
        
        // 破壊音
        SoundManager.play('correct');
        
        // 振動
        HapticManager.tap();
        
        // スコア更新
        this.destroyedCount++;
        this.scoreText.setText(`破壊: ${'★'.repeat(this.destroyedCount)}${'☆'.repeat(Math.max(0, this.clearCondition - this.destroyedCount))}`);
        
        // フィードバック表示
        this.showQuickFeedback('バシュー!', 0x00ffff, x, y);
        
        // 隕石を削除
        const index = this.meteors.indexOf(meteorContainer);
        if (index > -1) {
            this.meteors.splice(index, 1);
        }
        meteorContainer.destroy();

        // クリア判定
        if (this.destroyedCount >= this.clearCondition && this.isPlaying) {
            this.clearGame();
        }
    }

    update() {
        if (!this.isPlaying) return;

        // 隕石の移動と衝突判定
        // 配列を逆順で処理して、削除時のインデックスずれを防ぐ
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            if (!meteor || !meteor.active) continue;
            
            // 移動
            meteor.x += meteor.velocity.x * (this.game.loop.delta / 1000);
            meteor.y += meteor.velocity.y * (this.game.loop.delta / 1000);
            meteor.rotation += meteor.rotationSpeed * (this.game.loop.delta / 1000);

            // 宇宙船との衝突判定
            const distance = Phaser.Math.Distance.Between(
                meteor.x, meteor.y,
                this.spaceship.x, this.spaceship.y
            );

            if (distance < 40) {
                // 衝突！
                this.spaceshipHit();
                this.meteors.splice(i, 1);
                meteor.destroy();
                continue;
            }

            // 画面外に出た隕石を削除
            if (meteor.x < -50 || meteor.x > this.game.config.width + 50 ||
                meteor.y < -50 || meteor.y > this.game.config.height + 50) {
                this.meteors.splice(i, 1);
                meteor.destroy();
            }
        }
    }

    spaceshipHit() {
        // 被弾エフェクト
        RetroEffects.createParticles(this, this.spaceship.x, this.spaceship.y, 'fail');
        
        // 被弾音
        SoundManager.play('destroy');
        
        // 振動
        HapticManager.fail();
        
        // 宇宙船を赤く点滅（本体を取得）
        const bodyIndex = 3; // flame1, flame2, flame3, bodyの順なので、bodyは index 3
        const body = this.spaceship.list[bodyIndex];
        
        if (body) {
            this.tweens.add({
                targets: body,
                fillColor: { from: 0x00ff00, to: 0xff0000 },
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    // 元の色に戻す
                    body.setFillStyle(0x00ff00);
                }
            });
        }
        
        // 画面を揺らす
        this.cameras.main.shake(200, 0.01);
    }

    clearGame() {
        // 既に終了している場合は何もしない
        if (this.gameEnded) return;
        
        this.gameEnded = true;
        this.isPlaying = false;
        
        // タイマー停止
        if (this.meteorTimer) this.meteorTimer.remove();
        if (this.gameTimer) this.gameTimer.remove();

        // スコア計算
        const timeBonus = this.gameTime * 10;
        const score = this.destroyedCount * 100 + timeBonus;
        ScoreManager.addScore(score);
        
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

        // タイマー停止
        if (this.meteorTimer) this.meteorTimer.remove();
        if (this.gameTimer) this.gameTimer.remove();

        // 残った隕石を削除
        this.meteors.forEach(meteor => meteor.destroy());
        this.meteors = [];

        // 失敗判定
        const isSuccess = this.destroyedCount >= this.clearCondition;
        
        if (!isSuccess) {
            // 失敗音を一度だけ再生
            this.showFailEffect();
            
            // 失敗メッセージ
            const failText = this.add.text(
                this.game.config.width / 2,
                this.game.config.height / 2,
                '守れなかった...',
                {
                    fontSize: '32px',
                    color: '#ff0000',
                    fontFamily: UI_CONFIG.FONT.family
                }
            ).setOrigin(0.5);
            
            RetroEffects.bounceEffect(this, failText);
        }

        // スコア計算
        const score = this.destroyedCount * 100;
        ScoreManager.addScore(score);

        // 1.5秒後に画面遷移
        this.time.delayedCall(1500, () => {
            this.endGameAndTransition();
        });
    }
}

export default SpaceDebrisScene;