"use client";
import { lazy, Suspense, type CSSProperties } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

type IconImports = typeof dynamicIconImports;

// Module-level cache — lazy() must not be called inside render
const iconCache = new Map<string, ReturnType<typeof lazy>>();

function getLazyIcon(name: string) {
  const key = name as keyof IconImports;
  if (!dynamicIconImports[key]) return null;
  if (!iconCache.has(name)) {
    iconCache.set(name, lazy(dynamicIconImports[key]));
  }
  return iconCache.get(name)!;
}

interface LucideIconProps {
  name: string | null | undefined;
  size?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
  strokeWidth?: number;
}

export function LucideIcon({
  name,
  size = 20,
  className,
  style,
  "aria-hidden": ariaHidden,
  strokeWidth,
}: LucideIconProps) {
  if (!name) return null;
  const Icon = getLazyIcon(name);
  if (!Icon) return null;
  return (
    <Suspense fallback={null}>
      <Icon
        size={size}
        className={className}
        style={style}
        aria-hidden={ariaHidden}
        strokeWidth={strokeWidth}
      />
    </Suspense>
  );
}
