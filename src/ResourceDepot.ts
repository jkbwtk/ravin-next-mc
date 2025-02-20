export class ResourceDepot<T> {
  private resources: T[] = [];

  private available: Set<number> = new Set();
  private claimed: Set<number> = new Set();

  constructor(resources: T[]) {
    this.resources = resources;

    this.available = new Set(this.resources.map((_v, i) => i));
  }

  public claim(): [id: number, resource: T] | [null, null] {
    const id = Array.from(this.available).at(0);

    if (typeof id === 'number') {
      const resource = this.resources.at(id);

      if (resource !== undefined) {
        this.claimed.add(id);
        this.available.delete(id);

        return [id, this.resources[id]!];
      }
    }

    return [null, null];
  }

  public release(id: number): boolean {
    if (this.claimed.has(id)) {
      this.claimed.delete(id);
      this.available.add(id);

      return true;
    }

    return false;
  }

  public add(resource: T) {
    this.available.add(this.resources.push(resource));
  }

  public getAvailable(): number {
    return this.available.size;
  }

  public getClaimed(): number {
    return this.claimed.size;
  }

  public getTotal(): number {
    return this.resources.length;
  }

  public getById(id: number): T | undefined {
    return this.resources.at(id);
  }
}
