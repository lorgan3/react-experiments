import * as React from 'react';
import TreeNode, { SelectionState } from './data/TreeNode';
import TreeConfig from './data/TreeConfig';

interface Props extends React.ClassAttributes<TreeView> {
    node: TreeNode;
    config: TreeConfig;
    updateState?: (pathToRoot: Array<TreeNode>) => void;
    pathToRoot?: Array<TreeNode>;
}

interface State extends React.ClassAttributes<TreeView> {
    pathToRoot?: Array<TreeNode>;
}

class TreeView extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        return nextProps.pathToRoot === undefined || nextProps.pathToRoot.includes(this.props.node);
    }

    updateState = (pathToRoot: Array<TreeNode>): void => {
        if (this.props.updateState !== undefined) {
            this.props.updateState(pathToRoot);
        } else {
            // Mark every node as dirty.
            pathToRoot.forEach(node => node.dirty());

            this.setState({
                pathToRoot: pathToRoot
            });
        }
    }

    handleExpand = (e: React.MouseEvent<HTMLSpanElement>): void => {
        if (this.props.node.isExpandable(this.props.config)) {
            e.stopPropagation();
            let nodes = this.props.node.handleExpand(this.props.config, e.shiftKey, this.updateState);
            nodes = nodes.concat(this.props.node.getPathToRoot());
            this.updateState(nodes);
        }
    }

    handleActivate = (e: React.MouseEvent<HTMLSpanElement>): void => {
        if (this.props.node.isSelectable(this.props.config)) {
            e.stopPropagation();

            let nodes = this.props.node.handleActivate(this.props.config, e.shiftKey, this.updateState);
            nodes = nodes.concat(this.props.node.getPathToRoot());
            this.updateState(nodes);
        }
    }

    handleMouseDown = (e: React.MouseEvent<HTMLSpanElement>): void => {
        // Prevent accidental highlighting while pressing shift.
        if (e.shiftKey === true) {
            e.preventDefault();
        }
    }

    renderExpandIcon(props?: any): JSX.Element {
        const { onClick, ...otherProps } = props;
        if (this.props.node.isExpandable(this.props.config)) {
            if (this.props.node.expanded === true) {
                if (this.props.node.nodes === undefined) {
                    return <i {...otherProps} className="fa tree-icon fa-spin fa-spinner disabled" />;
                } else {
                    return <i {...otherProps} onClick={onClick} className="fa tree-icon fa-chevron-right r90 pointer" />;
                }
            } else {
                return <i {...otherProps} onClick={onClick} className="fa tree-icon fa-chevron-right pointer" />;
            }
        } else {
            return <div {...otherProps} className="tree-icon" />;
        }
    }

    renderSelectionIcon(props?: Object): JSX.Element {
        switch (this.props.node.getSelectionState()) {
            case SelectionState.checked:
                return <i {...props} className="fa tree-icon fa-check-square" />;

            case SelectionState.indeterminate:
                return <i {...props} className="fa tree-icon fa-square" />;

            case SelectionState.unchecked:
            default:
                return <i {...props} className="fa tree-icon fa-square-o" />;
        }
    }

    render(): JSX.Element {
        const node = this.props.node;
        const config = this.props.config;

        let subView: JSX.Element = <></>;
        if (node.expanded === true && node.nodes !== undefined && node.nodes.size > 0) {
            let children: Array<JSX.Element> = [];
            let nodes = config.filter !== undefined ? [...node.nodes.values()].filter(config.filter) : [...node.nodes.values()];
            nodes = config.sort !== undefined ? nodes.sort(config.sort) : nodes;

            nodes.forEach(child => children.push(<li key={child.id}><TreeView node={child} config={config} updateState={this.props.updateState || this.updateState} pathToRoot={this.state.pathToRoot || this.props.pathToRoot} /></li>));
            subView = node.expanded === true && children.length > 0 ? <ul className="tree">{children}</ul> : <></>;
        }

        return (
            <div className={this.props.node.isSelectable(this.props.config) ? 'pointer' : 'disabled'}>
                {
                    node.parent !== undefined || config.showRoot === true ?
                        <span onClick={this.handleActivate} onMouseDown={this.handleMouseDown}>{this.renderExpandIcon({ onClick: this.handleExpand })} {this.renderSelectionIcon()} {node.name}</span> :
                        <></>
                }
                {subView}
            </div>
        );
    }
}

export default TreeView;
