import React, { forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-300 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg glass-input px-4 py-2.5 text-white placeholder-gray-500 outline-none text-sm",
              icon && "pl-10",
              error && "border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-400 ml-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
