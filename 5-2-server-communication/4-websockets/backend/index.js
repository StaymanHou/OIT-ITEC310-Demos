const Game = require('./models/Game');
const Round = require('./models/Round');
const Player = require('./models/Player');

const server = require('http').createServer();

const io = require("socket.io")(server, {
  pingInterval: 3000,
});

server.listen(process.env.PORT || 4011);

io.on("connection", function(socket) {
  console.log("user connected");
  const clientVersion = socket.handshake.query.clientVersion;
  const apiVersion = socket.handshake.query.apiVersion;
  const gameId = socket.handshake.query.gameId;
  const playerId = socket.handshake.query.playerId;
  socket.join(gameId);
  let game = null;
  let player = null;

  // handlers for game master socket only

  let handleGameEnd = () => {
    io.in(gameId).emit('game.end.succeed', { eventData: { winners: game.winners }, state: game.toJSON() });
    console.log('game ended: ', gameId);
  };

  let handleRoundCountDown = (startIn) => { // startIn ms
    io.in(gameId).emit('round.ready.succeed', { eventData: { startIn: startIn, roundIndex: game.currentRoundIndex }, state: game.currentRound.toJSON() });
    console.log('round count down started: start in ', startIn, 'ms');
  };

  let handleRoundStart = (timeoutIn) => { // timeoutIn ms
    io.in(gameId).emit('round.start.succeed', { eventData: { timeoutIn: timeoutIn, roundIndex: game.currentRoundIndex }, state: game.currentRound.toJSON() });
    console.log('round started. timeout in ', timeoutIn, 'ms');
  };

  let handleRoundEnd = (reasonCode) => {
    io.in(gameId).emit('round.end.succeed', { eventData: { reasonCode: reasonCode }, state: { roundState: game.currentRound.toJSON(), gameState: game.toJSON() } });
    console.log('round ended');
  };

  let registerGMListeners = () => {
    if (!game) { return; }
    game.addEventListener(Game.Event.AfterEnd, handleGameEnd);
    game.addEventListener(Round.Event.AfterCountDownStart, handleRoundCountDown);
    game.addEventListener(Round.Event.AfterStart, handleRoundStart);
    game.addEventListener(Round.Event.AfterEnd, handleRoundEnd);
  };

  let clearGMListeners = () => {
    if (!game) { return; }
    game.removeEventListener(Game.Event.AfterEnd, handleGameEnd);
    game.removeEventListener(Round.Event.AfterCountDownStart, handleRoundCountDown);
    game.removeEventListener(Round.Event.AfterStart, handleRoundStart);
    game.removeEventListener(Round.Event.AfterEnd, handleRoundEnd);
  };

  // handlers for all players socket

  let handleGameDestroy = (reasonCode) => {
    socket.emit('game.destroy.succeed', reasonCode);
    console.log('game destroyed: ', gameId);
    socket.disconnect(true);
  };

  let registerListeners = () => {
    if (!game) { return; }
    game.addEventListener(Game.Event.BeforeDestroy, handleGameDestroy);
  };

  let clearListeners = () => {
    if (!game) { return; }
    game.removeEventListener(Game.Event.BeforeDestroy, handleGameDestroy);
  };

  socket.on('game.create', function({ gameId, gameOptions }) {
    if (Game.find(gameId)) {
      socket.emit('game.create.error', 409);
      return;
    }
    game = new Game(gameId, playerId, gameOptions);
    registerGMListeners();
    socket.emit('game.create.succeed', { eventData: null, state: game.toJSON() });
    console.log('game created: ', gameId);
  });

  socket.on('game.start', function() {
    // make sure restart works. probably implement some sort of reset
    if (!game.canStartBy(playerId)) {
      socket.emit('game.start.error', 403);
      return;
    }
    game.start();
    io.in(gameId).emit('game.start.succeed', { eventData: null, state: game.toJSON() });
  });

  socket.on('game.destroy', function() {
    if (!game.canDestroyBy(playerId)) {
      socket.emit('game.destroy.error', 403);
      return;
    }
    clearGMListeners();
    clearListeners();
    socket.emit('game.destroy.succeed', 200);
    game.destroy();
  });

  socket.on('round.pickChoice', function({ choiceIndex }) {
    let errorCode = game.currentRound.pickChoice(playerId, choiceIndex);
    if (errorCode) {
      socket.emit('round.pickChoice.error', errorCode);
      return;
    }
    io.in(gameId).emit('round.pickChoice.succeed', { eventData: { playerId: playerId }, state: game.currentRound.toJSON() });
    console.log('choice picked ', playerId, choiceIndex);
  });

  socket.on('player.join', function({ ign }) {
    game = Game.find(gameId);
    if (!game) {
      socket.emit('player.join.error', 404);
      return;
    }
    player = new Player(playerId, { ign: ign });
    if (!game.addPlayer(player)) {
      socket.emit('player.join.error', 409);
      return;
    }
    registerListeners();
    io.in(gameId).emit('player.join.succeed', { eventData: { id: playerId, ign: ign }, state: game.toJSON() });
    console.log('player joined: ', playerId, ign);
  });

  socket.on('player.leave', function() { // TODO also on disconnect
    socket.disconnect(true);
    if (!game || !player) { return; }
    clearListeners();
    if (!game.removePlayer(player)) { return; }
    console.log('player left: ', playerId, player.ign);
    io.in(gameId).emit('player.leave.succeed', { eventData: player.toJSON(), state: game.toJSON() });
    game.destroyIfShould();
  });
});

// TODO gc procedure
