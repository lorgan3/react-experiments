import '../css/TreeView.css';
import * as React from 'react';
import TreeConfig from '../data/TreeConfig';
import TreeNode, { SelectionState, DisplayState } from '../data/TreeNode';

export interface Props extends React.ClassAttributes<TreeView> {
    node: TreeNode;
    config: TreeConfig;
    updateState?: (pathToRoot: Array<TreeNode>) => void;
    pathToRoot?: Array<TreeNode>;
    truncate?: boolean;
    className?: string;
}

export default class TreeView extends React.Component<Props, {}> {
    pathToRoot?: Array<TreeNode>;

    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    shouldComponentUpdate(nextProps: Props, nextState: {}): boolean {
        return (nextProps.pathToRoot === undefined || nextProps.pathToRoot.includes(this.props.node));
    }

    componentDidUpdate() {
        this.pathToRoot = undefined;
    }

    updateState = (pathToRoot: Array<TreeNode>): void => {
        if (this.props.updateState !== undefined) {
            this.props.updateState(pathToRoot);
        } else {
            // Mark every node as dirty.
            pathToRoot.forEach(node => node.dirty());

            this.pathToRoot = pathToRoot;
            this.setState({});
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
            return <div {...otherProps} className="fa tree-icon" />;
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
            nodes = nodes.filter(child => child.visible !== DisplayState.invisible);
            nodes = config.sort !== undefined ? nodes.sort(config.sort) : nodes;

            nodes.forEach(child => children.push(<li key={child.id}><TreeView node={child} config={config} updateState={this.props.updateState || this.updateState} pathToRoot={this.pathToRoot || this.props.pathToRoot} /></li>));
            subView = node.expanded === true && children.length > 0 ? <ul className="tree">{children}</ul> : <></>;
        }

        let className = this.props.node.isSelectable(this.props.config) ? 'pointer' : 'disabled';
        className += ' tree-head';

        let nameClass = (this.props.node.visible === DisplayState.relevant ? 'tree-node bold' : 'tree-node');
        let name;
        if (node.name.length < 10) {
            name = node.name;
        } else {
            name = (
                <span className={'truncate-middle'}>
                    <span>{node.name.substr(0, node.name.length - 8)}</span>
                    <span>{node.name.substr(node.name.length - 8)}</span>
                </span>
            );
        }

        let customActions;
        if (config.customActions !== undefined) {
            customActions = config.customActions(node);
        }

        return (
            <div className={className + ' ' + (this.props.className || '')}>
                {
                    node.parent !== undefined || config.showRoot === true ?
                        <span className={nameClass} onClick={this.handleActivate} onMouseDown={this.handleMouseDown}>{this.renderExpandIcon({ onClick: this.handleExpand })} {this.renderSelectionIcon()} {name}{customActions}</span> :
                        <></>
                }
                {subView}
            </div>
        );
    }
}
