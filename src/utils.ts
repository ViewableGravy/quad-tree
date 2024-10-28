import { describe, expect, test } from "vitest";
import { QuadTree } from "./quad-tree";
import { Rectangle } from "./rectangle";

type Settings = {
  rectangle?: Rectangle;
  capacity?: number;
  isRoot?: boolean;
}

type Utils = {
  test: {
    /**
     * Tests whether the tree has been subdivded or not
     */
    subdivided: () => void;
  }
}

type Callback = (tree: QuadTree<Rectangle>, utils: Utils) => void;

/**
 * Helper function for creating a quadTree for testing. This also returns helper functions for common testing functionality
 */
export const withQuadtree = (
  settings: null | Settings, 
  callback: Callback
) => {
  const tree = new QuadTree(
    settings?.rectangle ?? new Rectangle(0, 0, 100, 100), 
    settings?.capacity ?? 1, 
    settings?.isRoot ?? true
  );

  const subdivided = () => {
    describe("Tree should have subdivided", () => {
      test("4 children have been created", () => {
        expect(tree.topLeft).instanceOf(QuadTree);
        expect(tree.topRight).instanceOf(QuadTree);
        expect(tree.bottomLeft).instanceOf(QuadTree);
        expect(tree.bottomRight).instanceOf(QuadTree);
      });

      test("Tree should no longer be a leaf node", () => {
        expect(tree.isLeaf).toBe(false);
      });
    })
  }

  return callback(tree, {
    test: {
      subdivided
    }
  });
}

export const copyInstance = <T>(original: T | null) => {
  if (!original)
    return null;

  var copied = Object.assign(
    Object.create(
      Object.getPrototypeOf(original)
    ),
    original
  );
  return copied;
}