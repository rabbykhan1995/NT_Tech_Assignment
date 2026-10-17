import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";

type DropdownProps<T> = {
    value: T;
    options: T[];
    onChange: (value: T) => void;
    title?: string | null;
    idKey?: string;
    labelKey?: string;
    usePortal?: boolean;
};

const MAX_HEIGHT = 240; // max-h-60
const ITEM_HEIGHT = 36; // py-2 + text-sm
const GAP = 4;
const VIEWPORT_PADDING = 8;

type Position = {
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    openUp: boolean;
    maxHeight: number;
};

export function Dropdown<T>({
    value,
    options,
    onChange,
    title = null,
    idKey = "id",
    labelKey = "name",
    usePortal = false,
}: DropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<Position>({
        left: 0,
        width: 0,
        openUp: false,
        maxHeight: MAX_HEIGHT,
    });

    // close outside click (portal dropdown-o count korbe)
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            const target = e.target as Node;

            if (
                ref.current &&
                !ref.current.contains(target) &&
                !(dropdownRef.current && dropdownRef.current.contains(target))
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("click", handleOutside);
        return () => document.removeEventListener("click", handleOutside);
    }, []);

    // niche/upore kothay khulbe ta calculate
    const updatePosition = useCallback(() => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_PADDING;
        const spaceAbove = rect.top - GAP - VIEWPORT_PADDING;

        // list-er asol height (beshi hole MAX_HEIGHT porjonto)
        const desiredHeight = Math.min(MAX_HEIGHT, options.length * ITEM_HEIGHT + 4);

        // niche jayga na thakle ar upore beshi thakle upore kholo
        const openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
        const available = openUp ? spaceAbove : spaceBelow;

        setPosition({
            top: openUp ? undefined : rect.bottom + GAP,
            bottom: openUp ? window.innerHeight - rect.top + GAP : undefined,
            left: rect.left,
            width: rect.width,
            openUp,
            maxHeight: Math.max(80, Math.min(MAX_HEIGHT, available)),
        });
    }, [options.length]);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();

        const handleScroll = (e: Event) => {
            // dropdown-er nijer scroll hole reposition lagbe na
            if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
            updatePosition();
        };

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", handleScroll, true); // nested scroll container-o dhorbe
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [open, updatePosition]);

    // label resolve
    const getLabel = (opt: any) => {
        if (opt && typeof opt === "object") {
            return opt[labelKey] ?? opt.name ?? opt.id;
        }
        return opt;
    };

    const getValue = (opt: any) => {
        if (opt && typeof opt === "object") {
            return opt[idKey] ?? opt.value ?? opt.id;
        }
        return opt;
    };

    const selectedOption = (options as any[]).find(
        (opt: any) => getValue(opt) === getValue(value)
    );
    const selectedLabel = selectedOption ? getLabel(selectedOption) : "Select...";

    const renderDropdown = () => (
        <div
            ref={dropdownRef}
            className={`${
                usePortal
                    ? "fixed"
                    : `absolute left-0 w-full ${
                          position.openUp ? "bottom-full mb-1" : "top-full mt-1"
                      }`
            } bg-white dark:bg-[#1c1d22] border-2 border-green-600 rounded-sm shadow-lg overflow-y-auto z-[99999]`}
            style={
                usePortal
                    ? {
                          top: position.top,
                          bottom: position.bottom,
                          left: position.left,
                          width: position.width,
                          maxHeight: position.maxHeight,
                      }
                    : { maxHeight: position.maxHeight }
            }
        >
            {options.map((opt: any, idx) => {
                const optValue = getValue(opt);

                return (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => {
                            onChange(opt);
                            setOpen(false);
                        }}
                        className={`w-full text-left dark:text-white px-4 py-2 text-sm transition ${
                            optValue === getValue(value)
                                ? "bg-[#7c7ce0]"
                                : "hover:bg-orange-500"
                        }`}
                    >
                        {getLabel(opt)}
                    </button>
                );
            })}
        </div>
    );

    return (
        <>
            <div ref={ref} className="relative w-full">
                <button
                    type="button"
                    onClick={() => setOpen((p) => !p)}
                    className="flex items-center justify-between w-full px-3 py-[6px] border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-[#343A3F] text-sm"
                >
                    <span className="text-gray-700 dark:text-white">
                        {selectedLabel}
                        {title && <span className="opacity-50 ml-1">{title}</span>}
                    </span>

                    <ChevronDown
                        size={14}
                        className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </button>

                {!usePortal && open && renderDropdown()}
            </div>

            {usePortal &&
                open &&
                typeof document !== "undefined" &&
                createPortal(renderDropdown(), document.body)}
        </>
    );
}