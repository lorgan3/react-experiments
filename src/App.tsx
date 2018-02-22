const logo = require('./logo.svg');
import './css/App.css';
import 'map.prototype.tojson';
import * as React from 'react';
import { BrowserRouter, Route, NavLink, Redirect, Switch } from 'react-router-dom';
import { Example as Example1 } from './examples/1-BasicTree';
import { Example as Example2 } from './examples/2-AsyncTree';
import { Example as Example3 } from './examples/3-ActionTree';
import { Example as Example4 } from './examples/4-Topology';

const header: React.StatelessComponent<{}> = () => {
    return (
        <nav>
            <ul>
                <li><NavLink to="/basic-tree">Basic Tree</NavLink></li>
                <li><NavLink to="/async-tree">Tree with lazy loading</NavLink></li>
                <li><NavLink to="/action-tree">Tree with custom actions</NavLink></li>
                <li><NavLink to="/topology">Topology</NavLink></li>
            </ul>
        </nav>
    );
};

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <div className="App-intro">
                    <BrowserRouter>
                        <>
                            <Route component={header} />
                            <Switch>
                                <Route path="/basic-tree" component={Example1} />
                                <Route path="/async-tree" component={Example2} />
                                <Route path="/action-tree" component={Example3} />
                                <Route path="/topology" component={Example4} />
                                <Redirect to="/basic-tree" />
                            </Switch>
                        </>
                    </BrowserRouter>
                </div>
            </div>
        );
    }
}

export default App;
