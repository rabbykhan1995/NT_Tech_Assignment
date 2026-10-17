import { useRef, useCallback } from "react";

interface RangeSliderProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  showTicks?: boolean;
  tickCount?: number;
  className?: string;
}

export function RangeSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  unit = "",
  showTicks = true,
  tickCount = 5,
  className = "",
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  // Generate tick marks
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const tickValue = min + (i / (tickCount - 1)) * (max - min);
    const tickPercent = ((tickValue - min) / (max - min)) * 100;
    return { value: Math.round(tickValue), percent: tickPercent };
  });

  return (
    <div className={`w-full select-none ${className}`}>
      {/* Label + Value display */}
      {label && (
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">
            {label}
          </label>
          <div className="flex items-baseline gap-0.5 tabular-nums">
            <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none transition-all duration-150">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {unit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Slider Track Container */}
      <div className="relative pt-1 pb-6" ref={trackRef}>
        {/* Background track */}
        <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700">
          {/* Filled track */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400 transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />

          {/* Native range input (invisible but functional) */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="
              absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10
              [&::-webkit-slider-thumb]:opacity-0
              [&::-moz-range-thumb]:opacity-0
            "
          />

          {/* Custom thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-75"
            style={{ left: `${percentage}%` }}
          >
            <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500 dark:border-indigo-400 shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            </div>
          </div>
        </div>

        {/* Tick marks */}
        {showTicks && (
          <div className="relative mt-3">
            {ticks.map((tick,i) => (
              <div
                key={`${tick.value+i}`}
                className="absolute flex flex-col items-center -translate-x-1/2"
                style={{ left: `${tick.percent}%` }}
              >
                <div
                  className={`w-0.5 h-1.5 rounded-full transition-colors ${
                    value >= tick.value
                      ? "bg-indigo-400 dark:bg-indigo-400"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
                <span className="mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 tabular-nums">
                  {tick.value}
                  {unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}