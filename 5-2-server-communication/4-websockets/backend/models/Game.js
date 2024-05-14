const SortedArrayMap = require("collections/sorted-array-map");
const { swapKeyValue } = require('../utils/common');
const Round = require('./Round');
const Player = require('./Player');

const DefaultGameTTL = 900 * 1000; // 15 min refreshed on any activity
const DefaultRoundStartDelay = 3000;

class Game {
  constructor(id, masterPlayerId, gameOptions) {
    this.id = id;
    this.difficulty = gameOptions && gameOptions.difficulty || Game.Difficulty.All;
    this.book = gameOptions && gameOptions.book || Game.Book.All;
    this.mode = gameOptions && gameOptions.mode || Game.Mode.Classic;
    this.roundCount = gameOptions && gameOptions.roundCount || 10;
    this.masterPlayerId = masterPlayerId;
    this._players = new SortedArrayMap({}, Player.equals, Player.compare);
    this.rounds = null;
    this.currentRoundIndex = null;
    this.status = Game.Status.Waiting;
    this.createdAt = Date.now();
    this.expireAt = this.createdAt + DefaultGameTTL;
    this._eventCallbacks = {};
    this._selfDestructionTimer = null;
    this._scheduleSelfDestruction();
    Game.games[id] = this;
  }

  static find(id) {
    return Game.games[id];
  }

  get players() {
    return Array.from(this._players.values());
  }

  get playerScores() {
    let players = this.players;
    if (players.length <= 0) { return {}; }
    let playerScores = {};
    for (let i = players.length - 1; i >= 0; i--) {
      ((player) => {
        playerScores[player.id] = (this.rounds || []).map(round => round.getPlayerScore(player.id)).reduce((a, b) =>{ return a + b; }, 0);
      })(players[i]);
    }
    return playerScores;
  }

  // return an array of one or more winners if it's a tie
  get winners() {
    if (!this.rounds) { return null; }
    let players = this.players;
    if (players.length <= 0) { return []; }
    let playerScores = this.playerScores;
    let maxScore = Math.max(...Object.values(playerScores));
    return Object.keys(playerScores).filter(playerId => playerScores[playerId] === maxScore);
  }

  get currentRound() {
    if (this.currentRoundIndex === null) { return null; }
    if (!this.rounds) { return null; }
    return this.rounds[this.currentRoundIndex];
  }

  _scheduleSelfDestruction() {
    if (this._selfDestructionTimer) { clearTimeout(this._selfDestructionTimer); }
    this._selfDestructionTimer = setTimeout(() => { this._selfDestruct() }, DefaultGameTTL );
  }

  _deactivateSelfDestruction() {
    if (this._selfDestructionTimer) { clearTimeout(this._selfDestructionTimer); }
  }

  _selfDestruct() {
    if (Date.now() < this.expireAt) {
      this._scheduleSelfDestruction();
      return;
    }
    this._selfDestructionTimer = null;
    this.destroy({ code: 408 });
  }

  _triggerEventListeners(event, data) {
    let callbacks = this._eventCallbacks[event];
    if (callbacks) {
      for (let i = callbacks.length - 1; i >= 0; i--) {
        ((callback) => {
          if (!callback) { return; }
          if (!data) {
            setTimeout(callback, 0);
            return
          }
          setTimeout(() => { callback(data) }, 0);
        })(callbacks[i]);
      } 
    }
  }

  toJSON() {
    // TODO should render ALL public data and ONLY public data
    let json = {
      id: this.id,
      masterPlayerId: this.masterPlayerId,
      difficulty: this.difficulty,
      book: this.book,
      mode: this.mode,
      roundCount: this.roundCount,
      players: this.players.map((player) => player.toJSON()),
      rounds: this.rounds && this.rounds.map((round) => round.toJSON()),
      status: this.status,
      currentRoundIndex: this.currentRoundIndex,
    };
    if ([Game.Status.Waiting, Game.Status.Starting, Game.Status.Destroying, Game.Status.Destroyed].includes(this.status)) { return json; }
    if ([Game.Status.Started, Game.Status.Ending].includes(this.status)) {
      json.playerScores = this.playerScores;
      return json;
    }
    json.winners = this.winners;
    return json;
  }

