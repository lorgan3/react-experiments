import * as React from 'react';
import TreeView, { Props as baseProps } from './TreeView';
import DebouncedInput from '../DebouncedInput';

interface Props extends baseProps {
    debounce?: number;
}

class SearchableTree extends React.Component<Props, {}> {
    search: string;
    debouncedFn: () => void;

    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    onChange = async (value: string) => {
        await this.props.node.handleSearch(value, this.props.config);

        // Update state after finishing the search.
        this.setState({});
    }

    render() {
        const { debounce, ...remainingProps } = this.props;
        return (
            <>
            <DebouncedInput onChange={this.onChange} debounce={debounce || 0} />
            <TreeView {...remainingProps} />
            </>
        );
    }
}

export default SearchableTree;
