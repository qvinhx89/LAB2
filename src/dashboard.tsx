/** @jsx createElement */
import { createElement, useState } from './jsx-runtime';
import { Card, Modal } from './components';
import { Counter } from './counter';
import { TodoApp } from './todo-app';
import { Chart, type ChartType, type ChartSegmentInfo } from './chart';
import { DataService, type DataPoint } from './data-service';

const dataService = new DataService();
dataService.start(4_000);

const chartTypes: ChartType[] = ['line', 'bar', 'pie'];
const timeRanges = [15, 30, 60, 120];

const Dashboard = () => {
  const [data, setData] = useState<DataPoint[]>(dataService.getSnapshot());
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(60);
  const [activeSegment, setActiveSegment] = useState<ChartSegmentInfo | null>(null);
  const [_subscription] = useState(() =>
    dataService.subscribe((nextData) => {
      setData(() => [...nextData]);
    })
  );

  const categories = ['all', ...dataService.getCategories()];
  const filteredData = data
    .filter((point) => {
      const matchesCategory = selectedCategory === 'all' || point.category === selectedCategory;
      const matchesRange = point.timestamp >= Date.now() - timeRange * 60_000;
      return matchesCategory && matchesRange;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  const stats = dataService.getStats(filteredData);

  const handleSegmentClick = (segment: ChartSegmentInfo) => {
    setActiveSegment(() => segment);
  };

  const closeModal = () => setActiveSegment(null);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 style={{ margin: 0 }}>Realtime Analytics Dashboard</h1>
          <p style={{ marginTop: 8, opacity: 0.7 }}>Custom JSX + TypeScript runtime demo</p>
        </div>
        <div className="control-group">
          <select
            value={chartType}
            onChange={(event: Event) => {
              const target = event.target as HTMLSelectElement;
              setChartType(target.value as ChartType);
            }}
          >
            {chartTypes.map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(event: Event) => {
              const target = event.target as HTMLSelectElement;
              setSelectedCategory(target.value);
            }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          <select
            value={String(timeRange)}
            onChange={(event: Event) => {
              const target = event.target as HTMLSelectElement;
              setTimeRange(Number(target.value));
            }}
          >
            {timeRanges.map((range) => (
              <option key={range} value={range}>
                Last {range} minutes
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-grid">
        <Card
          title="Analytics"
          subtitle={`Tracking ${filteredData.length} events${
            selectedCategory && selectedCategory !== 'all' ? ` (${selectedCategory})` : ''
          }`}
        >
          <Chart data={filteredData} type={chartType} onSegmentClick={handleSegmentClick} />
          <div className="summary" style={{ marginTop: 24 }}>
            <div className="summary-item">
              <strong>Total</strong>
              <div>{Math.round(stats.total)}</div>
            </div>
            <div className="summary-item">
              <strong>Average</strong>
              <div>{stats.average.toFixed(1)}</div>
            </div>
            <div className="summary-item">
              <strong>Max</strong>
              <div>{stats.max}</div>
            </div>
            <div className="summary-item">
              <strong>Min</strong>
              <div>{stats.min}</div>
            </div>
          </div>
        </Card>

        <Card title="Team Productivity" subtitle="Manual counter demo">
          <Counter initialCount={36} />
        </Card>

        <Card title="Tasks" subtitle="Lightweight todo list">
          <TodoApp />
        </Card>
      </div>

      <Modal
        isOpen={Boolean(activeSegment)}
        onClose={closeModal}
        title={activeSegment ? `Data Point — ${activeSegment.label}` : undefined}
        footer={
          <button onClick={closeModal} style={{ padding: '0.5rem 1rem' }}>
            Close
          </button>
        }
      >
        {activeSegment ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <strong>Value:</strong> {activeSegment.value}
            </li>
            <li>
              <strong>Category:</strong> {activeSegment.category}
            </li>
            <li>
              <strong>Color:</strong> {activeSegment.color}
            </li>
          </ul>
        ) : null}
      </Modal>
    </div>
  );
};

export { Dashboard };
