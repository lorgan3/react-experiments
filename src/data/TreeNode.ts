import TreeConfig from './TreeConfig';
const escapeStringRegexp = require('escape-string-regexp');

export enum SelectionState {
    checked = 'CHECKED',
    indeterminate = 'INDETERMINATE',
    unchecked = 'UNCHECKED'
}

export enum DisplayState {
    visible = 'VISIBLE',
    relevant = 'RELEVANT',
    invisible = 'INVISIBLE'
}

class TreeNode {
    nodes?: Map<number, TreeNode> = undefined;
    visible: DisplayState = DisplayState.visible;

    _selectedNodes?: Array<TreeNode> = undefined;

    _selectionState?: SelectionState = undefined;
    _isSelectable?: boolean = undefined;
    _isExpandable?: boolean = undefined;

    constructor(public id: number, public name: string, public parent?: TreeNode, public active?: boolean, public expanded?: boolean) {
    }

    /**
     * Get the root TreeNode.
     */
    get root(): TreeNode {
        if (this.parent === undefined) {
            return this;
        }

        return this.parent.root;
    }

    /**
     * Get all selected TreeNodes.
     */
    getSelectedNodes(): Array<TreeNode> {
        if (this._selectedNodes === undefined) {
            this._selectedNodes = [];
            if (this.visible !== DisplayState.invisible) {
                if (this.active === true) {
                    this._selectedNodes.push(this);
                } else if (this.expanded === true && this.nodes !== undefined) {
                    this.nodes.forEach(node => this._selectedNodes = this._selectedNodes!.concat(node.getSelectedNodes()));
                }
            }
        }

        return this._selectedNodes;
    }

    /**
     * Get all TreeNodes that are required to reach the root TreeNode from the current TreeNode.
     * @param path The path so far, should be undefined when called manually.
     */
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

    /**
     * Indicates whether the current TreeNode is expandable.
     * @param config A TreeConfig.
     */
    isExpandable(config: TreeConfig): boolean {
        if (this._isExpandable === undefined) {
            this._isExpandable = ((this.nodes === undefined || this.nodes.size > 0) &&
                (config.expandable === undefined || config.expandable(this) === true));
        }

        return this._isExpandable;
    }

    /**
     * Indicates whether the current TreeNode is selectable.
     * @param config A TreeConfig.
     */
    isSelectable(config: TreeConfig): boolean {
        if (this._isSelectable === undefined) {
            this._isSelectable = (config.selectable === undefined || config.selectable(this) === true);
        }

        return this._isSelectable;
    }

    /**
     * Marks a TreeNode as dirty (Clears the cache).
     */
    dirty() {
        this._selectionState = undefined;
        this._isSelectable = undefined;
        this._isExpandable = undefined;
        this._selectedNodes = undefined;
    }

    /**
     * Perform actions when a user selects a TreeNode.
     * @param config A TreeConfig.
     * @param isolate If the user performed an isolate action.
     * @param callback A callback that may be called after lazy loading.
     */
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

    /**
     * Perform actions when a user expands a TreeNode.
     * @param config A TreeConfig.
     * @param isolate If the user performed an isolate action.
     * @param callback A callback that may be called after lazy loading.
     */
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

    /**
     * Updates the search state for the entire tree.
     * @param search A search string.
     */
    handleSearch(search: string) {
        if (search.trim() === '') {
            this.visible = DisplayState.visible;
            this.setVisibleForChildren(DisplayState.visible);
        } else {
            this.visible = DisplayState.invisible;
            this.setVisibleForChildren(DisplayState.invisible);
            this.updateSearch(new RegExp(escapeStringRegexp(search)));
        }
    }

    /**
     * Recursivly shows matching nodes and hides irrelevant ones.
     * @param query The regular expression that will be used to determine which nodes are visible.
     */
    updateSearch(query: RegExp) {
        if (query.test(this.name)) {
            this.expanded = false;
            this.visible = DisplayState.visible;
            this.setVisibleForChildren(DisplayState.relevant);
            this.setRelevant();
        } else if (this.nodes !== undefined) {
            this.visible = DisplayState.invisible;
            this.expanded = false;
            this.nodes.forEach(node => node.updateSearch(query));
        }
    }

    /**
     * Attempts lazy loading the TreeNode's children.
     * @param config A TreeConfig containing instructions on how to perform the lazy load.
     */
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

    /**
     * Sets the expand state of the current TreeNode.
     * When collapsing and all children are selected the TreeNode will be selected. Otherwise it will be deselected.
     * @param expanded The new expanded state.
     */
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

    /**
     * Set the state of the current TeeNode.
     * @param active The new state.
     */
    setState(active: boolean) {
        this.active = active;
    }

    /**
     * Makes sure the node that this is called on is visible by expanding all parents and making them relevant.
     */
    setRelevant() {
        if (this.parent !== undefined) {
            this.parent.visible = DisplayState.relevant;
            this.parent.expanded = true;
            this.parent.setRelevant();
        }
    }

    /**
     * Set the state for the current node or all children if it's expanded.
     * @param active The new state
     * @param config A TreeConfig which affects which nodes are selectable.
     */
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

    /**
     * Updates the display state for all children.
     * @param visible The display state for all children.
     */
    setVisibleForChildren(visible: DisplayState) {
        if (this.nodes !== undefined) {
            this.nodes.forEach(node => {
                node.visible = visible;
                node.setVisibleForChildren(visible);
            });
        }
    }

    /**
     * Computes the selection state of the TreeNode.
     * @param clear Clears the cache if true.
     */
    getSelectionState(clear?: boolean): SelectionState {
        if (clear === true || this._selectionState === undefined) {
            if (this.active) {
                this._selectionState = SelectionState.checked;
            } else if (this.expanded === true && this.nodes !== undefined && this.visible !== DisplayState.invisible) {
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

    /**
     * Get a string representation of the TreeNode.
     */
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

    /**
     * Clones a TreeNode. The parent will be undefined.
     * @param recursive Also clone the children?
     */
    clone(recursive?: boolean): TreeNode {
        let clone = new TreeNode(this.id, this.name, undefined, this.active, this.expanded);
        if (recursive === true && this.nodes !== undefined) {
            clone.nodes = new Map();
            this.nodes.forEach(node => clone.nodes!.set(node.id, node.clone(recursive)));
        }

        return clone;
    }
}

export default TreeNode;
