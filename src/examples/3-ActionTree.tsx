import * as React from 'react';
import SearchableTree from '../treeView/SearchableTree';
import TreeConfig from '../data/TreeConfig';
import { generateTree } from './Common';

const tree = generateTree(undefined, 50);
const config: TreeConfig = new TreeConfig({
    showRoot: true,
    expandable: node => node.id !== 1,
    selectable: (node, config) => !node.name.includes('2') && (node.parent === undefined || node.parent!.isSelectable(config)),
    sort: (a, b) => {
        if (a.isSelectable(config) !== b.isSelectable(config)) {
            return b.isSelectable(config) ? 1 : -1;
        }

        if (a.nodes !== undefined && b.nodes !== undefined) {
            return b.nodes.size - a.nodes.size || a.name.localeCompare(b.name);
        } else {
            return a.name.localeCompare(b.name);
        }
    },
    customActions: (node) => {
        let actions: Array<JSX.Element> = [];

        if (node.isSelectable(config) === false) {
            return actions;
        }

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
});

export const Example: React.StatelessComponent<{}> = () => {
    return (
        <SearchableTree className="root" node={tree} config={config} debounce={200} />
    );
};
