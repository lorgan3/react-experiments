const debounce = require('debounce');
import * as React from 'react';
import DebouncedInput from '../DebouncedInput';
import Topology, { TopologyStyle, RadialMeasurement, Props as TopologyProps } from './Topology';
import TopologyNode from '../data/TopologyNode';

interface State extends React.ClassAttributes<TopologyArea> {
    maxSize: number;
    amount: number;
    style: TopologyStyle;
    sort: boolean;
    detail: boolean;
    animate: boolean;
    width: number;
    nodes: Array<TopologyNode>;
    [name: string]: any; // Probably not a good solution, but this allows me to reuse the onChange methods for multiple properties.
}

interface Props extends React.ClassAttributes<TopologyArea> {
    maxSize?: number;
    amount?: number;
    style?: TopologyStyle;
    sort?: boolean;
    animate?: boolean;
    detail?: boolean;
}

export default class TopologyArea extends React.PureComponent<Props, State> {
    debouncedResize: () => void;
    interval: number;

    constructor(props: Props) {
        super(props);

        this.state = {
            maxSize: props.maxSize || 5,
            amount: props.amount || 3,
            style: props.style || TopologyStyle.filled,
            sort: props.sort !== undefined ? props.sort : true,
            animate: props.animate || false,
            detail: props.detail !== undefined ? props.detail : true,
            width: window.innerWidth,
            nodes: this.getNodes(props.maxSize || 5, props.amount || 3),
        };

        this.debouncedResize = debounce(
            () => {
                this.setState({
                    width: window.innerWidth
                });
            },
            50
        );
    }