  addEventListener(event, callback) {
    if (!this._eventCallbacks[event]) { this._eventCallbacks[event] = []; }
    this._eventCallbacks[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (!this._eventCallbacks[event]) { return; }
    let index = this._eventCallbacks[event].indexOf(callback);
    if (index !== -1) {
      this._eventCallbacks[event].splice(index, 1);
    }
  }

  addPlayer(player) {
    if (this._players.has(player.id)) {
      return false;
    }
    if (this._players.some((anotherPlayer) => Player.equals(player, anotherPlayer))) {
      return false;
    }
    this._players.add(player, player.id);
    return true;
  }

  removePlayer(player) {
    if (!this._players.has(player.id)) {
      return false;
    }
    this._players.delete(player.id);
    this.currentRound && this.currentRound.endIfShould();
    return true;
  }

  canStartBy(playerId) {
    return this.masterPlayerId === playerId;
  }

  start() {
    this.status = Game.Status.Starting;
    this._generateRounds();
    this.status = Game.Status.Started;
    console.log('game #', this.id, 'started');
    this._nextRoundOrEndWithDelay();
  }

  _generateRounds() {
    // TODO replace the round generation by fetching actual bible quiz from probably a database
    this.rounds = [];
    for (let i = 0; i < this.roundCount; i++) {
      let a = Math.floor(Math.random() * 10) + 1;
      let b = Math.floor(Math.random() * 10) + 1;
      let key = a + b;
      let alternatives = [];
      while(alternatives.length < 3) {
        let alternative = Math.floor(Math.random() * 20) + 1;
        if (alternative === key) { continue; }
        if (alternatives.includes(alternative)) { continue; }
        alternatives.push(alternative);
      }
      this.rounds.push(new Round(this, i, {
        id: 1000+i,
        stem: '' + a + ' + ' + b + ' = ?',
        alternatives: alternatives,
        key: key,
        additionalInfo: 'Gen Ch.' + key + ' V.' + a,
      }, {
        afterCountDownStart: (startIn) => {
          this._triggerEventListeners(Round.Event.AfterCountDownStart, startIn);
        },
        afterStart: (timeoutIn) => {
          this._triggerEventListeners(Round.Event.AfterStart, timeoutIn);
        },
        afterEnd: (reasonCode) => {
          this._triggerEventListeners(Round.Event.AfterEnd, reasonCode);
          this._nextRoundOrEndWithDelay();
        },
      }));
    }
  }

  _nextRoundOrEndWithDelay() {
    setTimeout(() => {
      this._nextRoundOrEnd();
    }, DefaultRoundStartDelay);
  }

  _nextRoundOrEnd() {
    if (this.currentRoundIndex === null) { this.currentRoundIndex = -1; }
    if (this.currentRoundIndex + 1 >= this.rounds.length) {
      this._end();
      return;
    }
    this.currentRoundIndex += 1;
    this.rounds[this.currentRoundIndex].countDownStart();
  }

  _end() {
    this.status = Game.Status.Ended;
    this._triggerEventListeners(Game.Event.AfterEnd);
  }

  destroyIfShould() {
    if (this.shouldDestroy()) { this.destroy(); }
  }

  shouldDestroy() {
    if (this.players.length > 0 ) { return false; }
    return true;
  }

  canDestroyBy(playerId) {
    return this.masterPlayerId === playerId;
  }

  destroy({ code } = {}) {
    this._triggerEventListeners(Game.Event.BeforeDestroy, code || 200);
    this._deactivateSelfDestruction();
    this.status = Game.Status.Destroyed;
    delete Game.games[this.id];
    console.log('game #', this.id, 'deleted');
  }
}
Game.games = {};

// Make sure these constants are exactly the same in frontend
Game.Event = Object.freeze({
  AfterEnd: 41,
  BeforeDestroy: 59,
});
Game.Status = Object.freeze({
  Waiting: 0,
  Starting: 10,
  Started: 20,
  Ending: 30,
  Ended: 40,
  Destroying: 50,
  Destroyed: 60,
});
Game.Difficulty = Object.freeze({
  All: 0,
});
Game.Book = Object.freeze({
  All: 0,
});
Game.Mode = Object.freeze({
  Classic: 0,
});

module.exports = Game;
