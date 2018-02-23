const debounce = require('debounce');
import './css/DebouncedInput.css';
import * as React from 'react';

interface State extends React.ClassAttributes<DebouncedInput> {
    value: string;
    loading: boolean;
}

interface Props extends React.ClassAttributes<DebouncedInput> {
    debounce: number;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}

/**
 * An input field with a debounced change callback and shows a loader
 * until the debounce ends and the change callback resolves.
 */
export default class DebouncedInput extends React.Component<Props & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, State> {
    value: string;
    debouncedFn: () => Promise<void>;
    event: React.ChangeEvent<HTMLInputElement>;

    constructor(props: any) {
        super(props);

        this.state = {
            value: props.value || '',
            loading: false
        };

        this.debouncedFn = debounce(
            async () => {
                await this.props.onChange(this.event);

                this.setState({
                    loading: false
                });
            },
            props.debounce
        );
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.persist();
        this.event = e;
        this.value = e.target.value;
        this.setState({
            value: this.value,
            loading: true
        });

        this.debouncedFn();
    }

    render() {
        let { value, debounce, onChange, ...props} = this.props;
        return (
            <div className="debounced-input">
                <input {...props} onChange={this.onChange} value={this.state.value} />
                {this.state.loading === true ? <i className="fa fa-fw fa-spin fa-spinner" /> : <i className="fa fa-fw" />}
            </div>
        );
    }
}
