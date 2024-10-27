import { bench, describe } from "vitest";
import { Rectangle } from "./rectangle";
import { withQuadtree } from "./utils";

describe('Inserting Rectangle requiring 2 expansions', () => {
  withQuadtree({ capacity: 2 }, (tree) => {
    bench('Inserting a node outside the bounds of a tree', () => {
      tree.insert(new Rectangle(-160, -160, 5, 5));
    })
  })
});

describe('Inserting Rectangle requiring 10 expansions', () => {
  withQuadtree({ capacity: 2 }, (tree) => {
    bench('Inserting a node outside the bounds of a tree', () => {
      tree.insert(new Rectangle(-16000, -16000, 5, 5));
    })
  })
});

describe('Retrieving Rectangle requiring 2 expansions', () => {
  withQuadtree({ capacity: 2 }, (tree) => {
    tree.insert(new Rectangle(-160, -160, 5, 5));
    bench('retrieving node', () => {
      tree.retrieve(new Rectangle(0, 0, 5000, 5000));
    })
  })
});

describe("Putting a shit tonne of rectangles in the tree", () => {
  withQuadtree({ capacity: 4 }, (tree) => {

    Array.from({ length: 1000000 }).forEach(() => {
      const x = Math.floor(Math.random() * 50000 * (Math.random() > 0.5 ? -1 : 1));
      const y = Math.floor(Math.random() * 50000 * (Math.random() > 0.5 ? -1 : 1));
      tree.insert(new Rectangle(x, y, 1, 1));
    });
    
    bench("tree.retrieve(new Rectangle(0, 0, 50, 50))", () => {
      tree.retrieve(new Rectangle(0, 0, 50, 50))
    })

    bench("retrieveAll()", () => {
      tree.retrieveAll()
    })
  })
})