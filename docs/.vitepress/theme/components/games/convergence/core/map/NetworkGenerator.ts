export interface NetworkNode {
  id: string;
  connections: string[];
}

export class NetworkGenerator {
  constructor(private readonly seed = Date.now()) {}

  public generate(count = 8): NetworkNode[] {
    const nodes: NetworkNode[] = Array.from({ length: count }, (_, i) => ({
      id: `node-${i}`,
      connections: [],
    }));

    for (let i = 1; i < count; i++) {
      const target = Math.floor(Math.random() * i);
      nodes[i].connections.push(nodes[target].id);
      nodes[target].connections.push(nodes[i].id);
    }

    return nodes;
  }
}
