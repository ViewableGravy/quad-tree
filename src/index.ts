import { withQuadtree } from "./utils";

console.log("Hello via Bun!");


withQuadtree({ capacity: 2 }, (tree) => {
  

  Bun.write(
    Bun.file('./quad-tree.json'),
    JSON.stringify(tree)
  )
});





