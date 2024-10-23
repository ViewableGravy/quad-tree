import { QuadTree } from "./quad-tree";
import { Rectangle } from "./rectangle";

console.log("Hello via Bun!");


const quadTree = new QuadTree(
  new Rectangle(0, 0, 800, 600), 
  4, 
  true
);



const points = Array.from({ length: 1000 }, () => new Rectangle(
  Math.floor((Math.random() * 800) - 400),
  Math.floor((Math.random() * 600) - 400),
  10,
  10
));

quadTree.insert(points);

const nodes = quadTree.retrieve(new Rectangle(100, 100, 1, 1), false);

Bun.write(
  Bun.file('./quad-tree.json'),
  JSON.stringify(quadTree)
)

const node = new Rectangle(7, -95, 10, 10);

// parent: { "x": 200, "y": -150, "width": 400, "height": 300 }
const parent = new Rectangle(200, -150, 400, 300);

//{ "x": 100, "y": -75, "width": 200, "height": 150 }
const bottomLeft = new Rectangle(100, -75, 200, 150);
//{ "x": 300, "y": -75, "width": 200, "height": 150 }
const bottomRight = new Rectangle(300, -75, 200, 150);
// { "x": 100, "y": -225, "width": 200, "height": 150 }
const topLeft = new Rectangle(100, -225, 200, 150);
//{ "x": 300, "y": -225, "width": 200, "height": 150 }
const topRight = new Rectangle(300, -225, 200, 150);

console.log(
  [
    bottomLeft.intersects(node),
    bottomRight.intersects(node),
    topLeft.intersects(node),
    topRight.intersects(node),
  ].filter(Boolean).length
)

console.log(
  'intersects',
  'bottomLeft', bottomLeft.intersects(node),
  'bottomRight', bottomRight.intersects(node),
  'topLeft', topLeft.intersects(node),
  'topRight', topRight.intersects(node),
);

