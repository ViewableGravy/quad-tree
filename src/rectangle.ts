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

  public contains(point: Point): boolean {
    return (
      point.x >= this.x - this.width / 2 &&
      point.x <= this.x + this.width / 2 &&
      point.y >= this.y - this.height / 2 &&
      point.y <= this.y + this.height / 2
    )
  }

  public intersects(rect: Rectangle): boolean {
    return !(
      rect.x - (rect.width / 2) > this.x + (this.width / 2) ||
      rect.x + (rect.width / 2) < this.x - (this.width / 2) ||
      rect.y - (rect.height / 2) > this.y + (this.height / 2) ||
      rect.y + (rect.height / 2) < this.y - (this.height / 2)
    )
  }

  public static from(rect: Rectangle): Rectangle {
    return new Rectangle(rect.x, rect.y, rect.width, rect.height);
  }
}
