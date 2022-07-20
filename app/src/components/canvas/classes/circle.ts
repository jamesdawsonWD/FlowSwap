import { Vector } from "../helpers/vector";
import { HSLA } from "../helpers";

export class Circle {
  constructor(
    private position: Vector,
    private radius: number,
    private color: HSLA | string,
    private stroke: number,
    private strokeColor: HSLA | string,
    private ctx: CanvasRenderingContext2D
  ) {}
  get getOriginalColor(): HSLA | string {
    return this.color;
  }
  get getOrigin(): Vector {
    return this.position;
  }
  get getRadius(): number {
    return this.radius;
  }
  get getStroke(): number {
    return this.stroke;
  }

  get getStrokeColor(): HSLA | string {
    return this.strokeColor;
  }
  public setColor(color: HSLA) {
    this.color = color;
  }
  public setOrigin(v: Vector) {
    this.position = v;
  }
  public setRadius(r: number) {
    this.radius = r;
  }

  public draw() {
    this.ctx.beginPath();
    this.ctx.arc(
      this.position.x,
      this.position.y,
      this.radius,
      0,
      Math.PI * 2,
      false
    );
    this.ctx.fillStyle = this.color as string;
    this.ctx.strokeStyle = this.strokeColor as string;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  public update() {
    this.draw();
  }
}
