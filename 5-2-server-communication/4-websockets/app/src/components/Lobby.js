import React from 'react';
import { generateId } from '../utils/common';
import { connect } from 'react-redux'
import { selectCurrentPlayerIGN, setCurrentPlayerIGN } from '../redux/slices/currentPlayer'

const mapStateToProps = (state) => ({ ign: selectCurrentPlayerIGN(state) });
const mapDispatchToProps = { setCurrentPlayerIGN };

class Lobby extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ign: props.ign, gameId: '' };

    this.handleChangeIGN = this.handleChangeIGN.bind(this);
    this.handleChangeGameId = this.handleChangeGameId.bind(this);
    this.handleCreateGame = this.handleCreateGame.bind(this);
    this.handleJoinGame = this.handleJoinGame.bind(this);
  }

  handleChangeIGN(event) {
    this.setState({ ign: event.target.value });
  }

  handleChangeGameId(event) {
    this.setState({ gameId: event.target.value });
  }

  handleCreateGame(event) {
    event.preventDefault();
    if (!this.state.ign) {
      alert('In game name cannot be empty.');
      return;
    }
    this.props.setCurrentPlayerIGN(this.state.ign);
    let gameId = generateId(8);
    this.props.history.replace({ pathname: `/game/${gameId}`, state: { action: 'create', newGameOptions: { difficulty: 'all', book: 'all' } } });
  }

  handleJoinGame(event) {
    event.preventDefault();
    this.props.setCurrentPlayerIGN(this.state.ign);
    this.props.history.replace({ pathname: `/game/${this.state.gameId}`, state: { action: 'join' } });
  }

  render() {
    return <div className="Lobby">
      <h1>Game Lobby</h1>
      <form>
        <label>
          Your In Game Name:
        </label>
        <input type="text" value={this.state.ign} onChange={this.handleChangeIGN} />
      </form>
      <br />
      <form onSubmit={this.handleCreateGame}>
        <input type="submit" value="Create Game" />
      </form>
      <br />
      <form onSubmit={this.handleJoinGame}>
        <label>
          Room ID:
        </label>
        <input type="text" value={this.state.gameId} onChange={this.handleChangeGameId} />
        <input type="submit" value="Join Game" />
      </form>
    </div>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Lobby);
