import * as React from 'react';
import TreeNode from './data/TreeNode';
import 'map.prototype.tojson';
import TreeView from './TreeView';
import TreeConfig from './data/TreeConfig';

const logo = require('./logo.svg');
import './App.css';

let seed = 1;
function random() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

let id = 1;

/**
 * Generate a tree.
 * @param parent   The parent tree.
 * @param children The amount of children to generate. Random amount when undefined.
 */
function generateTree(parent?: TreeNode, children?: number): TreeNode {
    children = children === undefined ? Math.floor(random() * 3) : children;

    let node = new TreeNode(id++, random().toString(36).substr(2, 9), parent);
    // let nodes = new Map(new Array(children).fill(undefined).map((i, index): [number, TreeNode] => {
    //     let child = generateTree(node, Math.floor(index < 0 ? 0 : index / 2));
    //     return [child.id, child];
    // }));
    // node.nodes = nodes;

    return node;
}

const tree = generateTree(undefined, 100);
// tree.setExpanded(true);

const config = new TreeConfig({
    showRoot: true,
    // expandable: node => node.id !== 1,
    // selectable: node => !node.name.includes('2'),
    sort: (a, b) => {
        if (a.nodes !== undefined && b.nodes !== undefined) {
            return a.nodes.size - b.nodes.size || a.name.localeCompare(b.name);
        } else {
            return a.name.localeCompare(b.name);
        }
    },
    lazyLoad: node => {
        return new Promise((resolve, reject) => {
            window.setTimeout(
                () => {
                    node.nodes = new Map(new Array(50).fill(undefined).map((i, index): [number, TreeNode] => {
                        let child = generateTree(node, Math.floor(index < 0 ? 0 : index / 2));
                        return [child.id, child];
                    }));
                    resolve();
                },
                Math.random() * 1000
            );
        });
    }
});

console.log(id, tree);

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <div className="App-intro">
                    <TreeView node={tree} config={config} />
                    {/* <code>
                        <pre>{tree.toJson()}</pre>
                    </code> */}
                </div>
            </div>
        );
    }
}

export default App;
