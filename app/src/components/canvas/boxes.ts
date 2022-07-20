import { Vector, add } from './helpers/vector';

import { randomItemFromArray, randomIntFromRange, HSLA } from './helpers/';
import { Box } from './classes/box';
export class Boxes {
    private ctx: CanvasRenderingContext2D;
    private mouse: Vector;
    private boxes: Box[];
    private center = new Vector(0, 0);
    private clicked = false;
    private Configs = {
        steps: 3,
        boxes: 4,
        lastStep: 0,
        colors: [
            new HSLA(0, 0, 0, 0.1),
            new HSLA(0, 0, 0, 0.25),
            new HSLA(0, 0, 0, 0.5),
            new HSLA(0, 0, 0, 0.75),
            new HSLA(0, 0, 0, 1),
        ],
    };
    constructor(private canvas: HTMLCanvasElement) {
        window.requestAnimationFrame = (function () {
            return (
                window.requestAnimationFrame ||
                // window.webkitRequestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, 1000 / 60);
                }
            );
        })();
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;

        this.center.set(this.canvas.width / 2, this.canvas.height / 2);

        this.boxes = [];

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.mouse = new Vector(innerWidth / 2, innerHeight / 2);

        // Event Listeners
        addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        });

        addEventListener('mousedown', (event) => {
            this.clicked = true;
        });
        addEventListener('mouseup', (event) => {
            this.clicked = false;
        });
        addEventListener('resize', () => {
            if (this.canvas) {
                this.canvas.width = innerWidth;
                this.canvas.height = innerHeight;
            }
        });
        this.init();
    }
    public init() {
        window.requestAnimationFrame(this.animate.bind(this));
    }
    public animate(milliseconds: any) {
        const elapsed = milliseconds - this.Configs.lastStep;
        this.Configs.lastStep = milliseconds;
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.update(elapsed);
        this.ctx.fill();
        window.requestAnimationFrame(this.animate.bind(this));
    }

    public draw(milliseconds: number) {
        const colors = ['#270f36', '#632b6c', '#c76b98', '#f09f9c', '#fcc3a3'];
        const vector1 = new Vector(
            randomIntFromRange(this.mouse.x - 200, this.mouse.x + 200),
            randomIntFromRange(this.mouse.y - 200, this.mouse.y + 200)
        );

        this.boxes.push(
            new Box(
                vector1,
                randomIntFromRange(10, 225),
                randomIntFromRange(10, 225),
                randomIntFromRange(1, 2),
                new HSLA(0, 0, 0, 1),
                new HSLA(0, 0, 0, 1),
                this.ctx
            )
        );
        const vector2 = new Vector(
            randomIntFromRange(this.mouse.x - 200, this.mouse.x + 200),
            randomIntFromRange(this.mouse.y - 200, this.mouse.y + 200)
        );

        this.boxes.push(
            new Box(
                vector2,
                randomIntFromRange(10, 225),
                randomIntFromRange(10, 225),
                randomIntFromRange(1, 2),
                new HSLA(0, 0, 0, 1),
                new HSLA(0, 0, 0, 1),
                this.ctx
            )
        );
        this.ctx.save();
        for (let i = 0; i < this.boxes.length; i++) {
            if (i == 0) continue;
            const strokeColor = this.boxes[i].getStrokeStyle as HSLA;
            this.boxes[i].update();
            const strokeAlpha = strokeColor.alpha;
            if (strokeAlpha > 0.02) {
                strokeColor.setAlpha(strokeColor.alpha - 0.02);
            } else {
                this.boxes = this.boxes
                    .slice(0, i)
                    .concat(this.boxes.slice(i + 1));
            }
        }
        this.ctx.restore();
    }
    public update(elapsed: number) {
        this.draw(elapsed);
    }
}
