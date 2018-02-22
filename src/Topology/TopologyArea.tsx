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
    width: number;
    nodes: Array<TopologyNode>;
}

interface Props extends React.ClassAttributes<TopologyArea> {
    nodes: Array<TopologyNode>;
}

export default class TopologyArea extends React.PureComponent<Props, State> {
    debouncedResize: () => void;

    constructor(props: { nodes: Array<TopologyNode> }) {
        super(props);

        this.state = {
            maxSize: 5,
            amount: 3,
            style: TopologyStyle.filled,
            sort: true,
            width: window.innerWidth,
            nodes: this.getNodes(5, 3)
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
    }

    componentWillMount() {
        window.removeEventListener('resize', this.debouncedResize);
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

    onSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            sort: e.target.checked
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
                children.push(<Topology {...props} groupFn={this.state.sort ? this.groupFn : undefined} />);
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
                <dl className="fixed-ui">
                    <dt><label htmlFor="maxSize">Maximum amount of nodes:</label></dt>
                    <dd><DebouncedInput id="maxSize" type="number" debounce={200} onChange={this.onSizeChange} value={this.state.maxSize} /></dd>

                    <dt><label htmlFor="amount">Amount of topologies:</label></dt>
                    <dd><DebouncedInput id="amount" type="number" debounce={200} onChange={this.onAmountChange} value={this.state.amount} /></dd>

                    <dt><label htmlFor="style">Line style:</label></dt>
                    <dd>
                        <select id="style" onChange={this.onStyleChange} value={TopologyStyle[this.state.style]}>
                            {Object.entries(TopologyStyle).map(([key, value]) => <option id={value} key={key}>{key}</option>)}
                        </select>
                    </dd>

                    <dt><label htmlFor="sort">Group nodes:</label></dt>
                    <dd>
                        <input type="checkbox" id="sort" onChange={this.onSortChange} checked={this.state.sort} />
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
