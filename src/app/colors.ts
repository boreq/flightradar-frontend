export class Color {

  constructor(public r: number, public g: number, public b: number) {}

  rgb(): string {
    return 'rgb(' + [this.r, this.g, this.b].join(', ') + ')';
  }

  rgba(a: number): string {
    return 'rgba(' + [this.r, this.g, this.b, a].join(', ') + ')';
  }
}

export const colors = {
  turquoise: new Color(26, 188, 156),
  green: new Color(46, 204, 113),
  blue: new Color(52, 152, 219),
  violet: new Color(155, 89, 182),
  asphalt: new Color(52, 73, 94),
  yellow: new Color(241, 196, 15),
  orange: new Color(230, 126, 34),
  red: new Color(231, 76, 60),
  white: new Color(236, 240, 241),
  grey:  new Color(149, 165, 166),
};
