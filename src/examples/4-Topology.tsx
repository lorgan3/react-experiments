import * as React from 'react';
import TopologyArea from '../topology/TopologyArea';
import DebouncedInput from '../DebouncedInput';
import { TopologyStyle } from '../topology/Topology';
import TopologyNode from '../data/TopologyNode';

type checkboxId = 'sort' | 'detail' | 'animate';
interface State extends React.ClassAttributes<TopologyArea> {
    nodes: Array<TopologyNode>;
    maxSize: number;
    amount: number;
    style: TopologyStyle;
    bools: {
        [k in checkboxId]: boolean
    };
}

export class Example extends React.Component<{}, State> {
    interval: number;

    constructor(props: {}) {
        super(props);

        this.state = {
            nodes: this.getNodes(10, 3),
            maxSize: 10,
            amount: 3,
            style: TopologyStyle.filled,
            bools: {
                sort: false,
                detail: true,
                animate: false
            }
        };
    }

    componentDidMount() {
        this.interval = window.setInterval(this.animate, 500);
    }

    componentWillUnmount() {
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

    /**
     * Add a random amount of nodes.
     * Remove a random amount of nodes.
     * Change the details for a random amount of nodes.
     */
    animate = () => {
        if (this.state.bools.animate === false) {
            return;
        }

        let amount = Math.floor(Math.random() * 20);
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

    onSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(e.target.value);
        this.setState({
            maxSize: value,
            nodes: this.getNodes(value, this.state.amount)
        });
    }

    onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(e.target.value);
        this.setState({
            amount: value,
            nodes: this.getNodes(this.state.maxSize, value)
        });
    }

    onStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({
            style: e.target.selectedOptions[0].id as TopologyStyle
        });
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let bools = { ...this.state.bools };
        bools[e.target.id as checkboxId] = e.target.checked;
        this.setState({ bools });
    }

    render() {
        const { nodes, style, bools } = this.state;
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
                        <input type="checkbox" id="sort" onChange={this.onChange} checked={this.state.bools.sort} />
                    </dd>

                    <dt><label htmlFor="detail">Detail:</label></dt>
                    <dd>
                        <input type="checkbox" id="detail" onChange={this.onChange} checked={this.state.bools.detail} />
                    </dd>

                    <dt><label htmlFor="animate">Animate:</label></dt>
                    <dd>
                        <input type="checkbox" id="animate" onChange={this.onChange} checked={this.state.bools.animate} />
                    </dd>
                </dl>

                <TopologyArea nodes={nodes} style={style} {...bools} />
            </>
        );
    }
}
