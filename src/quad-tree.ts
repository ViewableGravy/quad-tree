import { Point } from "./point";
import { Rectangle } from "./rectangle";

type QuadTreeOptions = {
  capacity: number;
}

const QUAD_CODES = {
  NODE_NOT_WITHIN_BOUNDS: "NODE_NOT_WITHIN_BOUNDS",
  SUCCESS: "SUCCESS"
}

export class QuadTree<T extends Rectangle> {
  private topRight: QuadTree<T> | null = null
  private topLeft: QuadTree<T> | null = null
  private bottomRight: QuadTree<T> | null = null
  private bottomLeft: QuadTree<T> | null = null

  public isLeaf: boolean = true;

  /**
   * Nodes are the current quads elements. If an element exists across multiple child quads after subdivision, it
   * will be stored in this quads nodes rather than being passed down to the children.
   */
  public nodes: Array<T> = []

  constructor(
    public rect: Rectangle, 
    private capacity: number,
    private isRoot: boolean = false
  ) {}

  public insert(node: T | Array<T>, force?: boolean) {
    if (Array.isArray(node)) {
      for (const n of node) {
        this.insert(n);
      }
      return;
    }

    if (!this.rect.intersects(node)) {
      return QUAD_CODES.NODE_NOT_WITHIN_BOUNDS;
    }

    if (force || this.nodes.length < this.capacity) {
      return this.nodes.push(node)
    }

    this.subdivide();

    // Push node to this tree if it intersects more than 1 child
    if (this.childIntersections(node) > 1) {
      return this.nodes.push(node);
    }

    this.topRight!.insert(node)
    this.topLeft!.insert(node)
    this.bottomRight!.insert(node)
    this.bottomLeft!.insert(node)
  }

  public retrieve(from: Rectangle | Point, logging: boolean = false): Array<T> {
    if (from instanceof Point) {
      if (!this.rect.contains(from)) {
        return [];
      }
    }

    if (from instanceof Rectangle) {
      if (!this.rect.intersects(from)) {
        return [];
      }
    }

    if (logging) {
      if (this.nodes.length) {
        console.log(
          "Retrieving from", 
          `${this.rect.x},${this.rect.y}: ${this.rect.width}x${this.rect.height}`, 
          "with", 
          this.nodes.length, 
          "nodes"
        );
      } else {
        console.log(
          "Retrieving from", 
          `${this.rect.x},${this.rect.y}: ${this.rect.width}x${this.rect.height}`, 
          "with no nodes",
          "trying children"
        )
      }
    }

    return [
      ...this.nodes,
      ...this.topRight?.retrieve(from, logging) || [],
      ...this.topLeft?.retrieve(from, logging) || [],
      ...this.bottomRight?.retrieve(from, logging) || [],
      ...this.bottomLeft?.retrieve(from, logging) || []
    ]
  }

  private subdivide() {
    const { x, y, height, width } = this.rect;

    if (this.topLeft && this.topRight && this.bottomLeft && this.bottomRight) {
      return;
    }

    this.topLeft = new QuadTree(
      new Rectangle(
        x - (width / 4),
        y - (height / 4),
        width / 2,
        height / 2
      ),
      this.capacity
    );

    this.topRight = new QuadTree(
      new Rectangle(
        x + (width / 4),
        y - (height / 4),
        width / 2,
        height / 2
      ),
      this.capacity
    );

    this.bottomLeft = new QuadTree(
      new Rectangle(
        x - (width / 4),
        y + (height / 4),
        width / 2,
        height / 2
      ),
      this.capacity
    );

    this.bottomRight = new QuadTree(
      new Rectangle(
        x + (width / 4),
        y + (height / 4),
        width / 2,
        height / 2
      ),
      this.capacity
    );

    // Once we have children, we are no longer a leaf node
    this.isLeaf = false;

    // New Array to push nodes to that aren't going into children
    const newNodes = [];

    for (const node of this.nodes) {
      // If node intersects more than 1 child, store it in this node instead
      if (this.childIntersections(node) > 1) {
        newNodes.push(node);
        continue;
      }

      // If we aren't storing in this node then insert into relevant child node
      this.topRight.insert(node, true)
      this.topLeft.insert(node, true)
      this.bottomRight.insert(node, true)
      this.bottomLeft.insert(node, true)
    }

    this.nodes = newNodes;
  }

  private childIntersections(node: T) {
    const intersections = [
      this.topLeft!.rect.intersects(node),
      this.topRight!.rect.intersects(node),
      this.bottomLeft!.rect.intersects(node),
      this.bottomRight!.rect.intersects(node)
    ]
    
    return intersections.filter(Boolean).length;
  }
}