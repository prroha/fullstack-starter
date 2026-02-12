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
  blue: { fill: 'bg-blue-600', bg: 'bg-blue-100', text: 'text-blue-700' },
  green: { fill: 'bg-green-600', bg: 'bg-green-100', text: 'text-green-700' },
  yellow: { fill: 'bg-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  red: { fill: 'bg-red-600', bg: 'bg-red-100', text: 'text-red-700' },
  purple: { fill: 'bg-purple-600', bg: 'bg-purple-100', text: 'text-purple-700' },
  indigo: { fill: 'bg-indigo-600', bg: 'bg-indigo-100', text: 'text-indigo-700' },
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
            <span className={`font-medium text-gray-700 ${sizeStyle.label}`}>
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
