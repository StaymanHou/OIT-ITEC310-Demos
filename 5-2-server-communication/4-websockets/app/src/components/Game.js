import React from 'react';
import socketIOClient from "socket.io-client";
import { connect } from 'react-redux'
import { swapKeyValue } from '../utils/common';
import { selectCurrentPlayerId, selectCurrentPlayerIGN, setCurrentPlayerIGN } from '../redux/slices/currentPlayer'

const ENDPOINT = "http://127.0.0.1:4011";
// const ENDPOINT = "http://10.10.7.64:4001";
const CLIENT_VERSION = 1;
const API_VERSION = 1;

const mapStateToProps = (state) => ({ playerId: selectCurrentPlayerId(state), playerIGN: selectCurrentPlayerIGN(state) });
const mapDispatchToProps = { setCurrentPlayerIGN };

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playerId: props.playerId,
      playerIGN: props.playerIGN,
      ping: null,
      gameStatus: Game.Status.Waiting,
      gameMasterPlayerId: null,
      gameDifficulty: null,
      gameBook: null,
      gameMode: null,
      gameRoundCount: 10,
      gamePlayers: [],
      gameWinners: null,
      gameRounds: [],
      gameCurrentRoundIndex: null,
      gamePlayerScores: null,
      roundIndex: null,
      roundId: null,
      roundStatus: null,
      roundStartAt: null,
      roundStem: null,
      roundChoices: null,
      roundPlayerAnswers: null,
      roundTimeoutAt: null,
      roundAdditionalInfo: null,
      roundKeyIndex: null,
      localRoundCountDown: null,
      localRoundTimeoutAt: null,
      localRoundTimeoutIn: null,
      localChoicePicked: false,
      localPickedChoiceIndex: null,
    };

    this.timeoutTicker = null;
    this.handleStartGame = this.handleStartGame.bind(this);
    this.handleLeaveGame = this.handleLeaveGame.bind(this);
    this.handleDestroyGame = this.handleDestroyGame.bind(this);
  }

  get id() {
    return this.props.match.params.id;
  }

  get action() {
    return this.props.location.state?.action || 'join';
  }

  get newGameOptions() {
    return this.props.location.state?.newGameOptions || {};
  }

  componentDidMount() {
    this.socket = socketIOClient(ENDPOINT, {
      query: {
        clientVersion: CLIENT_VERSION,
        apiVersion: API_VERSION,
        gameId: this.id,
        playerId: this.state.playerId,
      },
      transports: ['websocket'],
      upgrade: false
    });
    this.socket.on('connect', () => {
      this.handleSocketReady();
    });
    this.socket.on('pong', latency => {
      this.handlePongResponse(latency);
    });
    this.socket.on('game.create.succeed', ({ state }) => {
      this.handleGameCreated(state);
    });
    this.socket.on('game.create.error', errorCode => {
      this.handleGameCreateError(errorCode);
    });
    this.socket.on('game.start.succeed', ({ state }) => {
      this.handleGameStarted(state);
    });
    this.socket.on('game.start.error', errorCode => {
      this.handleGameStartError(errorCode);
    });
    this.socket.on('game.end.succeed', ({ eventData, state }) => {
      this.handleGameEnded(eventData, state);
    });
    this.socket.on('game.end.error', errorCode => {
      this.handleGameEndError(errorCode);
    });
    this.socket.on('game.destroy.succeed', (reasonCode) => {
      this.handleGameDestroyed(reasonCode);
    });
    this.socket.on('game.destroy.error', errorCode => {
      this.handleGameDestroyError(errorCode);
    });
    this.socket.on('round.ready.succeed', ({ eventData, state }) => {
      this.handleRoundReadied(eventData, state);
    });
    this.socket.on('round.start.succeed', ({ eventData, state }) => {
      this.handleRoundStarted(eventData, state);
    });
    this.socket.on('round.pickChoice.succeed', ({ eventData, state }) => {
      this.handleChoicePicked(eventData, state);
    });
    this.socket.on('round.pickChoice.error', errorCode => {
      this.handlePickChoiceError(errorCode);
    });
    this.socket.on('round.end.succeed', ({ eventData, state }) => {
      this.handleRoundEnded(eventData, state);
    });
    this.socket.on('player.join.succeed', ({ eventData, state }) => {
      this.handlePlayerJoined(eventData, state);
    });
    this.socket.on('player.join.error', errorCode => {
      this.handlePlayerJoinError(errorCode);
    });
    this.socket.on('player.leave.succeed', ({ eventData, state }) => {
      this.handlePlayerLeft(eventData, state);
    });
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  handleSocketReady() {
    if (this.action === 'join') {
      while (!this.state.playerIGN) {
        let ign = prompt('Please enter your in game name:');
        if (!ign) { continue; }
        this.setState({ playerIGN: ign });
        this.props.setCurrentPlayerIGN(this.state.ign);
      }
      this.socket.emit('player.join', { ign: this.state.playerIGN });
      return;
    }
    if (this.action === 'create') {
      this.socket.emit('game.create', { gameId: this.id, gameOptions: this.newGameOptions });
    }
  }

  handlePongResponse(latency) {
    this.setState({ ping: latency }); // TODO implement RTT and clock sync
  }

  handleGameCreated(gameState) {
    this.updateGameState(gameState);
    this.socket.emit('player.join', { ign: this.state.playerIGN });
  }

  handleGameCreateError(errorCode) {
    if (errorCode === 409) {
      alert('Game already exist.');
    } else {
      alert('Unknown error occured. Failed to create game.');
    }
    this.props.history.replace('/');
  }

  handleGameStarted(gameState) {
    this.updateGameState(gameState);
  }

  handleGameStartError(errorCode) {
    if (errorCode === 403) {
      alert('You are not authorized to start the game.');
    } else {
      alert('Unknown error occured. Failed to start game.');
    }
  }

  handleGameEnded(eventData, gameState) {
    // TODO make sure the result of last game displays correctly
    this.updateGameState(gameState);
    let winnersIGN = eventData.winners.map(playerId => this.state.gamePlayers.find(player => player.id === playerId).ign);
    alert('winner(s): ' + winnersIGN);
  }

  handleGameEndedError(errorCode) {
    alert('Game ended for unknown reason.');
  }

  handleGameDestroyed(reasonCode) {
    if (reasonCode === 200) {
      if (this.state.gameMasterPlayerId === this.state.playerId) { return; }
      alert('The host has ended the game.');
    } else if (reasonCode === 408) {
      alert('The game has expired.');
    } else {
      alert('Game terminated for unknown reason.');
    }
    this.props.history.replace('/');
  }

  handleGameDestroyError(errorCode) {
    if (errorCode === 403) {
      alert('You are not authorized to destroy the game.');
    } else {
      alert('Unknown error occured. Failed to destroy game.');
    }
  }

  handleStartGame(event) {
    // TODO make sure restart works. probably implement some sort of reset
    event.preventDefault();
    this.setState({ gameStatus: Game.Status.Starting });
    setTimeout(() => {
      this.socket.emit('game.start');
    }, 1000);
  }

  handleLeaveGame(event) {
    event.preventDefault();
    this.socket.emit('player.leave');
    this.props.history.replace('/');
  }

  handleDestroyGame(event) {
    event.preventDefault();
    this.socket.emit('game.destroy');
    this.props.history.replace('/');
  }

  updateGameState(gameState) {
    this.setState({
      gameMasterPlayerId: gameState.masterPlayerId,
      gameDifficulty: gameState.difficulty,
      gameBook: gameState.book,
      gameMode: gameState.mode,
      gameRoundCount: gameState.roundCount,
      gameStatus: gameState.status,
      gamePlayers: gameState.players,
      gameWinners: gameState.winners,
      gameRounds: gameState.rounds,
      gamePlayerScores: gameState.playerScores,
    });
  }

  handleRoundReadied(eventData, roundState) {
    this.setState({ gameCurrentRoundIndex: eventData.roundIndex, localRoundCountDown: eventData.startIn, localChoicePicked: false, localPickedChoiceIndex: null });
    for (let i = 1000; i <= eventData.startIn; i+=1000) {
      ((timeElapsed) => {
        setTimeout(() => {
          // TODO display count down animation
          this.setState({ localRoundCountDown: eventData.startIn - timeElapsed });
        }, timeElapsed);
      })(i);
    }
    this.updateRoundState(roundState);
  }

  handleRoundStarted(eventData, roundState) {
    this.setState({ localRoundTimeoutAt: Date.now() + eventData.timeoutIn, localRoundTimeoutIn: eventData.timeoutIn });
    this.updateRoundState(roundState);
    this.timeoutTicker = setInterval(() => {
      if (this.state.localRoundTimeoutIn <= 0 && this.timeoutTicker && eventData.roundIndex === this.state.gameCurrentRoundIndex) {
        clearInterval(this.timeoutTicker);
        this.timeoutTicker = null;
      }
      this.setState((state) => {
        state.localRoundTimeoutIn = Math.max(0, state.localRoundTimeoutAt - Date.now());
        return state;
      });
    }, 333);
  }

  handleChoicePicked(eventData, roundState) {
    this.updateRoundState(roundState);
  }

  handlePickChoiceError(errorCode) {
    if (errorCode === 408) {
      alert('You have already picked an answer.');
    } else {
      alert('Unknown error occured. Failed to submit your answer.');
    }
  }

  handleRoundEnded(eventData, state) {
    if (this.timeoutTicker) {
      clearInterval(this.timeoutTicker);
      this.timeoutTicker = null;
    }
    this.updateRoundState(state.roundState);
    this.updateGameState(state.gameState);
    if (eventData.reasonCode === 408 && !this.state.localChoicePicked) {
      alert("Oops. Timeout! Yet you haven't pick an answer.");
    }
  }

  handlePickChoice(event, index) {
    event.preventDefault();
    setTimeout(() => {
      this.socket.emit('round.pickChoice', { choiceIndex: index });
    }, 0);
    this.setState({ localChoicePicked: true, localPickedChoiceIndex: index });
  }

  updateRoundState(roundState) {
    this.setState({
      roundIndex: roundState.index,
      roundId: roundState.id,
      roundStatus: roundState.status,
      roundStartAt: roundState.startAt,
      roundStem: roundState.stem,
      roundChoices: roundState.choices,
      roundPlayerAnswers: roundState.playerAnswers,
      roundTimeoutAt: roundState.timeoutAt,
      roundAdditionalInfo: roundState.additionalInfo,
      roundKeyIndex: roundState.keyIndex,
    });
  }

  handlePlayerJoined(eventData, gameState) {
    this.updateGameState(gameState);
    if (eventData.id === this.state.playerId) { return; }
    console.log('player joined: ', eventData.id, eventData.ign); // TODO show stackable notification / snackbar for players joined other than yourself
  }

  handlePlayerJoinError(errorCode) {
    if (errorCode === 404) {
      alert('Game does not exist.');
    } else if (errorCode === 409) {
      alert('Player ID / name already taken. Try another one.');
    } else {
      alert('Unknown error occured. Failed to join game.');
    }
    this.props.history.replace('/');
  }

  handlePlayerLeft(eventData, gameState) {
    this.updateGameState(gameState);
    if (eventData.id === this.state.playerId) { return; }
    console.log('player left: ', eventData.id, eventData.ign); // TODO show stackable notification / snackbar for players left other than yourself
  }

  render() {
    return <div className="Game">
      <h1>Game Room #{this.id}</h1>
      <h3>Game Status: {Game.StatusToText[this.state.gameStatus]}</h3>
      <p>ping: {this.state.ping === null ? '?' : <span>{this.state.ping}ms</span> }</p>
      <p>Your are: {this.props.playerIGN} <span style={{ color: 'grey' }}>(#{this.props.playerId})</span></p>
      <div>
        players:
        <ul>
          {this.state.gamePlayers.map((player) =>
            <li key={player.id}>
              {player.ign} (score: {(this.state.gamePlayerScores || {})[player.id] || 0})
              {[Round.Status.Started, Round.Status.TimedOut].includes(this.state.roundStatus) && this.state.roundPlayerAnswers[player.id] &&
                <span style={{ color: 'darkgrey' }}>■</span>
              }
              {this.state.roundStatus === Round.Status.Ended && this.state.roundPlayerAnswers[player.id] && <span style={{ color: this.state.roundPlayerAnswers[player.id].choiceIndex === this.state.roundKeyIndex ? 'green' : 'red' }}>■</span>}
            </li>
          )}
        </ul>
      </div>
      {this.state.gameStatus === Game.Status.Ended &&
        <div>
          winner(s):
          <ul>
            {this.state.gameWinners.map((playerId) =>
              <li key={playerId}>{this.state.gamePlayers.find(player => player.id === playerId).ign} (score: {(this.state.gamePlayerScores || {})[playerId] || 0})</li>
            )}
          </ul>
        </div>
      }
      {this.state.gameStatus === Game.Status.Started && this.state.gameCurrentRoundIndex != null && this.state.roundIndex != null &&
        <div>
          <h1>Round #{this.state.roundIndex+1}</h1>
          <h3>Round Status: {Round.StatusToText[this.state.roundStatus]}</h3>
          {this.state.roundStatus === Round.Status.CountingDown &&
            <p>start in: <span style={{ color: 'red', fontWeight: 'bold' }}>{this.state.localRoundCountDown / 1000}</span></p>
          }
          {this.state.roundStatus === Round.Status.Started &&
            <p>timeout in: <span style={{ color: 'red', fontWeight: 'bold' }}>{Math.floor(this.state.localRoundTimeoutIn / 1000)}</span></p>
          }
          {[Round.Status.Started, Round.Status.TimedOut, Round.Status.Ended].includes(this.state.roundStatus) &&
            <div>
              <h2>{this.state.roundStem}</h2>
              {this.state.roundStatus === Round.Status.Ended &&
                <p>The answer is <span style={{ color: 'green', fontWeight: 'bold' }}>{this.state.roundChoices[this.state.roundKeyIndex]}</span>. Find the answer in {this.state.roundAdditionalInfo}</p>
              }
              <div>
                {this.state.roundChoices.map((choice, index) =>
                  <button key={index} onClick={e => this.handlePickChoice(e, index)} disabled={this.state.localChoicePicked} style={{ backgroundColor: this.state.localPickedChoiceIndex === index ? (this.state.roundStatus === Round.Status.Ended ? (this.state.localPickedChoiceIndex === this.state.roundKeyIndex ? 'green' : 'red') : 'darkgrey') : null }}>{choice}</button>
                )}
              </div>
            </div>
          }
        </div>
      }
      {this.state.gameMasterPlayerId === this.state.playerId && this.state.gameStatus === Game.Status.Waiting &&
        <button onClick={this.handleStartGame}>Start Game</button>
      }
      {this.state.gameMasterPlayerId === this.state.playerId && this.state.gameStatus === Game.Status.Ended &&
        <button onClick={this.handleStartGame}>Start Another Game</button>
      }
      {this.state.gameMasterPlayerId !== this.state.playerId && [Game.Status.Waiting, Game.Status.Ended].includes(this.state.gameStatus) &&
        <button disabled>Waiting for Host to Start Game</button>
      }
      {this.state.gameMasterPlayerId === this.state.playerId && this.state.gameStatus === Game.Status.Starting &&
        <button disabled>Starting Game...</button>
      }
      <button onClick={this.handleLeaveGame}>Leave Game</button>
      {this.state.gameMasterPlayerId === this.state.playerId &&
        <button onClick={this.handleDestroyGame}>End Game</button>
      }
    </div>;
  }
}

// Make sure these constants are exactly the same in backend
Game.Status = Object.freeze({
  Waiting: 0,
  Starting: 10,
  Started: 20,
  Ending: 30,
  Ended: 40,
  Destroying: 50,
  Destroyed: 60,
});
Game.StatusToText = swapKeyValue(Game.Status);
Game.Difficulty = Object.freeze({
  All: 0,
});
Game.Book = Object.freeze({
  All: 0,
});
Game.Mode = Object.freeze({
  Classic: 0,
});

const Round = {};
Round.Status = Object.freeze({
  Pending: 100,
  CountingDown: 110,
  Started: 120,
  TimedOut: 130,
  Ended: 140,
});
Round.StatusToText = swapKeyValue(Round.Status);

export default connect(mapStateToProps, mapDispatchToProps)(Game);
