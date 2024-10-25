import { Rectangle } from "./rectangle";
import { withQuadtree } from "./utils";

console.log("Hello via Bun!");


withQuadtree({ capacity: 2 }, (tree) => {
  tree.insert(new Rectangle(-160, -160, 5, 5));

  Bun.write(
    Bun.file('./quad-tree.json'),
    JSON.stringify(tree)
  )
});





