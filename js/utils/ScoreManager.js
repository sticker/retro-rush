// スコア管理
class ScoreManager {
  static getGameState() {
    if (!window.gameState) {
      window.gameState = {
        totalScore: 0,
        currentGame: 0,
        gamesCompleted: 0,
        gameSequence: [],
        highScore: localStorage.getItem('retroRushHighScore') || 0
      };
    }
    return window.gameState;
  }

  static resetGameState() {
    const state = this.getGameState();
    state.totalScore = 0;
    state.currentGame = 0;
    state.gamesCompleted = 0;
    state.gameSequence = this.generateGameSequence();
  }

  static generateGameSequence() {
    const allGames = [
      'MoleWhackScene',
      'RhythmJumpScene', 
      'ColorMatchScene',
      'MissileDefenseScene',
      'BalanceTowerScene',
      'NumberChainScene'
    ];
    
    // 6つのゲームから5つをランダムに選択
    const sequence = [];
    const availableGames = [...allGames];
    
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * availableGames.length);
      sequence.push(availableGames.splice(randomIndex, 1)[0]);
    }
    
    return sequence;
  }

  static getCurrentGameScene() {
    const state = this.getGameState();
    if (state.currentGame < state.gameSequence.length) {
      return state.gameSequence[state.currentGame];
    }
    return null;
  }

  static hasMoreGames() {
    const state = this.getGameState();
    return state.currentGame < state.gameSequence.length;
  }

  static addScore(points) {
    const state = this.getGameState();
    state.totalScore += points;
  }

  // ライフ概念を削除（連続プレイなので不要）

  static incrementGame() {
    const state = this.getGameState();
    state.currentGame++;
  }

  static completeGame() {
    const state = this.getGameState();
    state.gamesCompleted++;
  }

  static updateHighScore() {
    const state = this.getGameState();
    if (state.totalScore > state.highScore) {
      state.highScore = state.totalScore;
      localStorage.setItem('retroRushHighScore', state.highScore);
      return true;
    }
    return false;
  }
}

export default ScoreManager;