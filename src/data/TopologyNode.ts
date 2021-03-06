const colors = ['#e6194b', '#3cb44b', '#ffe119', '#0082c8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#d2f53c', '#fabebe', '#008080', '#e6beff', '#aa6e28', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000080', '#808080', '#EEEEEE', '#000000' ];

class TopologyNode {
    color: string;
    leftDetail: number;
    rightDetail: number;

    constructor(public id: number, public parent?: TopologyNode, public nodes?: Array<TopologyNode>) {
        this.color = colors[this.id % 7];
        this.leftDetail = (this.id * this.id + 23) % 100;
        this.rightDetail = (this.id * 12.569 + 70) % 100;
    }
}

export default TopologyNode;
