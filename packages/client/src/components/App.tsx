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
import { connect } from 'react-redux';
import { RootState } from '../store/store';
import { AppMessage } from '../store/appReducer';
import { MessageBar } from '@fluentui/react';
import { AppRoute } from '../routes';

interface Props {
    messages: AppMessage[];
}

interface State {

}

class Component extends React.Component<Props, State> {
    render() {
        return (
            <Router>
                <div className="app-container">
                    <div className="stripe"></div>
                    <div className="side-nav-container" style={{ backgroundColor: theme.palette.neutralLight }}>
                        <SideNav/>
                    </div>
                        
                    <div className="main-content-container">
                        <div className="main-content-messages">
                            {this.props.messages.map(m => <MessageBar
                                messageBarType={m.type}
                                dismissButtonAriaLabel="Close"
                            >
                                {m.body}
                            </MessageBar>)}
                        </div>

                        <Switch>
                            <Route exact path={AppRoute.urls[AppRoute.Dashboard]}>
                                <Dashboard />
                            </Route>
                            <Route path={AppRoute.urls[AppRoute.WatchLive]}>
                                <Watch />
                            </Route>
                            <Route path={AppRoute.urls[AppRoute.Playback]}>
                                <Playback />
                            </Route>
                            <Route path={AppRoute.urls[AppRoute.Configure]}>
                                <ConfigEditor />
                            </Route>
                        </Switch>
                    </div>
                </div>
            </Router>
        );
    }
}

const mapStateToProps = (state: RootState, ownProps: Partial<Props>): Props => {
    return {
        messages: state.app.messages,
    };
};

export const App = connect(mapStateToProps, {})(Component);