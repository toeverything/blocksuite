interface IParams {
  getWalkable?: (current: number[], next: number[]) => boolean;
  getCost?: (xy: number[], basic: number) => number;
}

export class Grid {
  static basicCost = 1;

  grid: number[][];
  points: number[][];
  pointMap: number[][][];

  costs: number[][] = [];
  xAxis: number[] = [];
  yAxis: number[] = [];
  params?: IParams;

  constructor(points: number[][], params?: IParams) {
    this.points = points;
    this.grid = [];
    this.pointMap = [];
    this.params = params;
    this.setup();
  }

  setup() {
    const { getCost } = this.params || {};
    const points = this.points;
    const xSet = new Set<number>();
    const ySet = new Set<number>();

    points.forEach(item => {
      xSet.add(item[0]);
      ySet.add(item[1]);
    });

    const row = ySet.size;
    const col = xSet.size;

    const xAxis = Array.from(xSet.values());
    const yAxis = Array.from(ySet.values());

    xAxis.sort((a, b) => a - b);
    yAxis.sort((a, b) => a - b);

    const grid = Array.from({ length: row }, () => new Array(col).fill(0));
    const costs = Array.from({ length: row }, () =>
      new Array(col).fill(Grid.basicCost)
    );
    const pointMap: number[][][] = Array.from(
      { length: row },
      () => new Array(col)
    );

    for (let i = 0; i < row; i++) {
      for (let j = 0; j < col; j++) {
        pointMap[i][j] = [xAxis[j], yAxis[i]];
        grid[i][j] = true;
        if (getCost) {
          costs[i][j] = getCost(pointMap[i][j], Grid.basicCost);
        }
      }
    }

    this.grid = grid;
    this.pointMap = pointMap;
    this.yAxis = yAxis;
    this.xAxis = xAxis;
    this.costs = costs;
  }

  getGridPoint(realPoint: number[]) {
    return [this.yAxis.indexOf(realPoint[1]), this.xAxis.indexOf(realPoint[0])];
  }

  getRealPoint(point: number[]) {
    return this.pointMap[point[0]][point[1]];
  }

  isWalkable(current: number[], next: number[]) {
    const { getWalkable } = this.params || {};

    return (
      this.isValid(next) &&
      (getWalkable
        ? getWalkable(this.getRealPoint(current), this.getRealPoint(next))
        : true)
    );
  }

  getCost(point: number[]) {
    return this.costs[point[0]][point[1]];
  }

  private isValid(p: number[]) {
    const row = this.grid.length;
    const col = this.grid[0].length;

    return p[0] >= 0 && p[0] < row && p[1] >= 0 && p[1] < col;
  }
}
