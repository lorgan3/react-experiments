import * as React from 'react';
import TreeView, { Props as baseProps } from './TreeView';
const debounce = require('debounce');

interface State extends React.ClassAttributes<SearchableTree> {
    search: string;
}

interface Props extends baseProps {
    debounce?: number;
}

class SearchableTree extends React.Component<Props, State> {
    search: string;
    debouncedFn: () => void;

    constructor(props: Props) {
        super(props);

        this.state = {
            search: ''
        };

        this.debouncedFn = debounce(
            async () => {
                await this.props.node.handleSearch(this.search, this.props.config);

                // Update state after finishing the search.
                this.setState({
                    search: this.search
                });
            },
            props.debounce || 0
        );

    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.search = e.target.value;

        // Todo: have a loader here.
        // await this.props.node.handleSearch(search, this.props.config);
        this.debouncedFn();

        this.setState({
            search: this.search
        });
    }

    render() {
        return (
            <>
            <input onChange={this.onChange} value={this.state.search} />
            <TreeView {...this.props} />
            </>
        );
    }
}

export default SearchableTree;
