interface SuspenseFallbackProps {
  height?: string;
  width?: string;
  className?: string;
}

export default function SuspenseFallback({
  height = "h-10",
  width = "w-full",
  className = "",
}: SuspenseFallbackProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${height} ${width} ${className}`}
    />
  );
}
