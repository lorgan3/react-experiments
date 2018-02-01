import * as React from 'react';
import TreeView, { Props } from './TreeView';

interface State extends React.ClassAttributes<SearchableTree> {
    search: string;
}

class SearchableTree extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            search: ''
        };
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            search: e.target.value
        });
    }

    render() {
        return (
            <>
            <input onChange={this.onChange} value={this.state.search} />
            <TreeView {...this.props} search={this.state.search} />
            </>
        );
    }
}

export default SearchableTree;
