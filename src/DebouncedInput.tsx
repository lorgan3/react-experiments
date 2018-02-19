import * as React from 'react';
const debounce = require('debounce');

interface State extends React.ClassAttributes<DebouncedInput> {
    value: string;
    loading: boolean;
}

interface Props extends React.ClassAttributes<DebouncedInput> {
    debounce: number;
    onChange: (value: string) => void | Promise<void>;
}

/**
 * An input field with a debounced change callback and shows a loader
 * until the debounce ends and the change callback resolves.
 */
class DebouncedInput extends React.Component<Props, State> {
    value: string;
    debouncedFn: () => Promise<void>;

    constructor(props: Props) {
        super(props);

        this.state = {
            value: '',
            loading: false
        };

        this.debouncedFn = debounce(
            async () => {
                await this.props.onChange(this.state.value);

                this.setState({
                    loading: false
                });
            },
            props.debounce
        );
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.value = e.target.value;
        this.setState({
            value: this.value,
            loading: true
        });

        this.debouncedFn();
    }

    render() {
        return (
            <div className="debounced-input">
                <input onChange={this.onChange} value={this.state.value} />
                {this.state.loading === true ? <i className="fa fa-fw fa-spin fa-spinner" /> : <i className="fa fa-fw" />}
            </div>
        );
    }
}

export default DebouncedInput;
