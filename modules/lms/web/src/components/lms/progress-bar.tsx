'use client';

interface ProgressBarProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  showPercentage?: boolean;
  animated?: boolean;
}

const sizeStyles: Record<string, { bar: string; text: string; label: string }> = {
  sm: { bar: 'h-1.5', text: 'text-xs', label: 'text-xs' },
  md: { bar: 'h-2.5', text: 'text-sm', label: 'text-sm' },
  lg: { bar: 'h-4', text: 'text-sm', label: 'text-base' },
};

const colorStyles: Record<string, { fill: string; bg: string; text: string }> = {
  blue: { fill: 'bg-primary', bg: 'bg-primary/10', text: 'text-primary' },
  green: { fill: 'bg-success', bg: 'bg-success/10', text: 'text-success' },
  yellow: { fill: 'bg-warning', bg: 'bg-warning/10', text: 'text-warning' },
  red: { fill: 'bg-destructive', bg: 'bg-destructive/10', text: 'text-destructive' },
  purple: { fill: 'bg-accent', bg: 'bg-accent/10', text: 'text-accent' },
  indigo: { fill: 'bg-secondary', bg: 'bg-secondary/10', text: 'text-secondary-foreground' },
};

export default function ProgressBar({
  value,
  label,
  size = 'md',
  color = 'blue',
  showPercentage = true,
  animated = true,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const rounded = Math.round(clampedValue);

  const sizeStyle = sizeStyles[size];
  const colorStyle = colorStyles[color];

  return (
    <div className="w-full">
      {/* Label and percentage header */}
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <span className={`font-medium text-foreground ${sizeStyle.label}`}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={`font-medium ${colorStyle.text} ${sizeStyle.text}`}>
              {rounded}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={`w-full overflow-hidden rounded-full ${colorStyle.bg} ${sizeStyle.bar}`}
        role="progressbar"
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${rounded}%` : `${rounded}% complete`}
      >
        {/* Fill */}
        <div
          className={`${sizeStyle.bar} rounded-full ${colorStyle.fill} ${
            animated ? 'transition-all duration-500 ease-out' : ''
          }`}
          style={{ width: `${clampedValue}%` }}
        >
          {/* Inline percentage for large size */}
          {size === 'lg' && clampedValue >= 15 && (
            <span className="flex h-full items-center justify-center text-xs font-semibold text-white">
              {rounded}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
