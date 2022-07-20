import { Vector, add } from './helpers/vector';
import {
    randomItemFromArray,
    randomIntFromRange,
    HSLA,
    randomFloatFromRange,
} from './helpers';
import { Particle } from './classes/particle';
export class Spiral {
    private ctx: CanvasRenderingContext2D;
    private mouse: Vector;
    private particles: Particle[];
    private center = new Vector(0, 0);
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

        this.particles = [];

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.mouse = new Vector(innerWidth / 2, innerHeight / 2);

        for (let i = 0; i < this.Configs.particles; i++) {
            this.createParticle();
        }
        // Event Listeners
        addEventListener('mousemove', (event) => {
            // this.mouse.x = event.clientX;
            // this.mouse.y = event.clientY;
            // this.particles[this.particles.length - 1].setOrigin(this.mouse);
        });

        addEventListener('click', (event) => {
            this.createParticle();
        });

        addEventListener('resize', () => {
            if (this.canvas) {
                this.canvas.width = innerWidth;
                this.canvas.height = innerHeight;

                this.center.set(this.canvas.width / 2, this.canvas.height / 2);

                this.particles = [];
                for (let i = 0; i < this.Configs.particles; i++) {
                    this.createParticle();
                }
            }
        });
        this.init();
    }
    public init() {
        window.requestAnimationFrame(this.animate.bind(this));
    }

    public createParticle() {
        const origin = new Vector(
            randomIntFromRange(0, this.canvas.width),
            randomIntFromRange(0, this.canvas.height)
        );
        const dist = origin.distanceTo(this.center);
        this.particles.push(
            new Particle(
                origin,
                randomIntFromRange(1, 2),
                dist,
                randomIntFromRange(300, this.canvas.width),
                this.Configs.colors[randomIntFromRange(0, 4)],
                this.ctx
            )
        );
    }
    public animate(milliseconds: any) {
        const elapsed = milliseconds - this.Configs.lastStep;
        this.Configs.lastStep = milliseconds;
        if (this.canvas) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.update(elapsed);
        this.ctx.fill();
        window.requestAnimationFrame(this.animate.bind(this));
    }

    public draw(milliseconds: number) {
        const colors = ['#270f36', '#632b6c', '#c76b98', '#f09f9c', '#fcc3a3'];

        this.ctx.save();

        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].getRadius < 0.015) {
                this.particles = this.particles
                    .slice(0, i)
                    .concat(this.particles.slice(i + 1));

                this.createParticle();
            }
            this.particles[i].setOrigin(this.mouse);
            this.particles[i].update();
        }
        this.ctx.restore();
    }
    public update(elapsed: number) {
        this.draw(elapsed);
    }
}
