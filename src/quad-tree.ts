import { Point } from "./point";
import { Rectangle } from "./rectangle";

type QuadTreeOptions = {
  capacity: number;
}

const QUAD_CODES = {
  NODE_NOT_WITHIN_BOUNDS: "NODE_NOT_WITHIN_BOUNDS",
  SUCCESS: "SUCCESS"
} as const;

export class QuadTree<T extends Rectangle> {
  public topRight: QuadTree<T> | null = null
  public topLeft: QuadTree<T> | null = null
  public bottomRight: QuadTree<T> | null = null
  public bottomLeft: QuadTree<T> | null = null

  public isLeaf: boolean = true;

  /**
   * Nodes are the current quads elements. If an element exists across multiple child quads after subdivision, it
   * will be stored in this quads nodes rather than being passed down to the children.
   */
  public nodes: Array<T> = []

  constructor(
    public rect: Rectangle,
    private capacity: number = 4,
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
      if (this.isRoot) {
        this.expand(node);
        this.insert(node);
        return
      }

      return QUAD_CODES.NODE_NOT_WITHIN_BOUNDS;
    }

    const hasFreeCapacity = this.nodes.length < this.capacity;
    if (force || (hasFreeCapacity && !this.hasSubdivided())) {
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
    if (!this.isLeaf) {
      return;
    }

    this.instantiateBottomLeft(false);
    this.instantiateBottomRight(false);
    this.instantiateTopLeft(false);
    this.instantiateTopRight(false);

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
      this.topRight!.insert(node, true)
      this.topLeft!.insert(node, true)
      this.bottomRight!.insert(node, true)
      this.bottomLeft!.insert(node, true)
    }

    this.nodes = newNodes;
  }

  /**
   * This function will expand the current quad tree to be one level larger than the current quad tree. 
   * It will then recreate the current quad tree as a child of the new quad tree.
   * 
   * Note: only root quad trees can be expanded.
   */
  private expand(towards: Rectangle) {
    if (!this.isRoot) {
      return;
    }
    
    const { bottomLeft, bottomRight, capacity, isLeaf, nodes, rect, topLeft, topRight } = this;

    type childQuadDirection = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
    // we need to work out whether we should expand top-left or bottom-right.
    const getNewRect = (): [childQuadDirection: childQuadDirection, Rectangle] => {      
      // bottom right
      if (towards.x > rect.x && towards.y > rect.y) {
        return ["topLeft", new Rectangle(
          rect.x + rect.width / 2, 
          rect.y + rect.width / 2, 
          rect.width * 2,
          rect.height * 2
        )];
      }

      // bottom left
      if (towards.x < rect.x && towards.y > rect.y) {
        return ["topRight", new Rectangle(
          rect.x - rect.width / 2, 
          rect.y + rect.width / 2, 
          rect.width * 2,
          rect.height * 2
        )];
      }

      // top right
      if (towards.x > rect.x && towards.y < rect.y) {
        return ["bottomLeft", new Rectangle(
          rect.x + rect.width / 2, 
          rect.y - rect.width / 2, 
          rect.width * 2,
          rect.height * 2
        )];
      }

      return ["bottomRight", new Rectangle(
        rect.x - rect.width / 2, 
        rect.y - rect.width / 2, 
        rect.width * 2,
        rect.height * 2
      )];
    }

    // create new quad tree and set all fields to match this objects fields;
    const newQuad = new QuadTree<T>(
      Rectangle.from(rect),
      capacity,
      false
    );

    newQuad.isLeaf = isLeaf;
    newQuad.bottomLeft = bottomLeft;
    newQuad.bottomRight = bottomRight;
    newQuad.topLeft = topLeft;
    newQuad.topRight = topRight;
    newQuad.nodes = nodes;
    
    const [direction, newRect] = getNewRect();
    // update the current quad tree to be a parent of this new quad.
    this.rect = newRect;
    this.capacity = capacity;
    this.isRoot = true;
    this.isLeaf = false;
    
    this[direction] = newQuad;
    this.instantiateBottomRight(direction !== "bottomRight");
    this.instantiateBottomLeft(direction !== "bottomLeft");
    this.instantiateTopLeft(direction !== "topLeft");
    this.instantiateTopRight(direction !== "topRight");
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

  private hasSubdivided() {
    return !this.isLeaf
  }

  private instantiateBottomLeft(force: boolean) {
    const { x, y, height, width } = this.rect;

    if (force || !this.bottomLeft) {
      this.bottomLeft = new QuadTree(
        new Rectangle(
          x - (width / 4),
          y + (height / 4),
          width / 2,
          height / 2
        ),
        this.capacity
      );
    }
  }

  private instantiateBottomRight(force: boolean) {
    const { x, y, height, width } = this.rect;

    if (force || !this.bottomRight) {
      this.bottomRight = new QuadTree(
        new Rectangle(
          x + (width / 4),
          y + (height / 4),
          width / 2,
          height / 2
        ),
        this.capacity
      );
    }
  }

  private instantiateTopLeft(force: boolean) {
    const { x, y, height, width } = this.rect;

    if (force || !this.topLeft) {
      this.topLeft = new QuadTree(
        new Rectangle(
          x - (width / 4),
          y - (height / 4),
          width / 2,
          height / 2
        ),
        this.capacity
      );
    }
  }

  private instantiateTopRight(force: boolean) {
    const { x, y, height, width } = this.rect;

    if (force || !this.topRight) {
      this.topRight = new QuadTree(
        new Rectangle(
          x + (width / 4),
          y - (height / 4),
          width / 2,
          height / 2
        ),
        this.capacity
      );
    }
  }
}