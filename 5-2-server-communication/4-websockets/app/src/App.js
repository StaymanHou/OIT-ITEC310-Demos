import React from 'react';
// import logo from './logo.svg';
import './App.css';
import {
  HashRouter as Router,
  Switch,
  Route,
  // Link
} from "react-router-dom";
import { Provider } from 'react-redux';
import store from './store';
import Lobby from './components/Lobby';
import Game from './components/Game';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Switch>
            <Route path="/game/:id" component={Game} />
            <Route path="/" component={Lobby} />
          </Switch>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
