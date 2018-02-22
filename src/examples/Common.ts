import TreeNode from '../data/TreeNode';

let seed = 1;
let id = 1;

/**
 * Seeded random.
 * This not a true random number generator but plenty for my purposes.
 */
export function random() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

/**
 * Generate a tree.
 * @param parent   The parent tree.
 * @param children The amount of children to generate. Random amount when undefined.
 */
export function generateTree(parent?: TreeNode, children?: number): TreeNode {
    children = children === undefined ? Math.floor(random() * 3) : children;

    let node = new TreeNode(id++, random().toString(36).substr(2, 9).repeat(Math.floor(random() * 10 + 1)), parent);
    let nodes = new Map(new Array(children).fill(undefined).map((i, index): [number, TreeNode] => {
        let child = generateTree(node, Math.floor(index < 0 ? 0 : index / 2));
        return [child.id, child];
    }));
    node.nodes = nodes;

    return node;
}
