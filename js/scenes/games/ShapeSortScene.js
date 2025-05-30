import BaseGameScene from '../BaseGameScene.js';
import ScoreManager from '../../utils/ScoreManager.js';
import UI_CONFIG from '../../utils/UI_CONFIG.js';
import RetroEffects from '../../utils/RetroEffects.js';
import HapticManager from '../../utils/HapticManager.js';
import SoundManager from '../../utils/SoundManager.js';

// シェイプソート - 形を見極めて振り分けよ！
class ShapeSortScene extends BaseGameScene {
    constructor() {
        super({ key: 'ShapeSortScene' });
        this.gameTime = 9; // ゲーム時間（秒）
        this.clearCondition = 4; // クリア条件（成功数）
        this.successCount = 0; // 成功数
        this.isPlaying = false;
        this.currentShape = null; // 現在のシェイプ
        this.shapes = ['circle', 'square', 'triangle', 'diamond']; // 形の種類
        this.shapeQueue = []; // 次に出現する形のキュー
        this.bins = {}; // 振り分け先のビン
        this.isDragging = false;
        this.gameEnded = false; // ゲーム終了フラグ
    }

    create() {
        // ゲーム状態をリセット
        this.gameTime = 8;
        this.successCount = 0;
        this.isPlaying = false;
        this.currentShape = null;
        this.shapeQueue = [];
        this.bins = {};
        this.isDragging = false;
        this.gameEnded = false;
        
        // 背景
        this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            0x2a2a2a
        );

        // タイトル
        this.add.text(this.game.config.width / 2, 40, 'シェイプソート', {
            fontSize: '24px',
            color: '#00ffff',
            fontFamily: UI_CONFIG.FONT.family
        }).setOrigin(0.5);

        // スコア表示
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

        // 振り分け先のビンを作成
        this.createBins();

