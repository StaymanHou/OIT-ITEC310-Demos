# Overview

The reference provides the spec of the websocket messages along with the payloads that the server expects to receive from client / emits to client

### Socket Connection

Client will connect using the default socket io endpoint, with the following query params:

```
clientVersion: [Int] version of the client
apiVersion: [Int] version of the server endpoint that the client would like to talk to
gameId: [8 char String] randomly generated game id composed of digits and letters without the ones that can be confused such as 0 and O
playerId: [uuidv4 String] randomly generated uuidv4 string
```

### Incoming Messages (Client -> Server)

* [ping](https://socket.io/docs/client-api/#Event-%E2%80%98ping%E2%80%99-1) (socket.io built-in)
* [game.create](#rx-gamecreate)
* [game.start](#rx-gamestart)
* [game.destroy](#rx-gamedestroy)
* [player.join](#rx-playerjoin)
* [player.leave](#rx-playerleave)
* [round.pickChoice](#rx-roundpickchoice)

### Outgoing Messages (Server -> Client)

* [pong](https://socket.io/docs/client-api/#Event-%E2%80%98pong%E2%80%99-1) (socket.io built-in)
* [game.create.succeed](#tx-gamecreatesucceed)
* [game.create.error](#tx-gamecreateerror)
* [game.start.succeed](#tx-gamestartsucceed)
* [game.start.error](#tx-gamestarterror)
* [game.end.succeed](#tx-gameendsucceed)
* [game.destroy.succeed](#tx-gamedestroysucceed)
* [game.destroy.error](#tx-gamedestroyerror)
* [player.join.succeed](#tx-playerjoinsucceed)
* [player.join.error](#tx-playerjoinerror)
* [player.leave.succeed](#tx-playerleavesucceed)
* [player.leave.error](#tx-playerleaveerror)
* [round.ready.succeed](#tx-roundreadysucceed)
* [round.start.succeed](#tx-roundstartsucceed)
* [round.pickChoice.succeed](#tx-roundpickChoicesucceed)
* [round.pickChoice.error](#tx-roundpickChoiceerror)
* [round.end.succeed](#tx-roundendsucceed)

## [Rx] game.create

Client sends this message to request the server to create a new game room given the specified game id and game options. (The player id associated with this message should be implicitly set as the game master / host of the created game.)

Payload

```
gameId: [8 char String] randomly generated game id composed of digits and letters without the ones that can be confused such as 0 and O
gameOptions: <GameOptions>
```

[More about `<GameOptions>`](#gameoptions)

## [Rx] game.start

Client sends this message to request the server to start the game. (Only the game master / host can start the game.)

This message doesn't have a payload

## [Rx] game.destroy

Client sends this message to request the server to destroy the game. (Only the game master / host can destroy the game.)

This message doesn't have a payload

## [Rx] player.join

Client sends this message to request the server to add the player associated with the connection to the game. (Game master also have to send this message to join the game after creating it.)

Payload

```
ign: [String] The in game name the player would like to use in this game
```

## [Rx] player.leave

Client sends this message to request the server to remove the player associated with the connection from the game. (Game should be destroyed if last player leaves.)

This message doesn't have a payload

## [Rx] round.pickChoice

Client sends this message to indicate that the player associated with the connection has picked an answer.

Payload

```
choiceIndex: [Int] index of the picked choice
```

## [Tx] game.create.succeed

Server sends this message to the connection which requested it after successfully created a game room.

Payload

```
eventData: null // the eventData is always null for this message
state: <GameState>
```

[More about `<GameState>`](#gamestate)

## [Tx] game.create.error

Server sends this message to the connection which requested it after failed to create a game room.

Payload

```
errorCode: [Int] Indicates the error that has occured. 400= invalid game options. 409= game id already taken. -1= other errors.
```

## [Tx] game.start.succeed

Server broadcasts this message to all connections in the room after the game started successfully.

Payload

```
eventData: null // the eventData is always null for this message
state: <GameState>
```

[More about `<GameState>`](#gamestate)

## [Tx] game.start.error

Server sends this message to the connection which requested it after failed to start a game.

Payload

```
errorCode: [Int] Indicates the error that has occured. 403= player not authorized to start the game. -1= other errors
```

## [Tx] game.end.succeed

Server broadcasts this message to all connections in the room after the game ended.

Payload

```
eventData: {
  winners: [Array of uuidv4 String] The player id of the winner(s) (multiple if it's a tie)
}
state: <GameState>
```

[More about `<GameState>`](#gamestate)

## [Tx] game.destroy.succeed

Server broadcasts this message to all connections in the room after the game destroyed.

Payload

```
reasonCode: [Int] Indicates the reason why the game is destroyed. 408= the game exceeded the max TTL and expired. 200= the game destroyed normally or requested by game master
```

## [Tx] game.destroy.error

Server sends this message to the connection which requested it after failed to destroy a game.

Payload

```
errorCode: [Int] Indicates the error that has occured. 403= player not authorized to destroy the game. -1= other errors
```

## [Tx] player.join.succeed

Server broadcasts this message to all connections in the room after a player joined successfully.

Payload

```
eventData: {
  id: [uuidv4 String] Player ID of the newly joined player
  ign: [String] In game name of the newly joined player
}
state: <GameState>
```

[More about `<GameState>`](#gamestate)

## [Tx] player.join.error

Server sends this message to the connection which requested it after failed to join a game.

Payload

```
errorCode: [Int] Indicates the error that has occured. 404= game room not found. 409= player id or player ign already taken. -1= other errors
```

## [Tx] player.leave.succeed

Server broadcasts this message to all connections in the room after a player left successfully.

Payload

```
eventData: {
  id: [uuidv4 String] Player ID of the newly left player
  ign: [String] In game name of the newly left player
}
state: <GameState>
```

[More about `<GameState>`](#gamestate)

## [Tx] player.leave.error

Server sends this message to the connection which requested it after failed to leave a game.

Payload

```
errorCode: [Int] Indicates the error that has occured. -1= other errors
```

## [Tx] round.ready.succeed

Server broadcasts this message to all connections in the room after a round started to count down.

Payload

```
eventData: {
  startIn: [Int] Number of ms before the round starts. Default 3,000.
  roundIndex: [Int] Index of the round (Zero-based index associated with the rounds property in <GameState>)
}
state: <RoundState>
```

[More about `<RoundState>`](#roundstate)

## [Tx] round.start.succeed

Server broadcasts this message to all connections in the room after a round started.

Payload

```
eventData: {
  timeoutIn: [Int] Number of ms before the round times out if player don't pick an answer. Default 30,000.
  roundIndex: [Int] Index of the round (Zero-based index associated with the rounds property in <GameState>)
}
state: <RoundState>
```

[More about `<RoundState>`](#roundstate)

## [Tx] round.pickChoice.succeed

Server broadcasts this message to all connections in the room after a player picked his/her answer.

Payload

```
eventData: {
  playerId: [uuidv4 String] Player ID of the player who just picked his/her answer
}
state: <RoundState>
```

[More about `<RoundState>`](#roundstate)

## [Tx] round.pickChoice.error

Server sends this message to the connection which requested it after failed to set the picked answer of the player.

Payload

```
errorCode: [Int] Indicates the error that has occured. 409= conflict, likely the player already picked an answer. -1= other errors.
```

## [Tx] round.end.succeed

Server broadcasts this message to all connections in the room after a round ended.

Payload

```
eventData: {
  reasonCode: [Int] Indicates the reason why the round ended. 408= the round timed out, someone didn't pick an answer. 200= the round ended normally, everyone picked an answer.
}
state: {
  roundState: <RoundState>
  gameState: <GameState>
}
```

[More about `<RoundState>`](#roundstate)
[More about `<GameState>`](#gamestate)

### `<GameOptions>`

A JSON represents the different options that alters the game rules and settings

```
difficulty: [Int Const] A const of integer each represents EASY, NORMAL, HARD, ALL. Quizzes will be generated from the specified difficulty
book: [Int Const] A const of integer each represents a book in the Bible e.g. GEN, EXOD, LEV, etc. Quizzes will be generated from the specified difficulty
mode: [Int Const] A const of integer each represents CLASSIC, QUICK_ANSWER. Indicates which rules should be applied to this game
roundCount: [Int] Number of rounds this game should have. (Should not exceed the limits)
```

### `<GameState>`

A JSON represents the full publicly visible state of a game

```
id: [8 char String] Id of the game.
status: [Int Const] A const of integer each represents the status of the game. WAITING, (STARTING), STARTED, (ENDING), ENDED, (DESTROYING), DESTROYED.
masterPlayerId: [uuidv4 String] Player ID of the player who created the game
difficulty: [Int Const] A const of integer each represents EASY, NORMAL, HARD, ALL. Quizzes will be generated from the specified difficulty
book: [Int Const] A const of integer each represents a book in the Bible e.g. GEN, EXOD, LEV, etc. Quizzes will be generated from the specified difficulty
mode: [Int Const] A const of integer each represents CLASSIC, QUICK_ANSWER. Indicates which rules should be applied to this game
roundCount: [Int] Number of rounds this game should have. (Should not exceed the limits)
players: [Array of <Player>] Players currently joined the game.
rounds: [Array of <RoundState>] State of all rounds of the game.
playerScores: (Conditional)[Object of uuidv4 String as key & Int as value] The integer score of each player by player ID. Only available after game started.
winners: (Conditional)[Array of uuidv4 String] The player id of the winner(s) (multiple if it's a tie). Only available after game ended.
```

[More about `<RoundState>`](#roundstate)
[More about `<Player>`](#player)

### `<RoundState>`

A JSON represents the full publicly visible state of a round

```
index: [Int] Index of the round in the game. See <GameState>.rounds
id: [Int/uuid] Id of the quiz stored in database.
status: [Int Const] A const of integer each represents the status of the round. PENDING, COUNTING_DOWN, STARTED, ENDED.
startAt: (Conditional)[Int timestamp in ms] The timestamp at when the game will start/would have started based on server system clock. Only available after the round has started counting down
stem: (Conditional)[String] The stem of the quiz. Only available after the round started
choices: (Conditional)[Array of String] The choices of the quiz. Only available after the round started
playerAnswers: (Conditional)<PlayerAnswers> Only available after round started
timeoutAt: (Conditional)[Int timestamp in ms] The timestamp at when the game will timeout/would have timed out based on server system clock. Only available after the round started
additionalInfo: (Conditional)[String] Additional information about the quiz or answer, such as a clue. Only available after round ended
keyIndex: (Conditional)[Int] The index of the correct choice, aka key. Only available after round ended. See <RoundState>.choices
```

[More about `<PlayerAnswers>`](#playeranswers)

### `<Player>`

A JSON represents a player

```
id: [uuidv4 String] random uuidv4 id of the player
ign: [String] The in game name of the player
```

### `<PlayerAnswers>`

A JSON represents the full publicly visible state of a round

```
{
  ...
  [uuidv4 String]: [Boolean] // The value is a boolean when the round is still ongoing. Indicate whether the player has picked his/her answer
  [uuidv4 String]: { // The value is an object when the round ended. Indicate when and what the player has picked
    choiceIndex: [Int] The index of the choice picked by the player
    ts: [Int timestamp in ms] The timestamp at when the player picked the choice based on server system clock.
  }
  ...
}
```