    componentDidMount() {
        window.addEventListener('resize', this.debouncedResize);
        this.interval = window.setInterval(this.animate, 500);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.debouncedResize);
        window.clearInterval(this.interval);
    }

    getNodes(maxSize: number, amount: number) {
        let nodes: Array<TopologyNode> = [];

        let seed = 1;
        function random() {
            let x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        }

        let id = 1;
        for (let i = 0; i < amount; i++) {
            id = i * 100000;  // So the ids remain the same per topology.
            let size = Math.floor(random() * maxSize + 1);
            let topologyNode = new TopologyNode(id++, undefined, []);
            for (let j = 0; j < size; j++) {
                topologyNode.nodes!.push(new TopologyNode(id++, topologyNode));
            }
            nodes.push(topologyNode);
        }

        return nodes;
    }

    onSizeChange = (value: string) => {
        this.setState({
            maxSize: Number(value),
            nodes: this.getNodes(Number(value), this.state.amount)
        });
    }

    onAmountChange = (value: string) => {
        this.setState({
            amount: Number(value),
            nodes: this.getNodes(this.state.maxSize, Number(value))
        });
    }

    onStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({
            style: e.target.selectedOptions[0].id as TopologyStyle
        });
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            [e.target.id]: e.target.checked
        });
    }

    onAnimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            animate: e.target.checked
        });
    }

    groupFn(nodes: Array<TopologyNode>) {
        let groups: { [key: string]: Array<TopologyNode> } = {};
        nodes.forEach(child => {
            if (groups[child.color] === undefined) {
                groups[child.color] = [];
            }

            groups[child.color].push(child);
        });

        return Object.values(groups).sort((a, b) => a[0].color.localeCompare(b[0].color));
    }

    /**
     * Add a random amount of nodes.
     * Remove a random amount of nodes.
     * Change the details for a random amount of nodes.
     */
    animate = () => {
        if (this.state.animate === false) {
            return;
        }

        let amount = Math.floor(Math.random() * this.state.maxSize * this.state.amount);
        let nodes = [...this.state.nodes];
        for (let i = 0; i < amount; i++) {
            let action = Math.random() * 100;
            let parentNode = nodes[Math.floor(Math.random() * nodes.length)];

            if (action < 0.5) {
                let id = nodes.length > 0 ? nodes[nodes.length - 1].id : 0;
                nodes.push(new TopologyNode(id + 10001, undefined, []));
            } else if (action < 1) {
                nodes.splice(Math.floor(Math.random() * nodes.length), 1);
            } else if (action < 6) {
                parentNode.nodes!.splice(Math.floor(Math.random() * parentNode.nodes!.length), 1);
            } else if (action < 30) {
                let id = parentNode.nodes!.length > 0 ? parentNode.nodes![parentNode.nodes!.length - 1].id : parentNode.id;
                parentNode.nodes!.push(new TopologyNode(id + 1, parentNode));
            } else {
                let node = parentNode.nodes![Math.floor(Math.random() * parentNode.nodes!.length)];
                if (node !== undefined) {
                    node.leftDetail = Math.max(0, Math.min(100, node.leftDetail + Math.random() * 100 - 50));
                    node.rightDetail = Math.max(0, Math.min(100, node.rightDetail + Math.random() * 100 - 50));
                }
            }
        }

        this.setState({
            nodes
        });
    }

    render() {
        let children: Array<JSX.Element> = [];
        let topologyProps: Array<TopologyProps> = [];
        let colors = new Set<string>();

        let maxX = 0;
        let maxSize = 0;
        let x = 0;
        let y = 0;

        let flush = (measurement?: RadialMeasurement) => {
            maxX = Math.max(maxX, x);
            x = 0;

            topologyProps.forEach(props => {
                props.y += maxSize + y;
                children.push(<Topology detailed={this.state.detail} {...props} groupFn={this.state.sort ? this.groupFn : undefined} />);
            });

            if (measurement !== undefined) {
                y += maxSize * 2;
            }

            topologyProps.length = 0;
            maxSize = 0;
        };

        let measurement: RadialMeasurement | undefined = undefined;
        for (let i = 0; i < this.state.nodes.length; i++) {
            const node = this.state.nodes[i];
            node.nodes!.forEach(node => colors.add(node.color));
            measurement = new RadialMeasurement(node, !this.state.sort);
            if (topologyProps.length > 0 && x + measurement.size * 2 > window.innerWidth) {
                flush(measurement);
            }

            topologyProps.push({
                x: x,
                y: -measurement.size,
                style: this.state.style,
                topology: node,
                key: node.id
            });

            maxSize = Math.max(maxSize, measurement.size);
            x += measurement.size * 2;
        }

        flush(measurement);

        let defs: Array<JSX.Element> = [];
        if (this.state.style === TopologyStyle.gradient) {
            colors.forEach(color => {
                defs.push((
                    <linearGradient id={`${color}-gradient`} key={color}>
                        <stop offset="0" stopColor={color} stopOpacity={0} />
                        <stop offset="1" stopColor={color} />
                    </linearGradient>
                ));
            });
        }

        return (
            <>
                <dl className="ui">
                    <dt><label htmlFor="maxSize">Max # nodes:</label></dt>
                    <dd><DebouncedInput id="maxSize" type="number" debounce={200} onChange={this.onSizeChange} value={this.state.maxSize} /></dd>

                    <dt><label htmlFor="amount"># topologies:</label></dt>
                    <dd><DebouncedInput id="amount" type="number" debounce={200} onChange={this.onAmountChange} value={this.state.amount} /></dd>

                    <dt><label htmlFor="style">Style:</label></dt>
                    <dd>
                        <select id="style" onChange={this.onStyleChange} value={TopologyStyle[this.state.style]}>
                            {Object.entries(TopologyStyle).map(([key, value]) => <option id={value} key={key}>{key}</option>)}
                        </select>
                    </dd>

                    <dt><label htmlFor="sort">Group:</label></dt>
                    <dd>
                        <input type="checkbox" id="sort" onChange={this.onChange} checked={this.state.sort} />
                    </dd>

                    <dt><label htmlFor="detail">Detail:</label></dt>
                    <dd>
                        <input type="checkbox" id="detail" onChange={this.onChange} checked={this.state.detail} />
                    </dd>

                    <dt><label htmlFor="animate">Animate:</label></dt>
                    <dd>
                        <input type="checkbox" id="animate" onChange={this.onChange} checked={this.state.animate} />
                    </dd>
                </dl>

                <svg className="topology-holder" width={maxX} height={y}>
                    <defs>
                        {...defs}
                    </defs>
                    {...children}
                </svg>
            </>
        );
    }
}
