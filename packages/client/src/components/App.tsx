import React from 'react';
import {
    HashRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";

import './App.scss';
import { Watch } from './Watch';
import { Options } from './Options';
import { SideNav } from './SideNav';

export class App extends React.Component<{}, {}> {
    render() {
        return (
            <Router>
                <div className="app-container">
                    <div className="stripe"></div>
                    <div className="side-nav-container">
                        <SideNav/>
                    </div>
                        
                    <div className="main-content-container">
                        <Switch>
                            <Route exact path="/">
                                <Home />
                            </Route>
                            <Route path="/watch">
                                <Watch />
                            </Route>
                            <Route path="/config">
                                <Options />
                            </Route>
                        </Switch>
                    </div>
                </div>
            </Router>
        );
    }
}

function Home() {
    return (
        <div>
            <h2>Home</h2>
        </div>
    );
}