import { Minus, Plus } from "lucide-react";
import React from "react";

type IncrDecrButtonProps = {
  max?: number;
  min?: number;
  currentQty: number;
  decimal?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
};

const IncrDecrButton = ({
  max = Infinity,
  min = 0,
  currentQty,
  decimal = false,
  disabled = false,
  onChange,
}: IncrDecrButtonProps) => {
  const step =   1;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      onChange(0);
      return;
    }

    const numValue = Number(value);

    if (isNaN(numValue)) return;

    if (!decimal && !Number.isInteger(numValue)) return;

    if (numValue > max) {
      onChange(max);
      return;
    }

    if (numValue < min) {
      onChange(min);
      return;
    }

    onChange(numValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, currentQty - step);
    onChange(Number(newValue.toFixed(decimal ? 2 : 0)));
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, currentQty + step);
    onChange(Number(newValue.toFixed(decimal ? 2 : 0)));
  };

  return (
    <div className="flex items-center overflow-hidden w-fit">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || currentQty <= min}
         className="global_input h-7 rounded-none border-r-0 outline-none ring-0"
      >
        <Minus size={13} />
      </button>

      <input
        type="number"
        value={currentQty === 0 ? "" : currentQty}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (!decimal && (e.key === "." || e.key === ",")) {
            e.preventDefault();
          }
        }}
        step={decimal ? "0.01" : "1"}
        disabled={disabled}
        className="w-16 h-7 text-center global_input px-px rounded-none outline-none ring-0"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || currentQty >= max}
        className=" global_input border-l-0 h-7 rounded-none outline-none ring-0"
      >
        <Plus size={13} className="" />
      </button>
    </div>
  );
};

export default IncrDecrButton;