import type { Point } from "./point";
import type { Rectangle } from "./rectangle";

export namespace Subscription {

  type InsertCallbackObject = {
    type: "insert",
    node: Rectangle | Array<Rectangle>
  }

  type DeleteCallbackObject = {
    type: "delete",
    node: Rectangle  | Point
  }

  type CallbackObjects = InsertCallbackObject | DeleteCallbackObject;

  export type Callback = (opts: CallbackObjects) => void;

}