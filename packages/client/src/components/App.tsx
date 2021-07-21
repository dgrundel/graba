import React from 'react';
import {
    HashRouter as Router,
    Switch,
    Route,
} from "react-router-dom";
import './App.scss';
import { Watch } from './Watch';
import { ConfigEditor } from './ConfigEditor';
import { SideNav } from './SideNav';
import { theme } from '../theme';
import { Playback } from './Playback';
import { Dashboard } from './Dashboard';

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
                                <Dashboard />
                            </Route>
                            <Route path="/watch">
                                <Watch />
                            </Route>
                            <Route path="/playback">
                                <Playback />
                            </Route>
                            <Route path="/config">
                                <ConfigEditor />
                            </Route>
                        </Switch>
                    </div>
                </div>
            </Router>
        );
    }
}
