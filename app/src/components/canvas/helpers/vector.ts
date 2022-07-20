export const add = (a: Vector, b: Vector): Vector =>
    new Vector(a.x + b.x, a.y + b.y);
export const sub = (a: Vector, b: Vector): Vector =>
    new Vector(a.x - b.x, a.y - b.y);
export const scale = (v: Vector, s: number): Vector => v.clone().scale(s);
export const randon = (): Vector =>
    new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
export const distanceToAndAngle = (
    a: Vector,
    b: Vector
): { distance: number; angle: number } => {
    return {
        distance: a.distanceTo(b),
        angle: a.angleTo(b),
    };
};

export class Vector {
    constructor(public x: number, public y: number) {
        this.x = x || 0;
        this.y = y || 0;
    }

    public set(x: number, y: number) {
        this.x = x || 0;
        this.y = y || 0;
        return this;
    }
    public add(v: Vector): Vector {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    public sub(v: Vector): Vector {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    public scale(s: number): Vector {
        this.x *= s;
        this.y *= s;
        return this;
    }
    public length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    public lengthSq() {
        return this.x * this.x + this.y * this.y;
    }
    public normalise(): Vector {
        const m = Math.sqrt(this.x * this.x + this.y * this.y);
        if (m) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    }
    public angle() {
        return Math.atan2(this.y, this.x);
    }
    public angleTo(v: Vector) {
        const dx = v.x - this.x,
            dy = v.y - this.y;
        return Math.atan2(dy, dx);
    }
    public distanceTo(v: Vector) {
        const dx = v.x - this.x,
            dy = v.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    public distanceSq(v: Vector) {
        const dx = v.x - this.x,
            dy = v.y - this.y;
        return dx * dx + dy * dy;
    }
    public lerp(v: Vector, t: number): Vector {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        return this;
    }
    public clone(): Vector {
        return new Vector(this.x, this.y);
    }
    public toString(): string {
        return '(x:' + this.x + ', y:' + this.y + ')';
    }
}

export class ToVector {
    public magnitudeX: number;
    public magnitudeY: number;
    constructor(magnitude: number, angle: number) {
        this.magnitudeX = magnitude * Math.cos(angle);
        this.magnitudeY = magnitude * Math.sin(angle);
    }
}
