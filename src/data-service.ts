export interface DataPoint {
  id: number;
  label: string;
  value: number;
  category: string;
  timestamp: number;
}

type DataSubscriber = (data: DataPoint[]) => void;

type DataFilterOptions = {
  category?: string;
  rangeMinutes?: number;
};

export class DataService {
  private data: DataPoint[] = [];
  private subscribers = new Set<DataSubscriber>();
  private timer: number | null = null;
  private readonly categories: string[];
  private readonly maxHistory: number;

  constructor(categories: string[] = ['Revenue', 'Users', 'Engagement', 'Performance'], historyLength = 60) {
    this.categories = categories;
    this.maxHistory = historyLength;
    this.data = this.generateMockData(18);
  }

  getCategories(): string[] {
    return [...this.categories];
  }

  getSnapshot(): DataPoint[] {
    return [...this.data];
  }

  subscribe(callback: DataSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getSnapshot());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  start(intervalMs = 4_000): void {
    if (this.timer !== null) {
      return;
    }

    this.timer = window.setInterval(() => {
      this.appendRandomPoint();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  generateMockData(count: number): DataPoint[] {
    const now = Date.now();
    const step = 60_000; // one minute per step
    const points: DataPoint[] = [];

    for (let i = count - 1; i >= 0; i -= 1) {
      const timestamp = now - i * step;
      points.push(this.createPoint(timestamp));
    }

    return points;
  }

  filterData(options: DataFilterOptions): DataPoint[] {
    const snapshot = this.getSnapshot();
    let result = snapshot;

    if (options.category && options.category !== 'all') {
      result = result.filter((point) => point.category === options.category);
    }

    if (options.rangeMinutes && options.rangeMinutes > 0) {
      const threshold = Date.now() - options.rangeMinutes * 60_000;
      result = result.filter((point) => point.timestamp >= threshold);
    }

    return result;
  }

  getStats(data: DataPoint[] = this.data): { average: number; max: number; min: number; total: number } {
    if (data.length === 0) {
      return { average: 0, max: 0, min: 0, total: 0 };
    }

    const values = data.map((point) => point.value);
    const total = values.reduce((sum, value) => sum + value, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      average: total / values.length,
      max,
      min,
      total,
    };
  }

  private appendRandomPoint(): void {
    const timestamp = Date.now();
    const nextPoint = this.createPoint(timestamp);
    this.data = [...this.data.slice(-(this.maxHistory - 1)), nextPoint];
    this.emit();
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    this.subscribers.forEach((callback) => callback(snapshot));
  }

  private createPoint(timestamp: number): DataPoint {
    const category = this.categories[Math.floor(Math.random() * this.categories.length)];
    let base: number;
    switch (category) {
      case 'Revenue':
        base = Math.random() * 500 + 100; // 100-600
        break;
      case 'Users':
        base = Math.random() * 200 + 50; // 50-250
        break;
      case 'Engagement':
        base = Math.random() * 100 + 20; // 20-120
        break;
      case 'Performance':
        base = Math.random() * 80 + 10; // 10-90
        break;
      default:
        base = Math.random() * 100;
    }
    const trend = Math.sin(timestamp / 600_000) * 20; // simple oscillation
    const noise = (Math.random() - 0.5) * 25;
    const value = Math.max(5, Math.round(base + trend + noise));

    return {
      id: timestamp,
      label: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value,
      category,
      timestamp,
    };
  }
}
