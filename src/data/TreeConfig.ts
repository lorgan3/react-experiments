import TreeNode from './TreeNode';

interface Config {
    /** Show the root node? */
    showRoot?: boolean;
    /** Allow multiple selection? */
    selectMultiple?: boolean;

    /** Is this node expandable? */
    expandable?: (node: TreeNode, config: TreeConfig) => boolean;
    /** Is this node selectable? */
    selectable?: (node: TreeNode, config: TreeConfig) => boolean;
    /** Function called when a node has no children. */
    lazyLoad?: (node: TreeNode) => Promise<void>;
    /** Function called when lazy loading throws an error */
    lazyLoadFailure?: (node: TreeNode, error: Error) => boolean;
    /** Function called when searching */
    remoteSearch?: (search: string, node: TreeNode) => Promise<void>;
    /** Function that can return optional elements to add to a node in the tree. */
    customActions?: (node: TreeNode) => Array<JSX.Element>;

    /** Function used to determine how to sort the nodes. */
    sort?: (a: TreeNode, b: TreeNode) => number;
    /** Function used to determine which nodes are visible. */
    filter?: (node: TreeNode) => boolean;
}

class TreeConfig {
    showRoot: boolean = false;
    selectMultiple: boolean = true;

    expandable?: (node: TreeNode, config: TreeConfig) => boolean;
    selectable?: (node: TreeNode, config: TreeConfig) => boolean;
    lazyLoad?: (node: TreeNode) => Promise<void>;
    lazyLoadFailure?: (node: TreeNode, error: Error) => boolean;
    remoteSearch?: (search: string, node: TreeNode) => Promise<void>;
    customActions?: (node: TreeNode) => Array<JSX.Element>;

    sort?: (a: TreeNode, b: TreeNode) => number;
    filter?: (node: TreeNode) => boolean;

    constructor(config: Config) {
        Object.assign(this, config);
    }
}

export default TreeConfig;
