import * as React from 'react';
import SearchableTree from '../treeView/SearchableTree';
import TreeConfig from '../data/TreeConfig';
import { generateTree } from './Common';

const tree = generateTree(undefined, 50);
tree.setExpanded(true);

const config: TreeConfig = new TreeConfig({
    showRoot: false,
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
    }
});

export const Example: React.StatelessComponent<{}> = () => {
    return (
        <SearchableTree className="root" node={tree} config={config} debounce={200} />
    );
};
