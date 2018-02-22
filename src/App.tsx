const logo = require('./logo.svg');
import './App.css';
import 'map.prototype.tojson';
import * as React from 'react';
import SearchableTree from './SearchableTree';
import TopologyArea from './Topology/TopologyArea';
import TopologyNode from './data/TopologyNode';
import TreeConfig from './data/TreeConfig';
import TreeNode from './data/TreeNode';

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
    let nodes = new Map(new Array(children).fill(undefined).map((i, index): [number, TreeNode] => {
        let child = generateTree(node, Math.floor(index < 0 ? 0 : index / 2));
        return [child.id, child];
    }));
    node.nodes = nodes;

    return node;
}

const tree = generateTree(undefined, 50);

const config = new TreeConfig({
    showRoot: true,
    // expandable: node => node.id !== 1,
    // selectable: node => !node.name.includes('2'),
    sort: (a, b) => {
        if (a.nodes !== undefined && b.nodes !== undefined) {
            return b.nodes.size - a.nodes.size || a.name.localeCompare(b.name);
        } else {
            return a.name.localeCompare(b.name);
        }
    },
    customActions: (node) => {
        let actions: Array<JSX.Element> = [];

        if (node.id % 15 === 0) {
            actions.push((
                <i
                    key="fizzbuzz"
                    className="fa fa-info-circle float-right"
                    onClick={(e) => {
                        alert(`fizzbuzz for node ${node.id}`);
                        e.stopPropagation();
                    }}
                />
            ));
        } else if (node.id % 3 === 0) {
            actions.push((
                <i
                    key="fizz"
                    className="fa fa-edit float-right"
                    onClick={(e) => {
                        alert(`fizz for node ${node.id}`);
                        e.stopPropagation();
                    }}
                />
            ));
        } else if (node.id % 5 === 0) {
            actions.push((
                <i
                    key="buzz"
                    className="fa fa-eraser float-right"
                    onClick={(e) => {
                        alert(`buzz for node ${node.id}`);
                        e.stopPropagation();
                    }}
                />
            ));
        }

        return actions;
    }
    // lazyLoad: node => {
    //     return new Promise((resolve, reject) => {
    //         window.setTimeout(
    //             () => {
    //                 // To simulate lazy loading one 'layer' of nodes is added every time this function is called.
    //                 // The reduce figures out which node in the 'real' tree we're asking data for.
    //                 let pathToRoot = node.getPathToRoot();
    //                 let actualNode = tree;

    //                 actualNode = pathToRoot.reverse().reduce(
    //                     (result, pathNode) => {
    //                         if (pathNode.id === result.id) {
    //                             return result;
    //                         }
    //                         return result.nodes!.get(pathNode.id)!;
    //                     },
    //                     tree
    //                 );

    //                 node.nodes = new Map();
    //                 actualNode!.nodes!.forEach(child => {
    //                     let clone = child.clone();
    //                     clone.parent = node;
    //                     node.nodes!.set(child.id, clone);
    //                 });
    //                 resolve();
    //             },
    //             Math.random() * 1000
    //         );
    //     });
    // },
    // remoteSearch: (search, node) => {
    //     return new Promise((resolve, reject) => {
    //         window.setTimeout(
    //             () => {
    //                 // Magic code that fills in all nodes that will be required for the search.
    //                 // This dummy code just fills in the whole tree.
    //                 if (node.nodes === undefined) {
    //                     node.nodes = new Map();
    //                     tree.nodes!.forEach(child => {
    //                         let clone = child.clone(true);
    //                         clone.parent = node;
    //                         node.nodes!.set(child.id, clone);
    //                     });
    //                 }

    //                 resolve();
    //             },
    //             Math.random() * 1000
    //         );
    //     });
    // }
});

console.log(id, tree);

id = 1;
let topologyNodes: Array<TopologyNode> = [];

let i = 2;
// for (let i = 0; i < 20; i++) {
let topologyNode = new TopologyNode(id++, undefined, []);
for (let j = 0; j < 20 * i + 5; j++) {
    topologyNode.nodes!.push(new TopologyNode(id++, topologyNode));
}

topologyNodes.push(topologyNode);
// }

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <div className="App-intro">
                    <TopologyArea nodes={topologyNodes} />
                    <SearchableTree className="root" node={tree} config={config} debounce={200} />
                </div>
            </div>
        );
    }
}

export default App;
