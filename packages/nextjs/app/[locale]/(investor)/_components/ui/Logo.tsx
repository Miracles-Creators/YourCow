import { BRAND_COPY } from "~~/lib/constants/brand";
import { cn } from "~~/lib/utils/cn";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    icon: "w-8 h-8",
    text: "text-xl",
  },
  md: {
    icon: "w-12 h-12",
    text: "text-3xl",
  },
  lg: {
    icon: "w-16 h-16",
    text: "text-4xl",
  },
} as const;

export function CowLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 250 250"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="YourCow logo"
    >
      <path d="m127.7 7.41v60.08c9.62-1.1 18.76-1.73 26.71-1.77v-54.96c-8.48-2.33-17.21-3.38-26.71-3.35z" fill="#A56436"/>
      <path d="m161.8 12.54-0.25 53.19c22.73-0.26 48.39 1.88 72.16 7.6-14.19-28.21-38.71-49.62-71.91-60.79z" fill="#3D693F"/>
      <path d="m119.8 68.51 1.44-61.2c-46.26 0.56-90.2 29.46-110.8 82.2 11.3-0.6 23.88-0.34 39.32 0.31 20.17-9.16 42.56-16.67 70.07-21.31z" fill="#3D693F"/>
      <path d="m127.7 74.69v30.18c17.42 5.45 33.25 12.24 49.01 19.88 22.29-4.6 43.17-7.3 67.58-8.08-0.64-11.95-3.53-22.99-7.34-34.31-24.53-6.95-62.83-12.25-109.2-7.67z" fill="#A56436"/>
      <path d="m244.7 123.7c-31.61 1.14-69.93 6.77-117.1 21.76v40.5c33.52-13.57 69.16-22.15 110.5-24.28 4.7-13.01 6.56-25.38 6.56-37.98z" fill="#A56436"/>
      <path d="m127.7 112.3v25.52c12.25-5.03 23.95-7.94 38.13-10.94-12.6-6.1-23.98-10.44-38.13-14.58z" fill="#3D693F"/>
      <path d="m127.7 193.6v48.82c45.16-1.2 88.96-30.35 108.7-73.9-34.41 2.31-70.15 9.75-108.7 25.08z" fill="#3D693F"/>
      <path d="m121.2 242.4v-46.2c-18.8 7.5-37.35 16.55-56.91 29.72 17.41 10.23 33.33 16.18 56.91 16.48z" fill="#A56436"/>
      <path d="m58.42 222.1c18.56-14.04 37.27-23.93 60.45-32.85-13.11-8.12-26.56-14.05-44.08-19.66-15.76 8.43-28.75 17.06-44.91 27.64 7.87 9.92 16.89 17.98 28.54 24.87z" fill="#A56436"/>
      <path d="m26.16 191.6c11.83-10.37 23.45-18.49 39.51-25.36-16.56-6.33-34.26-10.19-56.89-14.47 3.95 15.52 9.17 28.02 17.38 39.83z" fill="#3D693F"/>
      <path d="m7.68 96.54c29.4-1.25 68 0.3 113.5 13.04v31.18c-17.6 7.15-32.31 13.32-47.41 21.5-20.9-8.02-39.09-13.07-66.13-17.25-3.76-16.02-3.36-31.95 0-48.47z" fill="#3D693F"/>
      <path d="m120.9 76.07c-20 2.84-37.85 8.11-56.4 15.45 19.3 2.06 35.31 5.32 56.31 10.79l0.09-26.24z" fill="#A56436"/>
      <path d="m120.9 147.6c-13.43 5.3-24.83 10.7-37 17.61 13.1 5.5 24.58 11.3 36.91 17.99l0.09-35.6z" fill="#3D693F"/>
    </svg>
  );
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const styles = sizeStyles[size];

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <CowLogo className={styles.icon} />
      {showText && (
        <h1
          className={cn(
            "font-playfair font-bold text-vaca-green tracking-tight",
            styles.text,
          )}
        >
          {BRAND_COPY.name}
        </h1>
      )}
    </div>
  );
}
