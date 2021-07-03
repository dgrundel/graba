import React from 'react';
import {
    NavLink
} from "react-router-dom";
import './SideNav.scss';

interface State {
}

export class SideNav extends React.Component<{}, State> {

    constructor() {
        super({});

        this.state = {
        };
    }

    render() {
        return (
            <nav className="side-nav">
                <ul>
                    <li><NavLink activeClassName="active" exact to="/">Home</NavLink></li>
                    <li><NavLink activeClassName="active" to="/watch">Watch</NavLink></li>
                    <li><NavLink activeClassName="active" to="/config">Config</NavLink></li>
                </ul>
            </nav>
        );
    }
}