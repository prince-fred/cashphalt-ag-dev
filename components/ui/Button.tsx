import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "outline";
    size?: "sm" | "md" | "lg";
    children: ReactNode;
}

export function Button({
    className,
    variant = "primary",
    size = "md",
    children,
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-signal-yellow text-matte-black hover:opacity-90 active:scale-[0.98]",
        secondary: "bg-matte-black text-white hover:opacity-90 active:scale-[0.98]",
        danger: "bg-error-red text-white hover:opacity-90",
        outline: "border-2 border-matte-black text-matte-black bg-transparent hover:bg-black/5",
    };

    const sizes = {
        sm: "h-9 px-4 text-sm rounded-md",
        md: "h-12 px-6 text-base rounded-md",
        lg: "h-14 px-8 text-lg rounded-lg",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
