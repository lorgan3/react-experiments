import '../css/Topology.css';
import * as React from 'react';
import TopologyNode from '../data/TopologyNode';
import { transform } from '../SvgTransformToProps';

export enum TopologyStyle {
    filled = 'FILLED',
    dashed = 'DASHED',
    gradient = 'GRADIENT'
}

/**
 * Helper class to sort an array into groups radially.
 */
export class RadialGroupPicker<T> {
    groups: Array<Array<T>>;
    weights: Array<number>;
    remaining: number;

    /**
     * @param nodes The nodes that need to be grouped radially3.
     * @param steps The amount of steps that will be used for a full rotation. Used to combine groups if there are more groups than steps.
     * @param groupFn A function to group the nodes. Leave undefined to just hand out the nodes in order.
     */
    constructor(nodes: Array<T>, steps: number, groupFn?: (nodes: Array<T>) => Array<Array<T>>) {
        if (groupFn !== undefined) {
            this.groups = groupFn(nodes);
        } else {
            this.groups = [nodes.slice()];
        }

        this.weights = this.groups.map(arr => arr.length / nodes.length);
        this.remaining = nodes.length;
    }

    /**
     * Pick a node for a given angle. Returns null if there are no more valid nodes for this angle.
     * @param angle The angle [0-360] to pick a node for.
     * @param step The step size.
     */
    pick(angle: number, step: number): T | null {
        angle %= 360;
        let totalWeight = 0;
        let firstMatch: Array<T> | undefined;
        let options: Array<Array<T>> = [];
        for (let i = 0; i < this.weights.length; i++) {
            if (angle > totalWeight - step && angle <= totalWeight + step) {
                options.push(this.groups[i]);
            }

            if (firstMatch === undefined && (totalWeight >= angle || totalWeight + this.weights[i] * 360 >= angle)) {
                firstMatch = this.groups[i];
            }
            totalWeight += this.weights[i] * 360;
        }

        // Exact matches take precedence, otherwise take the group with the most nodes.
        let choice = (firstMatch !== undefined && firstMatch.length > 0) ? firstMatch : options.sort((a, b) => b.length - a.length)[0];
        if (choice !== undefined) {
            let node = choice.splice(0, 1)[0];
            if (node !== undefined) {
                this.remaining--;
                return node;
            }
        }

        return null;
    }

    /**
     * Getter to check if there are still nodes that need to be picked.
     */
    get done() {
        return this.remaining === 0;
    }
}

/**
 * Helper class to measure the size of a topology.
 */
export class RadialMeasurement {
    layers: number = 0;
    _nodesPerLayer: Array<number> = [];

    /**
     * @param nodes The amount of nodes in the topology.
     * @param exact Should the measurement be exact? An extra layer is reserved when the measurement is not exact.
     * @param initialDensity The amount of nodes on the first layer. Affects how close nodes are placed on all layers.
     * @param baseLength The radius of the first layer.
     * @param lengthIncrease The amount that the radius increases every layer.
     */
    constructor(public node: TopologyNode, public exact: boolean = false, public initialDensity: number = 10, public baseLength: number = 60, public lengthIncrease: number = 40) {
        let nodes = node.nodes!.length;
        while (nodes > 0) {
            let nodesThisLayer = Math.round(initialDensity + this.layers * Math.PI * baseLength / lengthIncrease);
            if (exact === true) {
                nodesThisLayer = Math.min(nodesThisLayer, nodes);
            }
            nodes -= nodesThisLayer;

            this._nodesPerLayer.push(nodesThisLayer);
            this.layers++;
        }

        if (exact === false) {
            // Add one more fallback layer.
            // Ideally this isn't required but my radial grouping algorithm messes up sometimes :(
            this._nodesPerLayer.push(Math.round(initialDensity + this.layers * Math.PI * baseLength / lengthIncrease));
        }
    }

    /**
     * Get the size for a topology with this amount of nodes.
     */
    get size() {
        // This formula is more correct but not changing the size when toggling exact mode looks better.
        // return this.baseLength + (this.layers + (this.exact === false ? 1 : 0)) * this.lengthIncrease;

        return this.baseLength + (this.layers + 1) * this.lengthIncrease;
    }

    /**
     * Get the most amount of steps for this topology.
     */
    get steps() {
        return this._nodesPerLayer[this.layers - 1];
    }

    /**
     * Get the amount of nodes that fit on the current layer.
     * @param layer The layer to get the amount of nodes for.
     */
    getNodesThisLayer(layer: number) {
        return this._nodesPerLayer[layer];
    }

    /**
     * Get the radius for a given layer.
     * @param layer The layer calculate the radius of.
     */
    getRadius(layer: number) {
        return this.baseLength + layer * this.lengthIncrease;
    }

    /**
     * Get the stepsize for a given layer.
     * @param layer The layer to calculate the stepsize of.
     */
    getStepSize(layer: number) {
        return 360 / this._nodesPerLayer[layer];
    }

