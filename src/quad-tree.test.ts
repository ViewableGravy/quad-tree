import { describe, expect, test } from "vitest";
import { Point } from "./point";
import { QuadTree } from "./quad-tree";
import { Rectangle } from "./rectangle";
import { withQuadtree } from "./utils";

describe("QuadTree", () => {
  describe("insert()", () => {
    describe('QuadTree With No Subdivision', () => {
      describe("Inserting a single node", () => {
        withQuadtree({ capacity: 2 }, (tree) => {
          tree.insert(new Rectangle(10, 10, 5, 5));
          
          test("Tree should have no children", () => {
            expect(tree.topLeft).toBe(null);
            expect(tree.topRight).toBe(null);
            expect(tree.bottomLeft).toBe(null);
            expect(tree.bottomRight).toBe(null);
          })
    
          test("Tree should have 1 node", () => {
            expect(tree.nodes.length).toBe(1);
          })
        })
      })
    
      describe("Inserting Many Nodes at once", () => {
        withQuadtree({ capacity: 3 }, (tree) => {
          tree.insert([
            new Rectangle(10, 10, 5, 5),
            new Rectangle(-15, 10, 5, 5),
          ]);
          
          test("Tree should have no children", () => {
            expect(tree.topLeft).toBe(null);
            expect(tree.topRight).toBe(null);
            expect(tree.bottomLeft).toBe(null);
            expect(tree.bottomRight).toBe(null);
          })
    
          test("Tree should have 1 node", () => {
            expect(tree.nodes.length).toBe(2);
          })
        })
      })
    })
    
    describe('QuadTree With Single Subdivision', () => {
      withQuadtree({ capacity: 2 }, (tree, utils) => {
        tree.insert(new Rectangle(10, 10, 5, 5));
        tree.insert(new Rectangle(-15, 10, 5, 5));
        tree.insert(new Rectangle(10, -10, 5, 5));
        tree.insert(new Rectangle(-15, -10, 5, 5));
    
        test("Tree should have 0 nodes at top level", () => {
          expect(tree.nodes.length).toBe(0);
        });
    
        utils.test.subdivided();
    
        describe("The inserted nodes should be in the correct subtrees nodes array", () => {
          test("The bottom left should have 1 node", () => {
            expect(tree.bottomLeft!.nodes.length).toBe(1);
          });
    
          test("The bottom right should have 1 node", () => {
            expect(tree.bottomRight!.nodes.length).toBe(1);
          });
    
          test("The top right should have 1 node", () => {
            expect(tree.topRight!.nodes.length).toBe(1);  
          });
    
          test("The top left should have 1 node", () => {
            expect(tree.topLeft!.nodes.length).toBe(1);
          });
        });
      });
    });
    
    describe('Nodes that intersect multiple subtrees (of depth 1) should be stored in parent', () => { 
    
      describe("Node that intersects but does not exceed capacity", () => {
        withQuadtree({ capacity: 2 }, (tree) => {
          // Node that does intercept multiple children
          tree.insert(new Rectangle(5, 5, 5, 5));
    
          test("Tree should have 1 node in the root", () => {
            // Should have 1 node
            expect(tree.nodes.length).toBe(1);
            expect(tree.nodes.at(0)).toEqual(new Rectangle(5, 5, 5, 5));
          });
    
          test("Tree should have no children", () => {
            expect(tree.topLeft).toBe(null);
            expect(tree.topRight).toBe(null);
            expect(tree.bottomLeft).toBe(null);
            expect(tree.bottomRight).toBe(null);
          })
        })
      })
    
      describe("Node that intersects and exceeds capacity", () => {
        withQuadtree({ capacity: 1 }, (tree, utils) => {
          // Node that does not intercept multiple children
          tree.insert(new Rectangle(10, 10, 5, 5));
    
          // Node that does intercept multiple children
          tree.insert(new Rectangle(5, 0, 5, 5));
          
          test("Tree should have 1 node in the root", () => {
            expect(tree.nodes.length).toBe(1);
            expect(tree.nodes.at(0)).toEqual(new Rectangle(5, 0, 5, 5));
          });
    
          utils.test.subdivided();
    
          test("The non-intersecting node should be in the bottom right child", () => {
            expect(tree.bottomRight!.nodes.length).toBe(1);
          });
    
          test("Children excluding bottom right are empty", () => {
            expect(tree.topRight!.nodes.length).toBe(0);
            expect(tree.topLeft!.nodes.length).toBe(0);
            expect(tree.bottomLeft!.nodes.length).toBe(0);
          })
        });
      })
    
      describe("Multiple Node that intersects and exceeds capacity", () => {
        withQuadtree({ capacity: 1 }, (tree, utils) => {
          // Node that does not intercept multiple children
          tree.insert(new Rectangle(10, 10, 5, 5));
    
          // Node that does intercept multiple children
          tree.insert(new Rectangle(5, 0, 5, 5));
          tree.insert(new Rectangle(0, 5, 5, 5));
          
          test("Tree should have 2 node in the root", () => {
            expect(tree.nodes.length).toBe(2);
            expect(tree.nodes.at(0)).toEqual(new Rectangle(5, 0, 5, 5));
            expect(tree.nodes.at(1)).toEqual(new Rectangle(0, 5, 5, 5));
          });
    
          utils.test.subdivided();
    
          test("The non-intersecting node should be in the bottom right child", () => {
            expect(tree.bottomRight!.nodes.length).toBe(1);
          });
    
          test("Children excluding bottom right are empty", () => {
            expect(tree.topRight!.nodes.length).toBe(0);
            expect(tree.topLeft!.nodes.length).toBe(0);
            expect(tree.bottomLeft!.nodes.length).toBe(0);
          });
        });
      });
    
    });
    
    describe("QuadTree With Multiple Subdivisions", () => {
      test('After subdivision, if a new node is added that passes a child capacity, the specific child tree subdivides', () => {
        withQuadtree({ capacity: 2 }, (tree) => {
          // Insert one rectangle in each child
          tree.insert(new Rectangle(10, 10, 5, 5));
          tree.insert(new Rectangle(-10, 10, 5, 5));
          tree.insert(new Rectangle(10, -10, 5, 5));
          tree.insert(new Rectangle(-10, -10, 5, 5));
          
          // Insert two more that intersect the bottom right child
          tree.insert(new Rectangle(45, 45, 5, 5));
          tree.insert(new Rectangle(35, 35, 5, 5));
          tree.insert(new Rectangle(30, 20, 5, 5));
      
          // Should have 0 nodes
          expect(tree.nodes.length).toBe(0);
      
          // The nodes should be in the bottom right (children)
          expect(tree.bottomRight!.nodes.length).toBe(0);
          expect(tree.bottomLeft!.nodes.length).toBe(1);
          expect(tree.topRight!.nodes.length).toBe(1);
          expect(tree.topLeft!.nodes.length).toBe(1);
      
          const bottomRight = tree.bottomRight!;
      
          expect(bottomRight.topLeft!.nodes.length).toBe(1);
          expect(bottomRight.topRight!.nodes.length).toBe(1);
          expect(bottomRight.bottomLeft!.nodes.length).toBe(0);
          expect(bottomRight.bottomRight!.nodes.length).toBe(2);
        })
      })
    })
    
    test('After subdivision, if a new node is added that passes a child capacity, and intersects 2 children, the specific child tree subdivides', () => {
      withQuadtree({ capacity: 2 }, (tree) => {
        // Insert one rectangle in each child
        tree.insert(new Rectangle(10, 10, 5, 5));
        tree.insert(new Rectangle(-10, 10, 5, 5));
        tree.insert(new Rectangle(10, -10, 5, 5));
        tree.insert(new Rectangle(-10, -10, 5, 5));
        
        // Insert two more that intersect the bottom right child
        tree.insert(new Rectangle(45, 45, 5, 5));
        tree.insert(new Rectangle(25, 35, 5, 5));
    
        // Should have 0 nodes
        expect(tree.nodes.length).toBe(0);
    
        // The nodes should be in the bottom right (children)
        expect(tree.bottomRight!.nodes.length).toBe(1);
        expect(tree.bottomLeft!.nodes.length).toBe(1);
        expect(tree.topRight!.nodes.length).toBe(1);
        expect(tree.topLeft!.nodes.length).toBe(1);
    
        const bottomRight = tree.bottomRight!;
    
        expect(bottomRight.topLeft!.nodes.length).toBe(1);
        expect(bottomRight.topRight!.nodes.length).toBe(0);
        expect(bottomRight.bottomLeft!.nodes.length).toBe(0);
        expect(bottomRight.bottomRight!.nodes.length).toBe(1);
      })
    })
    
    describe('Placing a node outside the bounds of a tree converts the tree to a higher level tree', () => {
      withQuadtree({ capacity: 2 }, (tree) => {
        // Insert one rectangle in each child
        tree.insert(new Rectangle(-60, -60, 5, 5));
    
        test('Should have 0 nodes', () => {
          // Should have 0 nodes
          expect(tree.nodes.length).toBe(0);
        })
    
        test('Should have 4 child trees', () => {
          // Should have 4 child trees
          expect(tree.topLeft).instanceOf(QuadTree);
          expect(tree.topRight).instanceOf(QuadTree);
          expect(tree.bottomLeft).instanceOf(QuadTree);
          expect(tree.bottomRight).instanceOf(QuadTree);
        });
    
        test('The Rectangle for the root (this tree) should be at -50,-50 : 200x200', () => {
          // The rect for this tree should be 200x200
          expect(tree.rect).toEqual(new Rectangle(-50, -50, 200, 200));
        });
    
        test('The inserted node should be in the top left child', () => {
          // The node should be in the top left child
          expect(tree.topLeft!.nodes.length).toBe(1);
        });
      })
    })
    
    describe('Placing a node outside the bounds of a tree (and outside the bounds of a new tree) converts the tree to the appropriate higher level tree', () => {
      withQuadtree({ capacity: 2 }, (tree) => {
        // Insert one rectangle in each child
        tree.insert(new Rectangle(-160, -160, 5, 5));
    
        test('Should have 0 nodes', () => {
          // Should have 0 nodes
          expect(tree.nodes.length).toBe(0);
        })
    
        test('Should have 4 child trees', () => {
          // Should have 4 child trees
          expect(tree.topLeft).instanceOf(QuadTree);
          expect(tree.topRight).instanceOf(QuadTree);
          expect(tree.bottomLeft).instanceOf(QuadTree);
          expect(tree.bottomRight).instanceOf(QuadTree);
        });
    
        test('The Rectangle for the root (this tree) should be at -150,-150 : 200x200', () => {
          // The rect for this tree should be 200x200
          expect(tree.rect).toEqual(new Rectangle(-150, -150, 400, 400));
        });
    
        test('The inserted node should be in the top left child', () => {
          // The node should be in the top left child
          expect(tree.topLeft!.nodes.length).toBe(1);
        });
      })
    })
  })

  describe('retrieve()', () => { 
    test("TODO", () => {})
  })

  describe('retrieveAll()', () => {
    test("TODO", () => {})
  })

  describe('delete()', () => {
    describe("GIVEN the tree is empty", () => {
      describe('WHEN delete() is run', () => {
        withQuadtree({ capacity: 1 }, (tree) => {
          const result = tree.delete(new Point(0, 0));
          
          test("THEN it should return void", () => {
            expect(result).toBe(void 0);
          })
          
          test("AND the tree should still be empty", () => {
            expect(tree.nodes.length).toBe(0);
          })
        })
      })
    });

    describe("GIVEN the tree has a single node", () => {
      describe('WHEN delete() is run with a point', () => {
        describe('AND the point is NOT inside inside the inserted rectangle', () => { 
          withQuadtree({ capacity: 2 }, (tree) => {
            tree.insert(new Rectangle(0, 0, 5, 5));
            
            const result = tree.delete(new Point(5, 0));

            test("THEN It should return void", () => {
              expect(result).toBe(void 0);
            });

            test("AND the tree should still have 1 node", () => {
              expect(tree.nodes.length).toBe(1);
            });
          })
        })

        describe('AND the point IS inside inside the inserted rectangle', () => { 
          withQuadtree({ capacity: 2 }, (tree) => {
            tree.insert(new Rectangle(0, 0, 5, 5));
            
            const result = tree.delete(new Point(0, 0));

            test("THEN It should return void", () => {
              expect(result).toBe(void 0);
            });

            test("AND the tree should have no nodes", () => {
              expect(tree.nodes.length).toBe(0);
            });
          })
        })

      });

      describe('WHEN delete() is run with a rectangle', () => {
        describe('AND the Rectangle is NOT inside the inserted rectangle', () => { 
          withQuadtree({ capacity: 2 }, (tree) => {
            tree.insert(new Rectangle(0, 0, 5, 5));
            
            const result = tree.delete(new Rectangle(5, 5, 1, 1));

            test("THEN It should return void", () => {
              expect(result).toBe(void 0);
            });

            test("AND the tree should still have 1 node", () => {
              expect(tree.nodes.length).toBe(1);
            });
          })
        })

        describe('AND the Rectangle IS inside the inserted rectangle', () => { 
          withQuadtree({ capacity: 2 }, (tree) => {
            tree.insert(new Rectangle(0, 0, 5, 5));
            
            const result = tree.delete(new Rectangle(1, 1, 1, 1));

            test("THEN It should return void", () => {
              expect(result).toBe(void 0);
            });

            test("AND the tree should still have 1 node", () => {
              expect(tree.nodes.length).toBe(0);
            });
          })
        })

        describe('AND the Rectangle IS partially inside the inserted rectangle', () => { 
          withQuadtree({ capacity: 2 }, (tree) => {
            tree.insert(new Rectangle(0, 0, 5, 5));
            
            const result = tree.delete(new Rectangle(3, 3, 1, 1));

            test("THEN It should return void", () => {
              expect(result).toBe(void 0);
            });

            test("AND the tree should still have 1 node", () => {
              expect(tree.nodes.length).toBe(0);
            });
          })
        })
      });
    })

    describe('GIVEN the tree has multiple nodes but has not subdivided', () => {
      describe('WHEN delete() is run with a point', () => {
        test("TODO", () => {})
      })

      describe('WHEN delete() is run with a rectangle', () => {
        test("TODO", () => {})
      })
    })
  })
})



describe("Putting a shit tonne of rectangles in the tree", () => {
  withQuadtree({ capacity: 4 }, (tree) => {

    Array.from({ length: 10000 }).forEach(() => {
      const x = Math.floor(Math.random() * 500 * (Math.random() > 0.5 ? -1 : 1));
      const y = Math.floor(Math.random() * 500 * (Math.random() > 0.5 ? -1 : 1));
      tree.insert(new Rectangle(x, y, 1, 1));
    });
    
    test("retrieveAll(): all nodes are retrieved", () => {
      expect(tree.retrieveAll().length).toBe(10000)
    })

    test("retrieve(): all nodes are retrieved", () => {
      expect(tree.retrieve(new Rectangle(0, 0, 1000, 1000)).length).toBe(10000)
    })
  })
})