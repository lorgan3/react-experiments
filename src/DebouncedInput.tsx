import * as React from 'react';
const debounce = require('debounce');

interface State extends React.ClassAttributes<DebouncedInput> {
    value: string;
    loading: boolean;
}

// TODO: find figure out the correct interface to extend from...
// interface Props extends React.ClassAttributes<DebouncedInput> {
//     debounce: number;
//     onChange: (value: string) => void | Promise<void>;
//     value?: string;
// }

/**
 * An input field with a debounced change callback and shows a loader
 * until the debounce ends and the change callback resolves.
 */
export default class DebouncedInput extends React.Component<any, State> {
    value: string;
    debouncedFn: () => Promise<void>;

    constructor(props: any) {
        super(props);

        this.state = {
            value: props.value || '',
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
        let { value, debounce, onChange, children, ...props} = this.props;
        return (
            <div className="debounced-input">
                <input {...props} onChange={this.onChange} value={this.state.value} />
                {this.state.loading === true ? <i className="fa fa-fw fa-spin fa-spinner" /> : <i className="fa fa-fw" />}
            </div>
        );
    }
}
