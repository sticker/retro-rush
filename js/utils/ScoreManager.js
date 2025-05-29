// スコア管理
class ScoreManager {
  static getGameState() {
    if (!window.gameState) {
      window.gameState = {
        totalScore: 0,
        currentGame: 0,
        gamesCompleted: 0,
        lives: 3,
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
    state.lives = 3;
  }

  static addScore(points) {
    const state = this.getGameState();
    state.totalScore += points;
  }

  static loseLife() {
    const state = this.getGameState();
    state.lives--;
  }

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