    /**
     * Get the initial rotation for a given layer.
     * @param layer The layer to calculate the initial rotation of.
     */
    getRotation(layer: number) {
        return (this.node.id + layer) * (360 / this.initialDensity) % 360;
    }
}

export interface Props extends React.ClassAttributes<Topology> {
    topology: TopologyNode;
    x: number;
    y: number;
    detailed?: boolean;
    groupFn?: (nodes: Array<TopologyNode>) => Array<Array<TopologyNode>>;
    style?: TopologyStyle;
}

export default class Topology extends React.Component<Props, {}> {
    measurement: RadialMeasurement;

    constructor(props: Props) {
        super(props);
        this.state = {};

        this.measurement = new RadialMeasurement(props.topology, this.props.groupFn === undefined);
    }

    componentWillReceiveProps(nextProps: Props) {
        this.measurement = new RadialMeasurement(nextProps.topology, nextProps.groupFn === undefined);
    }

    renderDetail(node: TopologyNode, radius: number) {
        const circumference = 2 * Math.PI * radius;
        return this.props.detailed === true ? (
            <>
                <circle cx={0} cy={0} r={radius} className="detail" />
                <circle cx={0} cy={1} r={radius} strokeDasharray={`${node.leftDetail / 200 * circumference}, ${circumference}`}  transform="rotate(90)" className="detail detail-left" />
                <circle cx={0} cy={1} r={radius} strokeDasharray={`${node.rightDetail / 200 * circumference}, ${circumference}`} transform="rotate(90) scale(1 -1)" className="detail detail-right" />
            </>
        ) : undefined;
    }

    renderSpoke(node: TopologyNode, rot: number, len: number, lineProps: { [key: string]: string }) {
        return (
            <line
                key={node.id}
                className="topology-spoke"
                {...transform({ rotate: rot })}
                {...lineProps}
                x1={0}
                y1={0}
                x2={len}
                y2={0.01}
                strokeWidth={3}
            />
        );
    }

    renderNode(node: TopologyNode, rot: number, len: number) {
        return (
            <g key={node.id} className="topology-spoke" {...transform({ rotate: rot })}>
                <g {...transform({ translate: [len, 0], rotate: -rot })}>
                    {this.renderDetail(node, 15)}
                    <circle cx={0} cy={0} r={12} fill={node.color} />
                    {/* <text>{node.id}</text> */}
                </g>
            </g>
        );
    }

    renderLayers(node: TopologyNode) {
        let spokes: Array<JSX.Element> = [];
        let nodes: Array<JSX.Element> = [];

        let picker = new RadialGroupPicker<TopologyNode>(this.props.topology.nodes!, this.measurement.steps, this.props.groupFn);
        let traversedRotation = 360;
        let layer = -1;
        let radius = 0;
        let prevRadius = 0;
        let rotation = 0;
        let stepSize = 360;
        while (!picker.done) {
            if (Math.round(traversedRotation + stepSize) > 360) {
                layer++;

                if (layer > this.measurement.layers) {
                    console.error('overflow', layer, this.measurement, picker);
                    break;
                }

                traversedRotation = 0;
                prevRadius = radius;
                radius = this.measurement.getRadius(layer);
                rotation = this.measurement.getRotation(layer);
                stepSize = this.measurement.getStepSize(layer);
            }

            let choice = picker.pick(rotation, stepSize);
            if (choice !== null) {
                let lineProps: { [key: string]: string } = {};
                switch (this.props.style) {
                    case TopologyStyle.filled:
                        lineProps = { stroke: choice.color, strokeOpacity: '0.6' };
                        break;
                    case TopologyStyle.dashed:
                        lineProps = { stroke: choice.color, strokeOpacity: '0.6', strokeDasharray: `0, ${prevRadius}, ${radius}, ${radius}` };
                        break;
                    case TopologyStyle.gradient:
                    default:
                        lineProps = { stroke: `url(#${choice.color}-gradient)` };
                        break;
                }

                spokes.push(this.renderSpoke(choice, rotation, radius, lineProps));
                nodes.push(this.renderNode(choice, rotation, radius));
            }

            rotation += stepSize;
            traversedRotation += stepSize;
        }

        // The spokes and nodes are rendered separately so that the spokes don't overlap the nodes.
        // If you don't care about overlapping, rendering the spokes and nodes at once might be more performant.
        // Or if you don't care about the animations when grouping the nodes, render them in reverse order.
        return (
            <>
                {spokes.sort((a, b) => a.key! > b.key! ? -1 : 1)}
                {nodes.sort((a, b) => a.key! > b.key! ? -1 : 1)}
            </>
        );
    }

    render() {
        return (
            <g className="topology" {...transform({ translate: [this.props.x + this.measurement.size, this.props.y + this.measurement.size] })}>
                {this.renderLayers(this.props.topology)}
                {this.renderDetail(this.props.topology, 23)}
                <circle className="center" cx={0} cy={0} r={20} fill={this.props.topology.color} />
            </g>
        );
    }
}
