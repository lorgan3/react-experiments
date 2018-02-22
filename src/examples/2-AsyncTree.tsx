import * as React from 'react';
import SearchableTree from '../treeView/SearchableTree';
import TreeConfig from '../data/TreeConfig';
import { generateTree } from './Common';

const tree = generateTree(undefined, 50);

const config = new TreeConfig({
    showRoot: true,
    sort: (a, b) => {
        if (a.nodes !== undefined && b.nodes !== undefined) {
            return b.nodes.size - a.nodes.size || a.name.localeCompare(b.name);
        } else {
            return a.name.localeCompare(b.name);
        }
    },
    lazyLoad: node => {
        return new Promise((resolve, reject) => {
            window.setTimeout(
                () => {
                    // To simulate lazy loading one 'layer' of nodes is added every time this function is called.
                    // The reduce figures out which node in the 'real' tree we're asking data for.
                    let pathToRoot = node.getPathToRoot();
                    let actualNode = tree;

                    actualNode = pathToRoot.reverse().reduce(
                        (result, pathNode) => {
                            if (pathNode.id === result.id) {
                                return result;
                            }
                            return result.nodes!.get(pathNode.id)!;
                        },
                        tree
                    );

                    node.nodes = new Map();
                    actualNode!.nodes!.forEach(child => {
                        let clone = child.clone();
                        clone.parent = node;
                        node.nodes!.set(child.id, clone);
                    });
                    resolve();
                },
                Math.random() * 1000
            );
        });
    },
    remoteSearch: (search, node) => {
        return new Promise((resolve, reject) => {
            window.setTimeout(
                () => {
                    // Magic code that fills in all nodes that will be required for the search.
                    // This dummy code just fills in the whole tree.
                    if (node.nodes === undefined) {
                        node.nodes = new Map();
                        tree.nodes!.forEach(child => {
                            let clone = child.clone(true);
                            clone.parent = node;
                            node.nodes!.set(child.id, clone);
                        });
                    }

                    resolve();
                },
                Math.random() * 1000
            );
        });
    }
});

export const Example: React.StatelessComponent<{}> = () => {
    return (
        <SearchableTree className="root" node={tree.clone()} config={config} debounce={200} />
    );
};
