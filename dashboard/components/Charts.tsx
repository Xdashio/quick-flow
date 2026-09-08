'use client';

import React, { useState } from 'react';

// --- SPARKLINE MINI ---
export interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function SparklineMini({
  data,
  color = '#10B981',
  height = 36,
  width = 120,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div style={{ height, width, background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const lastPoint = points[points.length - 1].split(',');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L ${width},${height} L 0,${height} Z`}
        fill={`url(#spark-grad-${color.replace('#', '')})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint.length === 2 && (
        <circle
          cx={parseFloat(lastPoint[0])}
          cy={parseFloat(lastPoint[1])}
          r="3.5"
          fill={color}
        />
      )}
    </svg>
  );
}

// --- AREA TREND CHART ---
export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface AreaTrendChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function AreaTrendChart({
  title,
  subtitle,
  data,
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981',
  height = 240,
  valuePrefix = '',
  valueSuffix = '',
}: AreaTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="section">
        <div className="empty">No trend data available</div>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10);
  const paddingBottom = 30;
  const paddingTop = 20;
  const chartHeight = height - paddingBottom - paddingTop;
  const svgWidth = 600;
  const paddingX = 40;
  const usableWidth = svgWidth - paddingX * 2;

  const getX = (index: number) => {
    if (data.length === 1) return svgWidth / 2;
    return paddingX + (index / (data.length - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxValue) * chartHeight;
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaD = pathD ? `${pathD} L ${getX(data.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z` : '';

  const totalValue = values.reduce((a, b) => a + b, 0);
  const avgValue = Math.round(totalValue / values.length);

  return (
    <div className="section">
      <div className="section-header" style={{ flexWrap: 'wrap', rowGap: 8 }}>
        <div>
          <h3>{title}</h3>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-gray">
            Total: <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>{valuePrefix}{totalValue.toLocaleString()}{valueSuffix}</span>
          </span>
          <span className="badge badge-gray">
            Avg: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{valuePrefix}{avgValue.toLocaleString()}{valueSuffix}</span>
          </span>
        </div>
      </div>

      <div className="section-body" style={{ overflowX: 'auto', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          style={{ width: '100%', minWidth: 500, height: 'auto', userSelect: 'none' }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio;
            const gridVal = Math.round(maxValue * (1 - ratio));
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="currentColor"
                  opacity="0.4"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Area & Line */}
          {areaD && <path d={areaD} fill="url(#areaGradient)" />}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis labels */}
          {data.map((d, i) => {
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity={hoveredIdx === i ? '1' : '0.5'}
                fontWeight={hoveredIdx === i ? '600' : '400'}
              >
                {d.label}
              </text>
            );
          })}

          {/* Points & Interactive Hover */}
          {data.map((d, i) => {
            const x = getX(i);
            const y = getY(d.value);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Transparent hit area */}
                <rect
                  x={x - usableWidth / (data.length * 2)}
                  y={paddingTop}
                  width={usableWidth / data.length}
                  height={chartHeight}
                  fill="transparent"
                />
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke={primaryColor}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? primaryColor : 'var(--bg-surface)'}
                  stroke={primaryColor}
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Floating Overlay */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="section"
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              top: 8,
              padding: '8px 12px',
              fontSize: 12,
              boxShadow: 'var(--shadow-elevated)',
              left: `${Math.min(
                Math.max(10, (hoveredIdx / (data.length - 1)) * 80 + 10),
                75
              )}%`,
            }}
          >
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {data[hoveredIdx].label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-primary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: primaryColor, display: 'inline-block' }} />
              <span className="font-bold">
                {valuePrefix}{data[hoveredIdx].value.toLocaleString()}{valueSuffix}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- BAR DISTRIBUTION CHART ---
export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface BarDistributionChartProps {
  title: string;
  subtitle?: string;
  data: BarChartItem[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function BarDistributionChart({
  title,
  subtitle,
  data,
  valuePrefix = '',
  valueSuffix = '',
}: BarDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="section">
        <div className="empty">No distribution data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>

      <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((item, idx) => {
          const pct = Math.round((item.value / (totalValue || 1)) * 100);
          const barWidthPct = Math.max(Math.round((item.value / maxValue) * 100), 2);
          const itemColor = item.color || colors[idx % colors.length];

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span className="font-bold" style={{ color: 'var(--text-primary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                  </span>
                  <span className="badge badge-gray">
                    {pct}%
                  </span>
                </div>
              </div>
              <div style={{ height: 10, width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-pill)', background: 'var(--bg-surface-subtle)' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 'var(--radius-pill)',
                    width: `${barWidthPct}%`,
                    backgroundColor: itemColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
