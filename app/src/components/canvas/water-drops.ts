import { Vector, add } from './helpers/vector';
import { randomIntFromRange, HSLA } from './helpers';
import { Circle } from './classes/circle';
export class WaterDrops {
    private ctx: CanvasRenderingContext2D;
    private mouse: Vector;
    private circles: Circle[];
    private center = new Vector(0, 0);
    private createNewCircle = true;
    private currentCirclePosition = new Vector(0, 0);
    private circleCounter = 0;
    private currentInterval: any = 0;
    private Configs = {
        steps: 3,
        particles: 1000,
        lastStep: 0,
        colors: ['#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff', '#cdb4db'],
    };
    constructor(private canvas: HTMLCanvasElement) {
        window.requestAnimationFrame = (function () {
            return (
                window.requestAnimationFrame ||
                function (callback) {
                    window.setTimeout(callback, 1000 / 60);
                }
            );
        })();
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;

        this.center.set(this.canvas.width / 2, this.canvas.height / 2);

        this.circles = [];

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.mouse = new Vector(innerWidth / 2, innerHeight / 2);

        for (let i = 0; i < 3; i++) {
            const position = new Vector(
                randomIntFromRange(0, this.canvas.width),
                randomIntFromRange(0, this.canvas.height)
            );

            this.createParticle(position);
        }
        // Event Listeners
        addEventListener('mousemove', (event) => {
            // this.mouse.x = event.clientX;
            // this.mouse.y = event.clientY;
            // this.particles[this.particles.length - 1].setOrigin(this.mouse);
        });

        addEventListener('click', (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            const clone = { ...this.mouse };
            this.createParticle(clone as Vector);
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

    public createParticle(origin: Vector) {
        this.circles.push(
            new Circle(
                origin,
                randomIntFromRange(10, 15),
                '',
                randomIntFromRange(1, 5),
                new HSLA(50, 248, 136, 1),
                this.ctx
            )
        );
    }
    public animate(milliseconds: any) {
        const elapsed = milliseconds - this.Configs.lastStep;
        this.Configs.lastStep = milliseconds;
        if (this.canvas) {
            this.ctx.fillStyle = 'rgba(22,22,22, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.update(elapsed);
        this.ctx.fill();
        window.requestAnimationFrame(this.animate.bind(this));
    }

    public draw(milliseconds: number) {
        const colors = ['#270f36', '#632b6c', '#c76b98', '#f09f9c', '#fcc3a3'];

        this.ctx.save();
        if (this.createNewCircle) {
            this.createNewCircle = false;
            this.currentCirclePosition = new Vector(
                randomIntFromRange(0, this.canvas.width),
                randomIntFromRange(0, this.canvas.height)
            );
            this.currentInterval = setInterval(() => {
                this.createParticle(this.currentCirclePosition);
                this.circleCounter = this.circleCounter + 1;
                if (this.circleCounter == 3) {
                    this.createNewCircle = true;
                    this.circleCounter = 0;
                    clearInterval(this.currentInterval);
                }
            }, 1500);
        }
        for (let i = 0; i < this.circles.length; i++) {
            if (this.circles[i].getRadius > 1000) {
                this.circles = this.circles
                    .slice(0, i)
                    .concat(this.circles.slice(i + 1));
            } else {
                this.circles[i].setRadius(this.circles[i].getRadius + 1);
                this.circles[i].update();
            }
        }
        this.ctx.restore();
    }
    public update(elapsed: number) {
        this.draw(elapsed);
    }
}
