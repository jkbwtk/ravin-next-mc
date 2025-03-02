import { Vec3 } from 'vec3';

export interface Extremes {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export class Perimeter {
  public readonly points: Vec3[];
  public extremes: Extremes = null!;

  public originPoints: [Vec3, Vec3] = null!;
  public edges: [Vec3, Vec3, Vec3, Vec3] = null!;

  public center: Vec3 = null!;

  private positiveAdjustment: Vec3;
  private negativeAdjustment: Vec3;

  constructor(points: Vec3[]) {
    if (points.length < 2) {
      throw new Error('Points array should contain at least 2 points');
    }

    this.points = points;

    this.positiveAdjustment = new Vec3(0, 0, 0);
    this.negativeAdjustment = new Vec3(0, 0, 0);

    this.recalculateParameters();
  }

  private recalculateParameters() {
    this.extremes = Perimeter.getExtremes(
      this.points,
      this.positiveAdjustment,
      this.negativeAdjustment,
    );
    this.originPoints = Perimeter.getOriginPoints(this.extremes);
    this.edges = Perimeter.getEdges(this.extremes);
    this.center = Perimeter.getCenter(this.originPoints);
  }

  private static getExtremes(
    points: Vec3[],
    positiveAdjustment: Vec3,
    negativeAdjustment: Vec3,
  ): Extremes {
    return points.reduce(
      (prev, cur) => ({
        minX: Math.min(prev.minX, cur.x - positiveAdjustment.x),
        maxX: Math.max(prev.maxX, cur.x + positiveAdjustment.x),
        minY: Math.min(prev.minY, cur.y - positiveAdjustment.y),
        maxY: Math.max(prev.maxY, cur.y + positiveAdjustment.y),
        minZ: Math.min(prev.minZ, cur.z - negativeAdjustment.z),
        maxZ: Math.max(prev.maxZ, cur.z + positiveAdjustment.z),
      }),
      {
        minX: points.at(0)!.x,
        maxX: points.at(0)!.x,
        minY: points.at(0)!.y,
        maxY: points.at(0)!.y,
        minZ: points.at(0)!.z,
        maxZ: points.at(0)!.z,
      },
    );
  }

  private static getOriginPoints(extremes: Extremes): [Vec3, Vec3] {
    const e = extremes;

    return [new Vec3(e.minX, e.minY, e.minZ), new Vec3(e.maxX, e.maxY, e.maxZ)];
  }

  private static getEdges(extremes: Extremes): [Vec3, Vec3, Vec3, Vec3] {
    const e = extremes;

    return [
      new Vec3(e.maxX, e.minY, e.maxZ),
      new Vec3(e.minX, e.minY, e.maxZ),
      new Vec3(e.minX, e.minY, e.minZ),
      new Vec3(e.maxX, e.minY, e.minZ),
    ];
  }

  private static getCenter(originPoints: [Vec3, Vec3]): Vec3 {
    return originPoints[0].clone().add(originPoints[1]).scale(0.5);
  }

  public isInPerimeter(point: Vec3): boolean {
    const e = this.extremes;

    return (
      point.x >= e.minX &&
      point.x <= e.maxX &&
      point.y >= e.minY &&
      point.y <= e.maxY &&
      point.z >= e.minZ &&
      point.z <= e.maxZ
    );
  }

  public adjust(positive: Vec3, negative: Vec3) {
    this.positiveAdjustment = positive;
    this.negativeAdjustment = negative;

    this.recalculateParameters();

    return this;
  }
}
