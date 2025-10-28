/** @jsx createElement */
import { createElement } from './jsx-runtime';
import type { DataPoint } from './data-service';

const palette = ['#8aa4f8', '#6bc9ff', '#9b6bff', '#4dd2a5', '#ffa14d', '#f86b82'];

type ChartType = 'bar' | 'line' | 'pie';

interface ChartSegmentInfo {
  id: number;
  label: string;
  value: number;
  category: string;
  color: string;
}

interface ChartProps {
  data: DataPoint[];
  type: ChartType;
  width?: number;
  height?: number;
  onSegmentClick?: (segment: ChartSegmentInfo) => void;
}

interface CanvasMeta {
  type: ChartType;
  segments: ChartSegmentInfoWithPath[];
  onSegmentClick?: (segment: ChartSegmentInfo) => void;
}

interface ChartSegmentInfoWithPath extends ChartSegmentInfo {
  path: Path2D;
}

type CanvasWithMeta = HTMLCanvasElement & {
  __chartMeta?: CanvasMeta;
  __listenersAttached?: boolean;
};

const Chart = ({ data, type, width = 640, height = 320, onSegmentClick }: ChartProps) => {
  const ref = (node: HTMLElement | null) => {
    if (!node || !(node instanceof HTMLCanvasElement)) {
      return;
    }

    drawChart(node, {
      data,
      type,
      width,
      height,
      onSegmentClick,
    });
  };

  return (
    <div className="chart-container">
      <canvas className="chart-canvas" width={width} height={height} ref={ref}></canvas>
    </div>
  );
};

interface DrawArgs extends ChartProps {
  data: DataPoint[];
}

type DrawOptions = DrawArgs;

function drawChart(canvas: CanvasWithMeta, options: DrawOptions): void {
  const { data, type, width, height, onSegmentClick } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  canvas.width = width ?? canvas.width;
  canvas.height = height ?? canvas.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f6f7fb';

  const meta: CanvasMeta = {
    type,
    segments: [],
    onSegmentClick,
  };

  switch (type) {
    case 'bar':
      drawBarChart(ctx, data, meta, canvas.width, canvas.height);
      break;
    case 'line':
      drawLineChart(ctx, data, meta, canvas.width, canvas.height);
      break;
    case 'pie':
      drawPieChart(ctx, data, meta, canvas.width, canvas.height);
      break;
    default:
      break;
  }

  canvas.__chartMeta = meta;
  attachCanvasInteractions(canvas, ctx);
}

function drawBarChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  meta: CanvasMeta,
  width: number,
  height: number
): void {
  if (data.length === 0) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const padding = 48;
  const gap = 24;
  const maxValue = Math.max(...data.map((point) => point.value));
  const chartHeight = height - padding * 2;
  const barWidth = (width - padding * 2 - gap * (data.length - 1)) / Math.max(data.length, 1);

  data.forEach((point, index) => {
    const scaledHeight = (point.value / maxValue) * chartHeight;
    const x = padding + index * (barWidth + gap);
    const y = height - padding - scaledHeight;
    const color = palette[index % palette.length];

    const path = new Path2D();
    path.rect(x, y, barWidth, scaledHeight);

    ctx.fillStyle = color;
    ctx.fill(path);
  ctx.fillStyle = '#f6f7fb';
  ctx.fillText(String(point.label), x + barWidth / 2, height - padding + 20);
  ctx.fillText(String(point.value), x + barWidth / 2, y - 12);

    meta.segments.push({
      id: point.id,
      label: point.label,
      value: point.value,
      category: point.category,
      color,
      path,
    });
  });
}

function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  meta: CanvasMeta,
  width: number,
  height: number
): void {
  if (data.length === 0) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const padding = 48;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...data.map((point) => point.value));
  const minValue = Math.min(...data.map((point) => point.value));
  const valueRange = Math.max(maxValue - minValue, 1);

  const stepX = chartWidth / Math.max(data.length - 1, 1);

  ctx.strokeStyle = '#6bc9ff';
  ctx.lineWidth = 3;
  ctx.beginPath();

  data.forEach((point, index) => {
    const x = padding + index * stepX;
    const y =
      height -
      padding -
      ((point.value - minValue) / valueRange) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  data.forEach((point, index) => {
    const x = padding + index * stepX;
    const y =
      height -
      padding -
      ((point.value - minValue) / valueRange) * chartHeight;
    const color = palette[index % palette.length];

    const path = new Path2D();
    path.arc(x, y, 8, 0, Math.PI * 2);

    ctx.fillStyle = '#11131a';
    ctx.fill(path);
    ctx.strokeStyle = color;
    ctx.stroke(path);

    ctx.fillStyle = '#f6f7fb';
    ctx.fillText(String(point.value), x - 14, y - 12);

    meta.segments.push({
      id: point.id,
      label: point.label,
      value: point.value,
      category: point.category,
      color,
      path,
    });
  });
}

function drawPieChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  meta: CanvasMeta,
  width: number,
  height: number
): void {
  if (data.length === 0) {
    drawEmptyState(ctx, width, height);
    return;
  }

  const radius = Math.min(width, height) / 2 - 24;
  const centerX = width / 2;
  const centerY = height / 2;
  const total = data.reduce((sum, point) => sum + point.value, 0);
  let startAngle = -Math.PI / 2;

  data.forEach((point, index) => {
    const sliceAngle = (point.value / total) * Math.PI * 2;
    const color = palette[index % palette.length];

    const path = new Path2D();
    path.moveTo(centerX, centerY);
    path.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    path.closePath();

    ctx.fillStyle = color;
    ctx.fill(path);

    const midAngle = startAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(midAngle) * (radius + 20);
    const labelY = centerY + Math.sin(midAngle) * (radius + 20);
    const percentage = ((point.value / total) * 100).toFixed(0);

    ctx.fillStyle = '#f6f7fb';
    ctx.fillText(`${percentage}%`, labelX - 16, labelY);

    meta.segments.push({
      id: point.id,
      label: point.label,
      value: point.value,
      category: point.category,
      color,
      path,
    });

    startAngle += sliceAngle;
  });
}

function drawEmptyState(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('No data available', width / 2, height / 2);
}

function attachCanvasInteractions(canvas: CanvasWithMeta, ctx: CanvasRenderingContext2D): void {
  if (canvas.__listenersAttached) {
    return;
  }

  const getSegmentAt = (x: number, y: number) => {
    const meta = canvas.__chartMeta;
    if (!meta) {
      return null;
    }

    for (const segment of meta.segments) {
      if (ctx.isPointInPath(segment.path, x, y)) {
        return segment;
      }
    }

    return null;
  };

  const handlePointerMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const segment = getSegmentAt(x, y);

    if (segment) {
      canvas.style.cursor = 'pointer';
      canvas.title = `${segment.label} — ${segment.value}`;
    } else {
      canvas.style.cursor = 'default';
      canvas.removeAttribute('title');
    }
  };

  const handlePointerLeave = () => {
    canvas.style.cursor = 'default';
    canvas.removeAttribute('title');
  };

  const handleClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const segment = getSegmentAt(x, y);
    const meta = canvas.__chartMeta;

    if (segment && meta && meta.onSegmentClick) {
      meta.onSegmentClick(segment);
    }
  };

  canvas.addEventListener('mousemove', handlePointerMove);
  canvas.addEventListener('mouseleave', handlePointerLeave);
  canvas.addEventListener('click', handleClick);

  canvas.__listenersAttached = true;
}

export { Chart, type ChartProps, type ChartSegmentInfo, type ChartType };
