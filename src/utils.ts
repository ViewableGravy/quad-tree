import { QuadTree } from "./quad-tree";
import { Rectangle } from "./rectangle";

type Settings = {
  rectangle?: Rectangle;
  capacity?: number;
  isRoot?: boolean;
}

type QuadTreeNodes = {
  topRight?: QuadTree<Rectangle>;
  topLeft?: QuadTree<Rectangle>;
  bottomRight?: QuadTree<Rectangle>;
  bottomLeft?: QuadTree<Rectangle>;
}

export const withQuadtree = (settings: null | Settings, callback: (tree: QuadTree<Rectangle>) => void) => {
  return callback(new QuadTree(
    settings?.rectangle ?? new Rectangle(0, 0, 100, 100), 
    settings?.capacity ?? 1, 
    settings?.isRoot ?? true
  ));
}