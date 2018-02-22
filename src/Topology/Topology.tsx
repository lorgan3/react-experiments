import '../css/Topology.css';
import * as React from 'react';
import TopologyNode from '../data/TopologyNode';

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
        let percent = angle % 360 / 360;
        let totalWeight = 0;
        for (let i = 0; i < this.weights.length; i++) {
            totalWeight += this.weights[i];

            if (totalWeight >= percent) {
                let node = this.groups![i].splice(0, 1)[0];

                if (node !== undefined) {
                    this.remaining--;
                    return node;
                }

                // Check the next group if it would be skipped next step.
                if (totalWeight + this.weights[(i + 1) % this.weights.length] > percent + step) {
                    return null;
                } else if (i >= this.weights.length) {
                    i = 0;
                }
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
            // Add one more fallback layer
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

    renderNode(node: TopologyNode, rot: number, len: number, lineProps: { [key: string]: string }) {
        return (
            <g key={node.id} className="topology-spoke" style={{ transform: `rotate(${rot}deg)` }}>
                <line {...lineProps} x1={0} y1={0} x2={len} y2={0.01} strokeWidth={3} />
                <circle cx={len} cy={0} r={12} fill={node.color} />
                {/* <text x={len - 10} y={0}>{node.id}</text> */}
            </g>
        );
    }

    renderLayers(node: TopologyNode) {
        let children: Array<JSX.Element> = [];

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

                if (layer >= this.measurement.layers) {
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

                children.push(this.renderNode(choice, rotation, radius, lineProps));
            }

            rotation += stepSize;
            traversedRotation += stepSize;
        }

        // In order to have the nodes not overlap return children.reverse().
        // This causes the css transitions to not work because the order in the DOM is different...
        // If you want the nodes not to overlap and still keep the transitions first render the spokes and then the node using 2 loops / arrays.
        return children.sort((a, b) => a.key! > b.key! ? -1 : 1);
    }

    render() {
        return (
            <g className="topology" style={{ transform: `translate(${this.props.x + this.measurement.size}px, ${this.props.y + this.measurement.size}px)` }}>
                {...this.renderLayers(this.props.topology)}
                <circle className="center" cx={0} cy={0} r={20} fill={this.props.topology.color} />
            </g>
        );
    }
}