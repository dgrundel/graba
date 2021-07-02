import React from 'react';
import {
    HashRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
  
  // This site has 3 pages, all of which are rendered
  // dynamically in the browser (not server rendered).
  //
  // Although the page does not ever refresh, notice how
  // React Router keeps the URL up to date as you navigate
  // through the site. This preserves the browser history,
  // making sure things like the back button and bookmarks
  // work properly.

import './App.css';
  

interface AppState {
    feedNames: string[];
}

export default class App extends React.Component<{}, AppState> {

    constructor() {
        super({});

        this.state = {
            feedNames: [],
        };
    }

    render() {
        return (
            <div className="App">
                <header className="stripe"></header>

                <Router>
                    <div>
                        <Link to="/">Home</Link>&nbsp;
                        <Link to="/about">About</Link>&nbsp;
                        <Link to="/dashboard">Dashboard</Link>

                        <Switch>
                            <Route exact path="/">
                                <Home />
                            </Route>
                            <Route path="/about">
                                <About />
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
  
// You can think of these components as "pages"
// in your app.

function Home() {
    return (
        <div>
            <h2>Home</h2>
        </div>
    );
}

function About() {
    return (
        <div>
            <h2>About</h2>
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