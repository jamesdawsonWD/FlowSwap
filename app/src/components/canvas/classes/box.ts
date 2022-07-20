import { Vector } from "../helpers/vector";
import { HSLA } from "../helpers";
import { randomFloatFromRange } from "../helpers";
export class Box {
  private origin: Vector;
  private clonedFill: HSLA;
  constructor(
    private position: Vector,
    private width: number,
    private height: number,
    private lineWidth: number,
    private fill: HSLA | string,
    private strokeStyle: HSLA | string,
    private ctx: CanvasRenderingContext2D
  ) {
    this.origin = this.position;
    this.clonedFill = this.fill as HSLA;
  }
  get getFill(): HSLA | string {
    return this.clonedFill;
  }
  get getStrokeStyle(): HSLA | string {
    return this.strokeStyle;
  }
  get getOrigin(): Vector {
    return this.origin;
  }
  get getPosition(): Vector {
    return this.position;
  }


  public setFill(color: HSLA) {
    this.clonedFill = color;
  }
  public setStrokeStyle(color: HSLA) {
    this.strokeStyle = color;
  }
  public setOrigin(v: Vector) {
    this.origin = v;
  }
  public setPosition(v: Vector) {
    this.position = v;
  }

  public draw() {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.strokeStyle.toString();
    this.ctx.fillStyle = "rgba(255, 255, 255, 0)";
    this.ctx.strokeRect(this.position.x, this.position.y, this.width, this.height);
    this.ctx.fill();
    this.ctx.closePath();

  }

  public update() {
    this.draw();
  }
}
