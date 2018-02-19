import TreeNode from './TreeNode';

interface Config {
    showRoot?: boolean;
    selectMultiple?: boolean;

    expandable?: (node: TreeNode) => boolean;
    selectable?: (node: TreeNode) => boolean;
    lazyLoad?: (node: TreeNode) => Promise<void>;
    lazyLoadFailure?: (node: TreeNode, error: Error) => boolean;
    remoteSearch?: (search: string, node: TreeNode) => Promise<void>;
    customActions?: (node: TreeNode) => Array<JSX.Element>;

    sort?: (a: TreeNode, b: TreeNode) => number;
    filter?: (node: TreeNode) => boolean;
}

class TreeConfig {
    showRoot: boolean = false;
    selectMultiple: boolean = true;

    expandable?: (node: TreeNode) => boolean;
    selectable?: (node: TreeNode) => boolean;
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
