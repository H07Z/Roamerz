/**
 * Path - Phase 7
 * Represents a path found by A*
 * Holds nodes, current index, and methods for following
 */

export interface PathNode {
  x: number;
  y: number;
}

export enum PathStatus {
  NOT_FOUND = 'NOT_FOUND',
  FOUND = 'FOUND',
  FOLLOWING = 'FOLLOWING',
  REACHED = 'REACHED',
  FAILED = 'FAILED',
  INVALID = 'INVALID'
}

export class Path {
  public readonly nodes: PathNode[];
  public readonly start: PathNode;
  public readonly destination: PathNode;
  public status: PathStatus;
  private currentIndex: number = 0;

  constructor(nodes: PathNode[], status: PathStatus = PathStatus.FOUND) {
    this.nodes = nodes;
    this.start = nodes[0] ?? { x: 0, y: 0 };
    this.destination = nodes[nodes.length - 1] ?? { x: 0, y: 0 };
    this.status = status;
    this.currentIndex = 0;
  }

  static notFound(start: PathNode, dest: PathNode): Path {
    const path = new Path([], PathStatus.NOT_FOUND);
    (path as any).start = start;
    (path as any).destination = dest;
    return path;
  }

  static failed(start: PathNode, dest: PathNode): Path {
    const path = new Path([], PathStatus.FAILED);
    (path as any).start = start;
    (path as any).destination = dest;
    return path;
  }

  getLength(): number {
    return this.nodes.length;
  }

  getCurrentNode(): PathNode | null {
    if (this.currentIndex >= this.nodes.length) return null;
    return this.nodes[this.currentIndex];
  }

  getNextNode(): PathNode | null {
    if (this.currentIndex + 1 >= this.nodes.length) return null;
    return this.nodes[this.currentIndex + 1];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  advance(): boolean {
    if (this.currentIndex < this.nodes.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  isComplete(): boolean {
    return this.currentIndex >= this.nodes.length - 1;
  }

  isFound(): boolean {
    return this.status === PathStatus.FOUND || this.status === PathStatus.FOLLOWING;
  }

  isFailed(): boolean {
    return this.status === PathStatus.NOT_FOUND || this.status === PathStatus.FAILED || this.status === PathStatus.INVALID;
  }

  getRemainingNodes(): PathNode[] {
    return this.nodes.slice(this.currentIndex);
  }

  // For debugging: get path as string
  toString(): string {
    return `Path(${this.status}) length=${this.nodes.length} current=${this.currentIndex} start=${this.start.x},${this.start.y} dest=${this.destination.x},${this.destination.y}`;
  }

  // Validate path against grid (check if any node is blocked)
  validate(isWalkable: (x: number, y: number) => boolean): boolean {
    for (const node of this.nodes) {
      if (!isWalkable(node.x, node.y)) {
        this.status = PathStatus.INVALID;
        return false;
      }
    }
    return true;
  }
}
