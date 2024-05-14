const { shuffle, objectMap } = require('../utils/common');

const DefaultRoundCountDown = 3 * 1000;
const DefaultRoundTTL = 30 * 1000;

class Round {
  constructor(game, index, options, callbacks) {
    this._game = game;
    this.index = index;
    this.id = options.id;
    this.stem = options.stem;
    this._alternatives = options.alternatives;
    this._key = options.key;
    this.additionalInfo = options.additionalInfo;
    this._callbacks = callbacks || {};
    this.status = Round.Status.Pending;
    this.choices = shuffle(this._alternatives.concat([this._key]));
    this.keyIndex = this.choices.indexOf(this._key);
    this.playerAnswers = {};
    this.startAt = null;
    this.timeoutAt = null;
    this._timeoutTimer = null;
  }

  _scheduleTimeout() {
    if (this._timeoutTimer) { clearTimeout(this._timeoutTimer); }
    this._timeoutTimer = setTimeout(() => { this._timeout() }, DefaultRoundTTL );
  }

  _deactivateSelfDestruction() {
    if (this._timeoutTimer) { clearTimeout(this._timeoutTimer); }
  }

  _timeout() {
    this._timeoutTimer = null;
    this._end();
  }

  toJSON() {
    let json = {
      index: this.index,
      id: this.id,
      status: this.status,
    };
    if (this.status === Round.Status.Pending) { return json; }
    json.startAt = this.startAt;
    if (this.status === Round.Status.CountingDown) { return json; }
    json.stem = this.stem;
    json.choices = this.choices;
    json.playerAnswers = objectMap(this.playerAnswers, (value) => true);
    json.timeoutAt = this.timeoutAt;
    if (this.status === Round.Status.Started) { return json; }
    json.additionalInfo = this.additionalInfo;
    json.keyIndex = this.keyIndex;
    json.playerAnswers = this.playerAnswers;
    return json;
  }

  getPlayerScore(playerId) {
    return this.playerAnswers[playerId] && this.playerAnswers[playerId].choiceIndex === this.keyIndex ? 100 : 0;
  }

  countDownStart() {
    this.status = Round.Status.CountingDown;
    this.startAt = Date.now() + DefaultRoundCountDown;
    if (this._callbacks.afterCountDownStart) {
      setTimeout(() => {
        this._callbacks.afterCountDownStart(DefaultRoundCountDown);
      }, 0);
    }
    setTimeout(() => {
      this._start();
    }, DefaultRoundCountDown);
  }

  pickChoice(playerId, choiceIndex) {
    if (playerId in this.playerAnswers) { return 409; }
    this.playerAnswers[playerId] = { choiceIndex: choiceIndex, ts: Date.now() };
    this.endIfShould();
  }

  endIfShould() {
    if (this._shouldEnd()) { this._end(); }
  }

  _shouldEnd() {
    return this._game.players.every(player => player.id in this.playerAnswers);
  }

  _start() {
    this.status = Round.Status.Started;
    this.timeoutAt = Date.now() + DefaultRoundTTL;
    if (this._callbacks.afterStart) {
      setTimeout(() => {
        this._callbacks.afterStart(DefaultRoundTTL);
      }, 0);
    }
    this._timeoutTimer = setTimeout(() => {
      this._end({ code: 408 });
    }, DefaultRoundTTL);
  }

  _end({ code } = {}) {
    this.status = Round.Status.Ended;
    if (this._callbacks.afterEnd) {
      setTimeout(() => {
        this._callbacks.afterEnd(code || 200);
      }, 0);
    }
    if (this._timeoutTimer) {
      clearTimeout(this._timeoutTimer);
      this._timeoutTimer = null;
    }
  }
}

// Make sure these constants are exactly the same in frontend
Round.Event = Object.freeze({
  AfterCountDownStart: 111,
  AfterStart: 121,
  AfterEnd: 141,
});
Round.Status = Object.freeze({
  Pending: 100,
  CountingDown: 110,
  Started: 120,
  TimedOut: 130,
  Ended: 140,
});

module.exports = Round;
