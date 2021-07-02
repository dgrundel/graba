import React from 'react';
import {
    Link
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
            <nav className="SideNav">
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/watch">Watch</Link></li>
                    <li><Link to="/config">Config</Link></li>
                </ul>
            </nav>
        );
    }
}