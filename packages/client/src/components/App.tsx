import React from 'react';
import {
    HashRouter as Router,
    Switch,
    Route,
} from "react-router-dom";

import './App.scss';
import { Watch } from './Watch';
import { Options } from './Options';
import { SideNav } from './SideNav';
import { theme } from '../theme';

export class App extends React.Component<{}, {}> {
    render() {
        return (
            <Router>
                <div className="app-container">
                    <div className="stripe"></div>
                    <div className="side-nav-container" style={{ backgroundColor: theme.palette.neutralLight }}>
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