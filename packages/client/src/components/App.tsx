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
            <div className="App">
                <div className="stripe"></div>
                <Router>
                    <SideNav/>
                    
                    <div>
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
                </Router>
            </div>
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