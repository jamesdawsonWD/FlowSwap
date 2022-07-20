export const randomIntFromRange = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1) + min);
export const randomFloatFromRange = (min: number, max: number): number =>
    Math.random() * (max - min) + min;
export const randomItemFromArray = (items: any[]): any =>
    items[Math.floor(Math.random() * items.length)];
export const inverseNumber = (i: number, max: number): number => max - i;

export class HSLA {
    constructor(
        private h: number,
        private s: number,
        private l: number,
        private a: number
    ) {}
    public setLight(light: number) {
        this.l = light;
    }
    public setSaturdation(saturdation: number) {
        this.s = saturdation;
    }
    public setHue(hue: number) {
        this.h = hue;
    }
    public setAlpha(alpha: number) {
        this.a = alpha;
    }
    public increaseLight(light: number) {
        this.l + light;
    }
    get alpha(): number {
        return this.a;
    }
    get hue(): number {
        return this.h;
    }
    get saturation(): number {
        return this.s;
    }
    get light(): number {
        return this.l;
    }
    get HSLA(): HSLA {
        return this;
    }
    public toString(): string {
        return (
            'hsla(' +
            this.h +
            ',' +
            this.s +
            '%,' +
            this.l +
            '%,' +
            this.a +
            ')'
        );
    }
}
