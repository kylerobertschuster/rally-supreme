import Image from "next/image";
import { CSSProperties } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  onLoadingComplete?: (result: {
    naturalWidth: number;
    naturalHeight: number;
  }) => void;
}

/**
 * Optimized image component with automatic lazy loading and responsive sizing
 * Uses Next.js Image for automatic optimization and format selection
 */
export function OptimizedImage({
  src,
  alt,
  width = 1200,
  height = 800,
  priority = false,
  className,
  style,
  onLoadingComplete,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      placeholder="blur"
      onLoadingComplete={onLoadingComplete}
      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E"
      className={className}
      style={style}
    />
  );
}

/**
 * Configuration for image optimization
 * Used for Next.js config
 */
export const imageOptimizationConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
};

/**
 * Utility to get responsive image srcset for manual optimization
 * Useful when Next.js Image component can't be used
 */
export function getResponsiveImageSrcSet(
  basePath: string,
  sizes: number[] = [400, 800, 1200]
) {
  return sizes.map((size) => `${basePath}?w=${size} ${size}w`).join(", ");
}
