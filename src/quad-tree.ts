import { Point } from "./point";
import { Rectangle } from "./rectangle";
import type { Subscription } from "./types";
import { copyInstance } from "./utils";

/***** TYPE DEFINITIONS *****/
type childQuadDirection = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const QUAD_CODES = {
  NODE_NOT_WITHIN_BOUNDS: "NODE_NOT_WITHIN_BOUNDS",
  SUCCESS: "SUCCESS"
} as const;

// For debugging purposes
let treeID = 0

export class QuadTree<T extends Rectangle> {
  private subscriptions: Array<Subscription.Callback> = []

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
  // For debugging purposes
  public id = ++treeID

  constructor(
    public rect: Rectangle,
    private capacity: number = 4,
    private isRoot: boolean = true
  ) {}

  public subscribe(callback: Subscription.Callback) {
    this.subscriptions.push(callback)

    return () => {
      this.subscriptions = this.subscriptions.filter((sub) => sub !== callback)
    }
  }

  public insert(node: T | Array<T>) {
    this._insert(node);
    for (const subscriber of this.subscriptions) {
      subscriber({ type: "insert", node });
    }
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

  public retrieveAll(): Array<T> {
    return [
      ...this.nodes,
      ...this.topRight?.retrieveAll() || [],
      ...this.topLeft?.retrieveAll() || [],
      ...this.bottomRight?.retrieveAll() || [],
      ...this.bottomLeft?.retrieveAll() || []
    ]
  }

  public delete(at: Rectangle | Point) {
    this._delete(at);
    for (const subscriber of this.subscriptions) {
      subscriber({ type: "delete", node: at });
    }
  }

  private _delete(at: Rectangle | Point): void {
    if (at instanceof Point) {
      if (!this.rect.contains(at)) {
        return;
      }
    }

    if (at instanceof Rectangle) {
      if (!this.rect.intersects(at)) {
        return;
      }
    }

    this.nodes = this.nodes.filter((node) => {
      if (at instanceof Point) {
        return !node.contains(at);
      }

      if (at instanceof Rectangle) {
        return !node.intersects(at);
      }

      return true;
    });

    this.topRight?._delete(at);
    this.topLeft?._delete(at);
    this.bottomRight?._delete(at);
    this.bottomLeft?._delete(at);
  }

  /** 
   * Internal insert function which performs the insert logic. The public function will call this function and notify subscribers.
   */
  private _insert(node: T | Array<T>) {
    if (Array.isArray(node)) {
      for (const n of node) {
        this._insert(n);
      }
      return;
    }
    
    if (!this.rect.intersects(node)) {
      if (!this.isRoot)
        return QUAD_CODES.NODE_NOT_WITHIN_BOUNDS;
      
      this.expand(node);
      return void this._insert(node);
    }
    
    const hasFreeCapacity = this.nodes.length < this.capacity;
    if (hasFreeCapacity && !this.hasSubdivided())
      return void this.nodes.push(node);
    
    this.subdivide();
    
    // Push node to this tree if it intersects more than 1 child
    if (this.childIntersections(node) > 1)
      return void this.nodes.push(node);
    
    this.insertChildren(node);
  }

  private subdivide(): void {
    if (this.hasSubdivided())
      return;

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
      this.insertChildren(node);
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
    const { bottomLeft, bottomRight, capacity, isLeaf, nodes, rect, topLeft, topRight } = this;

    if (!this.isRoot)
      return;

    // create new quad tree and set all fields to match this objects fields;
    const childQuad = new QuadTree<T>(
      Rectangle.from(rect),
      capacity,
      false
    );

    childQuad.isLeaf = isLeaf;
    childQuad.bottomLeft = copyInstance(bottomLeft);
    childQuad.bottomRight = copyInstance(bottomRight);
    childQuad.topLeft = copyInstance(topLeft);
    childQuad.topRight = copyInstance(topRight);
    childQuad.nodes = [...nodes];
    
    const [direction, newRect] = QuadTreeMethods.expansionDirection(rect, towards);

    // update the current quad tree to be a parent of this new quad.
    this.rect = newRect;
    this.capacity = capacity;
    this.isRoot = true;
    this.isLeaf = false;
    this.nodes = [];
    
    // Set the new quad tree to be a child of this quad tree.
    this[direction] = childQuad;
    this.instantiateBottomRight(direction !== "bottomRight");
    this.instantiateBottomLeft(direction !== "bottomLeft");
    this.instantiateTopLeft(direction !== "topLeft");
    this.instantiateTopRight(direction !== "topRight");
  }

  /**
   * Returns the number of children that the current node intersects with. 
   */
  private childIntersections(node: T) {
    const intersections = [
      this.topLeft!.rect.intersects(node),
      this.topRight!.rect.intersects(node),
      this.bottomLeft!.rect.intersects(node),
      this.bottomRight!.rect.intersects(node)
    ]
    
    return intersections.filter(Boolean).length;
  }

  /**
   * Returns whether the current quad tree has been subdivided or not. This is simply derived from "isLead" for readability.
   */
  private hasSubdivided() {
    return !this.isLeaf
  }

  /**
   * Creates a new quad tree in the bottom left quadrant of the current quad tree. This will only create
   * a new quad tree if one does not already exist unless force is true.
   */
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
        this.capacity,
        false
      );
    }
  }

  /**
   * Creates a new quad tree in the bottom right quadrant of the current quad tree. This will only create
   * a new quad tree if one does not already exist unless force is true.
   */
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
        this.capacity,
        false
      );
    }
  }

  /**
   * Creates a new quad tree in the top left quadrant of the current quad tree. This will only create
   * a new quad tree if one does not already exist unless force is true.
   */
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
        this.capacity,
        false
      );
    }
  }

  /**
   * Creates a new quad tree in the top right quadrant of the current quad tree. This will only create
   * a new quad tree if one does not already exist unless force is true.
   */
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
        this.capacity,
        false
      );
    }
  }

  /**
   * Inserts the node into the children of the current node. This should only ever be called if the node intersects exactly
   * one child. This function will throw an error if that is not the case.
   */
  private insertChildren(node: T) {
    const result = [
      this.topRight!._insert(node),
      this.topLeft!._insert(node),
      this.bottomRight!._insert(node),
      this.bottomLeft!._insert(node)
    ];

    if (result.filter((r) => r !== QUAD_CODES.NODE_NOT_WITHIN_BOUNDS).length > 1) {
      throw new Error(
        `Node was within bounds of more than one child ${result}`,
      );
    }
  }
}


class QuadTreeMethods {
  /**
   * Accepts the current quad tree rectangle, and a rectangle that we need to expand towards, 
   * and returns the direction and the new rectangle that the current quad tree should be expanded to.
   */
  public static expansionDirection = (rect: Rectangle, towards: Rectangle): [childQuadDirection: childQuadDirection, Rectangle] => {      
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
}
