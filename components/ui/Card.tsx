import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bg-white border border-slate-outline rounded-xl shadow-sm p-5",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
