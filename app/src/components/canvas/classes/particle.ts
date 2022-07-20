import { Vector } from '../helpers/vector';
import { HSLA } from '../helpers';
import { randomFloatFromRange } from '../helpers';
export class Particle {
    private radiens: number;
    private origin: Vector;
    private velocity: number;
    private decayRate: number;
    constructor(
        private position: Vector,
        private radius: number,
        private dist: number,
        private distFromCenter: number,
        private color: HSLA | string,
        private ctx: CanvasRenderingContext2D
    ) {
        this.radiens = Math.random() * Math.PI * 2;
        this.origin = this.position;
        this.decayRate = randomFloatFromRange(0.1, 0);
        this.velocity = randomFloatFromRange(0.001, 0.005);
    }
    get getOriginalColor(): HSLA | string {
        return this.color;
    }
    get getOrigin(): Vector {
        return this.origin;
    }
    get getPosition(): Vector {
        return this.position;
    }
    get getRadius(): number {
        return this.radius;
    }
    get getRadiens(): number {
        return this.radiens;
    }
    get getDist(): number {
        return this.dist;
    }
    get getVelocity(): number {
        return this.velocity;
    }
    get getDistFromCenter(): number {
        return this.distFromCenter;
    }

    public setRadiens(radiens: number) {
        this.radiens = radiens;
    }
    public setDist(dist: number) {
        this.dist = dist;
    }
    public setColor(color: HSLA) {
        this.color = color;
    }
    public setOrigin(v: Vector) {
        this.origin = v;
    }
    public setPosition(v: Vector) {
        this.position = v;
    }
    public setRadius(r: number) {
        this.radius = r;
    }
    public setVelocity(r: number) {
        this.velocity = r;
    }
    public setDistFromCenter(d: number) {
        this.distFromCenter = d;
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
        this.ctx.strokeStyle = this.color as string;
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
    }

    public update() {
        this.radiens += this.velocity;
        this.position.x =
            this.origin.x + Math.cos(this.radiens) * this.distFromCenter;
        this.position.y =
            this.origin.y + Math.sin(this.radiens) * this.distFromCenter;
        this.distFromCenter -= this.distFromCenter < 1 ? 1 : this.decayRate;
        if (this.distFromCenter < 3) {
            this.radius = 0;
        } else if (this.distFromCenter < 200) {
            this.velocity += 0.00001;
            this.radius = this.radius < 0.011 ? 0.01 : this.radius - 0.008;
        }

        this.draw();
    }
}
