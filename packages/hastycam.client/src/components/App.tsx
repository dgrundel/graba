import React from 'react';
import {
    HashRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";

import './App.css';
import { Watch } from './Watch';

class Component extends React.Component<{}, {}> {
    render() {
        return (
            <div className="App">
                <header className="stripe"></header>

                <Router>
                    <div>
                        <Link to="/">Home</Link>&nbsp;
                        <Link to="/watch">Watch</Link>&nbsp;
                        <Link to="/dashboard">Dashboard</Link>

                        <Switch>
                            <Route exact path="/">
                                <Home />
                            </Route>
                            <Route path="/watch">
                                <Watch />
                            </Route>
                            <Route path="/dashboard">
                                <Dashboard />
                            </Route>
                        </Switch>
                    </div>
                </Router>
            </div>
        );
    }
}

export const App = Component;
  
function Home() {
    return (
        <div>
            <h2>Home</h2>
        </div>
    );
}

function Dashboard() {
    return (
        <div>
            <h2>Dashboard</h2>
        </div>
    );
}