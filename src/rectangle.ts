import type { Point } from "./point";

export class Rectangle {
  constructor(
    /**
     * Represents the center of the rectangle.
     */
    public x: number,

    /**
     * Represents the center of the rectangle.
     */
    public y: number,
    public width: number,
    public height: number
  ) {}

  static contains(thisRect: Rectangle, point: Point): boolean {
    return (
      point.x >= thisRect.x - thisRect.width / 2 &&
      point.x <= thisRect.x + thisRect.width / 2 &&
      point.y >= thisRect.y - thisRect.height / 2 &&
      point.y <= thisRect.y + thisRect.height / 2
    )
  }

  static intersects(thisRect:Rectangle, rect: Rectangle): boolean {
    return !(
      rect.x - (rect.width / 2) > thisRect.x + (thisRect.width / 2) ||
      rect.x + (rect.width / 2) < thisRect.x - (thisRect.width / 2) ||
      rect.y - (rect.height / 2) > thisRect.y + (thisRect.height / 2) ||
      rect.y + (rect.height / 2) < thisRect.y - (thisRect.height / 2)
    )
  }

  public static from(rect: Rectangle): Rectangle {
    return new Rectangle(rect.x, rect.y, rect.width, rect.height);
  }
}
