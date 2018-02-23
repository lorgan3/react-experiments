const debounce = require('debounce');
import * as React from 'react';
import Topology, { TopologyStyle, RadialMeasurement, Props as TopologyProps } from './Topology';
import TopologyNode from '../data/TopologyNode';

interface State extends React.ClassAttributes<TopologyArea> {
    width: number;
}

interface Props extends React.ClassAttributes<TopologyArea> {
    nodes: Array<TopologyNode>;
    style?: TopologyStyle;
    sort?: boolean;
    animate?: boolean;
    detail?: boolean;
}

export default class TopologyArea extends React.PureComponent<Props, State> {
    debouncedResize: () => void;
    ref: Element;

    constructor(props: Props) {
        super(props);

        this.state = {
            width: 0,
        };

        this.debouncedResize = debounce(
            () => {
                this.setState({
                    width: (this.ref.parentNode as HTMLElement).clientWidth
                });
            },
            50
        );
    }

    componentDidMount() {
        this.setState({
            width: (this.ref.parentNode as HTMLElement).clientWidth
        });

        window.addEventListener('resize', this.debouncedResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.debouncedResize);
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
        let defs: Array<JSX.Element> = [];

        let maxX = 0;
        let maxSize = 0;
        let x = 0;
        let y = 0;

        if (this.state.width === 0) {
            return <div ref={div => { this.ref = div!; }} />;
        }

        let flush = (measurement?: RadialMeasurement) => {
            maxX = Math.max(maxX, x);
            x = 0;

            topologyProps.forEach(props => {
                props.y += maxSize + y;
                children.push(<Topology detailed={this.props.detail} {...props} groupFn={this.props.sort ? this.groupFn : undefined} />);
            });

            if (measurement !== undefined) {
                y += maxSize * 2;
            }

            topologyProps.length = 0;
            maxSize = 0;
        };

        let measurement: RadialMeasurement | undefined = undefined;
        for (let i = 0; i < this.props.nodes.length; i++) {
            const node = this.props.nodes[i];
            node.nodes!.forEach(node => colors.add(node.color));
            measurement = new RadialMeasurement(node, !this.props.sort);
            if (topologyProps.length > 0 && x + measurement.size * 2 > this.state.width) {
                flush(measurement);
            }

            topologyProps.push({
                x: x,
                y: -measurement.size,
                style: this.props.style,
                topology: node,
                key: node.id
            });

            maxSize = Math.max(maxSize, measurement.size);
            x += measurement.size * 2;
        }

        flush(measurement);

        if (this.props.style === TopologyStyle.gradient) {
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
            <svg ref={svg => { this.ref = svg!; }} className="topology-holder" width={maxX} height={y}>
                <defs>
                    {...defs}
                </defs>
                {...children}
            </svg>
        );
    }
}
