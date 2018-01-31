import TreeConfig from './TreeConfig';

export enum SelectionState {
    checked = 'CHECKED',
    indeterminate = 'INDETERMINATE',
    unchecked = 'UNCHECKED'
}

class TreeNode {
    nodes?: Map<number, TreeNode> = undefined;

    _selectedNodes?: Array<TreeNode> = undefined;

    _selectionState?: SelectionState = undefined;
    _isSelectable?: boolean = undefined;
    _isExpandable?: boolean = undefined;

    constructor(public id: number, public name: string, public parent?: TreeNode, public active?: boolean, public expanded?: boolean) {
    }

    get root(): TreeNode {
        if (this.parent === undefined) {
            return this;
        }

        return this.parent.root;
    }

    getSelectedNodes(): Array<TreeNode> {
        if (this._selectedNodes === undefined) {
            this._selectedNodes = [];
            if (this.active === true) {
                this._selectedNodes.push(this);
            } else if (this.expanded === true && this.nodes !== undefined) {
                this.nodes.forEach(node => this._selectedNodes = this._selectedNodes!.concat(node.getSelectedNodes()));
            }
        }

        return this._selectedNodes;
    }

    getPathToRoot(path?: Array<TreeNode>): Array<TreeNode> {
        if (path === undefined) {
            path = [];
        }
        path.push(this);

        if (this.parent === undefined) {
            return path;
        }

        return this.parent.getPathToRoot(path);
    }

    isExpandable(config: TreeConfig): boolean {
        if (this._isExpandable === undefined) {
            this._isExpandable = ((this.nodes === undefined || this.nodes.size > 0) &&
            (config.expandable === undefined || config.expandable(this) === true));
        }

        return this._isExpandable;
    }

    isSelectable(config: TreeConfig): boolean {
        if (this._isSelectable === undefined) {
            this._isSelectable = (config.selectable === undefined || config.selectable(this) === true);
        }

        return this._isSelectable;
    }

    dirty() {
        this._selectionState = undefined;
        this._isSelectable = undefined;
        this._isExpandable = undefined;
        this._selectedNodes = undefined;
    }

    handleActivate(config: TreeConfig, isolate: boolean, callback: (nodes: Array<TreeNode>) => void): Array<TreeNode> {
        let updatedNodes: Array<TreeNode> = [];
        const active = this.getSelectionState() === SelectionState.unchecked;

        if (!this.isSelectable(config)) {
            this.handleExpand(config, isolate, callback);
        } else if (isolate === true || (config.selectMultiple === false && active === true)) {
            updatedNodes = this.root.setStateForAll(false, config);
            this.setExpanded(false);
            this.setState(true);
        } else {
            updatedNodes = this.setStateForAll(active, config);
        }

        return updatedNodes;
    }

    handleExpand(config: TreeConfig, isolate: boolean, callback: (nodes: Array<TreeNode>) => void): Array<TreeNode> {
        if (this.isExpandable(config)) {
            const initialState = this.active || false;
            let nodes = this.setExpanded(this.expanded !== true);

            if (this.expanded === true && this.nodes === undefined) {
                this.handleLazyLoad(config).then(() => {
                    this.setStateForAll(initialState, config);
                    callback(nodes.concat(this.getPathToRoot()));
                });
            }

            return nodes;
        } else {
            return [];
        }
    }

    async handleLazyLoad(config: TreeConfig): Promise<void> {
        if (config.lazyLoad === undefined) {
            this.nodes = new Map();
        } else {
            try {
                await config.lazyLoad(this);
            } catch (error) {
                if (config.lazyLoadFailure === undefined || config.lazyLoadFailure(this, error)) {
                    this.nodes = new Map();
                }
            }
        }
    }

    setExpanded(expanded: boolean): Array<TreeNode> {
        this.expanded = expanded;
        if (expanded === true) {
            const updatedNodes = this.setStateForAll(this.active === true);
            this.active = false;

            return updatedNodes;
        } else {
            this.setState(this.getSelectionState() === SelectionState.checked);
        }

        return [];
    }

    setState(active: boolean) {
        this.active = active;
    }

    setStateForAll(active: boolean, config?: TreeConfig): Array<TreeNode> {
        let updatedNodes: Array<TreeNode> = [this];

        if (config === undefined || this.isSelectable(config)) {
            if (this.expanded === true && this.nodes !== undefined) {
                this.nodes.forEach(node => updatedNodes = updatedNodes.concat(node.setStateForAll(active, config)));
                return updatedNodes;
            } else {
                this.setState(active);
                return updatedNodes;
            }
        }

        return [];
    }

    getSelectionState(clear?: boolean): SelectionState {
        if (clear === true || this._selectionState === undefined) {
            if (this.active) {
                this._selectionState = SelectionState.checked;
            } else if (this.expanded === true && this.nodes !== undefined) {
                const count = [...this.nodes.values()].reduce((total, node) => node.getSelectionState(clear) === SelectionState.unchecked ? total : total + 1, 0);
                if (count === this.nodes.size) {
                    this._selectionState = SelectionState.checked;
                } else if (count === 0) {
                    this._selectionState = SelectionState.unchecked;
                } else {
                    this._selectionState = SelectionState.indeterminate;
                }
            } else {
                this._selectionState = SelectionState.unchecked;
            }
        }

        return this._selectionState;
    }

    toJson(): string {
        return JSON.stringify(
            this,
            function (key: string, value: any): any {
                if (key === 'parent') {
                    return undefined;
                }

                return value;
            },
            4
        );
    }
}

export default TreeNode;