        // 操作説明
        this.instructionText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 3,
            '← スワイプで移動',
            {
                fontSize: '18px',
                color: '#ffff00',
                fontFamily: UI_CONFIG.FONT.family
            }
        ).setOrigin(0.5);

        // 指示テキスト
        this.bottomText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height - 40,
            '形を見極めて振分け！',
            {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: UI_CONFIG.FONT.family
            }
        ).setOrigin(0.5);

        // スワイプハンドラーを設定
        this.setupSwipeControl();

        // カウントダウン開始
        this.createCountdown(() => {
            this.startGame();
        });
    }

    createBins() {
        const binY = this.game.config.height * 0.65;
        const binSpacing = this.game.config.width / 5;
        const binLabels = ['丸', '四角', '三角', '菱形'];
        const binColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf];

        this.shapes.forEach((shape, index) => {
            const x = binSpacing * (index + 1);
            
            // ビンの容器
            const bin = this.add.container(x, binY);
            
            // ビンの背景
            const binBg = this.add.rectangle(0, 0, 60, 80, binColors[index], 0.3);
            binBg.setStrokeStyle(3, binColors[index]);
            
            // ビンのアイコン
            let icon;
            switch (shape) {
                case 'circle':
                    icon = this.add.circle(0, -20, 15, binColors[index]);
                    break;
                case 'square':
                    icon = this.add.rectangle(0, -20, 30, 30, binColors[index]);
                    break;
                case 'triangle':
                    icon = this.add.triangle(0, -20, -15, 10, 15, 10, 0, -10, binColors[index]);
                    break;
                case 'diamond':
                    icon = this.add.polygon(0, -20, [0, -15, 15, 0, 0, 15, -15, 0], binColors[index]);
                    break;
            }
            icon.setStrokeStyle(2, 0xffffff);
            
            // ラベル
            const label = this.add.text(0, 25, binLabels[index], {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: UI_CONFIG.FONT.family
            }).setOrigin(0.5);
            
            bin.add([binBg, icon, label]);
            
            // ビンの位置と範囲を保存
            this.bins[shape] = {
                container: bin,
                x: x,
                y: binY,
                width: 60,
                height: 80,
                color: binColors[index]
            };
        });
    }


    setupSwipeControl() {
        // スワイプハンドラーを追加
        this.addSwipeHandler({
            onSwipeStart: (x, y) => {
                if (!this.isPlaying || !this.currentShape) return;
                
                // シェイプの位置とタップ位置を確認（シンプルな距離判定）
                const shape = this.currentShape;
                const distance = Phaser.Math.Distance.Between(x, y, shape.x, shape.y);
                
                // シェイプの中心から60ピクセル以内なら操作開始
                if (distance < 60) {
                    this.isDragging = true;
                    shape.startX = shape.x;
                    shape.startY = shape.y;
                    // ドラッグ開始時のオフセットを記録
                    this.dragOffsetX = shape.x - x;
                }
            },
            onSwipeMove: (x, y, deltaX, deltaY) => {
                if (!this.isDragging || !this.currentShape) return;
                
                // シェイプを移動（横方向のみ、オフセットを考慮）
                this.currentShape.x = Phaser.Math.Clamp(
                    x + this.dragOffsetX,
                    40,
                    this.game.config.width - 40
                );
            },
            onSwipeEnd: (x, y) => {
                if (!this.isDragging || !this.currentShape) return;
                
                this.isDragging = false;
                this.checkShapePlacement();
            },
            threshold: 5  // スワイプ判定の閾値を小さくして感度を上げる
        });
    }

    startGame() {
        this.isPlaying = true;
        this.instructionText.destroy();
        
        // 最初のシェイプを生成
        this.spawnNextShape();

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

    spawnNextShape() {
        if (!this.isPlaying || this.currentShape) return;
        
        // ランダムな形を生成
        const shapeType = this.shapes[Phaser.Math.Between(0, this.shapes.length - 1)];
        
        // シェイプを生成
        const x = this.game.config.width / 2;
        const y = this.game.config.height * 0.35;
        
        this.currentShape = this.add.container(x, y);
        this.currentShape.shapeType = shapeType;
        
        // ランダムな色
        const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xffd93d, 0x6bcb77];
        const color = colors[Phaser.Math.Between(0, colors.length - 1)];
        
        let shape;
        switch (shapeType) {
            case 'circle':
                shape = this.add.circle(0, 0, 25, color);
                break;
            case 'square':
                shape = this.add.rectangle(0, 0, 50, 50, color);
                break;
            case 'triangle':
                shape = this.add.triangle(0, 0, -25, 20, 25, 20, 0, -20, color);
                break;
            case 'diamond':
                shape = this.add.polygon(0, 0, [0, -25, 25, 0, 0, 25, -25, 0], color);
                break;
        }
        
        shape.setStrokeStyle(3, 0xffffff);
        this.currentShape.add(shape);
        
        // コンテナのサイズを設定（タッチ判定用）
        this.currentShape.setSize(80, 80);
        this.currentShape.setInteractive();
        
        // 落下アニメーション（短縮）
        this.tweens.add({
            targets: this.currentShape,
            y: y + 10,
            duration: 50,
            yoyo: true,
            ease: 'Bounce.easeOut'
        });
        
        // 出現音
        // SoundManager.play('jump');
    }

    checkShapePlacement() {
        if (!this.currentShape) return;
        
        const shapeX = this.currentShape.x;
        const shapeType = this.currentShape.shapeType;
        let correctBin = null;
        let isCorrect = false;
        
        // どのビンに入ったかチェック
        for (const [binType, bin] of Object.entries(this.bins)) {
            const binLeft = bin.x - bin.width / 2;
            const binRight = bin.x + bin.width / 2;
            
            if (shapeX >= binLeft && shapeX <= binRight) {
                correctBin = bin;
                isCorrect = (binType === shapeType);
                break;
            }
        }
        
        if (correctBin) {
            // ビンに入った
            if (isCorrect) {
                // 正解！
                this.handleCorrectPlacement(correctBin);
            } else {
                // 不正解
                this.handleIncorrectPlacement();
            }
        } else {
            // どこにも入らなかった - 元の位置に戻す
            this.tweens.add({
                targets: this.currentShape,
                x: this.game.config.width / 2,
                duration: 300,
                ease: 'Back.easeOut'
            });
        }
    }

    handleCorrectPlacement(bin) {
        // 成功エフェクト
        const shape = this.currentShape;
        
        // ビンに吸い込まれるアニメーション
        this.tweens.add({
            targets: shape,
            x: bin.x,
            y: bin.y,
            scale: 0,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                shape.destroy();
            }
        });
        
        // エフェクト
        RetroEffects.createParticles(this, bin.x, bin.y, 'success');
        this.showQuickFeedback('ポン！', bin.color, bin.x, bin.y - 40);
        
        // 音と振動
        SoundManager.play('correct');
        HapticManager.success();
        
        // スコア更新
        this.successCount++;
        this.scoreText.setText(`成功: ${'★'.repeat(this.successCount)}${'☆'.repeat(Math.max(0, this.clearCondition - this.successCount))}`);
        ScoreManager.addScore(100);
        
        // ビンを光らせる
        const flash = this.add.rectangle(bin.x, bin.y, bin.width, bin.height, bin.color, 0.5);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.2,
            duration: 300,
            onComplete: () => flash.destroy()
        });
        
        this.currentShape = null;
        
        // クリア判定
        if (this.successCount >= this.clearCondition) {
            this.clearGame();
        } else {
            // 次のシェイプ（少し遅延して生成）
            this.time.delayedCall(400, () => {
                if (this.isPlaying) {
                    this.spawnNextShape();
                }
            });
        }
    }

    handleIncorrectPlacement() {
        // 失敗エフェクト
        const shape = this.currentShape;
        
        // 赤く点滅して元に戻る
        const originalColor = shape.list[0].fillColor;
        
        this.tweens.add({
            targets: shape.list[0],
            fillColor: { from: originalColor, to: 0xff0000 },
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                shape.list[0].setFillStyle(originalColor);
            }
        });
        
        // 元の位置に戻る
        this.tweens.add({
            targets: shape,
            x: this.game.config.width / 2,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // エフェクト
        this.showQuickFeedback('ブブッ！', 0xff0000, shape.x, shape.y);
        
        // 音と振動
        SoundManager.play('beep');
        HapticManager.fail();
        
        // 画面を揺らす
        this.cameras.main.shake(200, 0.005);
    }

    clearGame() {
        // 既に終了している場合は何もしない
        if (this.gameEnded) return;
        
        this.gameEnded = true;
        this.isPlaying = false;
        
        // タイマー停止
        if (this.gameTimer) this.gameTimer.remove();

        // 現在のシェイプを削除
        if (this.currentShape) {
            this.currentShape.destroy();
            this.currentShape = null;
        }

        // スコア計算
        const timeBonus = this.gameTime * 15;
        const totalScore = (this.successCount * 100) + timeBonus;
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

        // タイマー停止
        if (this.gameTimer) this.gameTimer.remove();

        // 現在のシェイプを削除
        if (this.currentShape) {
            this.currentShape.destroy();
            this.currentShape = null;
        }

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
        const score = this.successCount * 80;
        ScoreManager.addScore(score);

        // 1.5秒後に画面遷移
        this.time.delayedCall(1500, () => {
            this.endGameAndTransition();
        });
    }
}

export default ShapeSortScene;