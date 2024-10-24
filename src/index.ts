import { Rectangle } from "./rectangle";
import { withQuadtree } from "./utils";

console.log("Hello via Bun!");



// let quadTree = new QuadTree(
//   new Rectangle(0, 0, 800, 600), 
//   4, 
//   true
// );


// const points = Array.from({ length: 1000 }, () => new Rectangle(
//   Math.floor((Math.random() * 800) - 400),
//   Math.floor((Math.random() * 600) - 400),
//   10,
//   10
// ));

// quadTree.insert(points);

// const nodes = quadTree.retrieve(new Rectangle(100, 100, 1, 1), false);


withQuadtree({ capacity: 2 }, (tree) => {
  tree.insert(new Rectangle(-160, -160, 5, 5));

  Bun.write(
    Bun.file('./quad-tree.json'),
    JSON.stringify(tree)
  )
});





