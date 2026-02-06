import { InputHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
    min: number
    max: number
    value: number
    step?: number
    onValueChange: (value: number) => void
}

export function Slider({ min, max, value, step = 1, onValueChange, className, ...props }: SliderProps) {
    // Calculate percentage for background gradient
    const percentage = ((value - min) / (max - min)) * 100

    return (
        <div className="relative w-full h-6 flex items-center">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onValueChange(Number(e.target.value))}
                className={twMerge(
                    "w-full absolute z-20 opacity-0 cursor-pointer h-full",
                    className
                )}
                {...props}
            />
            {/* Custom Track */}
            <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-200 rounded-full -translate-y-1/2 overflow-hidden">
                <div
                    className="h-full bg-matte-black transition-all duration-150 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {/* Custom Thumb (Visual Only - positioned by percentage) */}
            <div
                className="absolute top-1/2 w-6 h-6 bg-signal-yellow border-2 border-matte-black rounded-full -translate-y-1/2 z-10 pointer-events-none transition-all duration-150 ease-out shadow-sm flex items-center justify-center transform -translate-x-1/2"
                style={{ left: `${percentage}%` }}
            >
                <div className="w-1.5 h-1.5 bg-matte-black rounded-full" />
            </div>
        </div>
    )
}
