import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  colorByValue?: boolean;
}

function getValueColor(value: number, min: number, max: number): string {
  const percentage = (value - min) / (max - min);
  const hue = (1 - percentage) * 120;
  return `hsl(${hue}, 70%, 50%)`;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, colorByValue, value, min = 0, max = 100, ...props }, ref) => {
  const currentValue = Array.isArray(value) ? value[0] : (value ?? min);
  const dynamicColor = colorByValue ? getValueColor(currentValue, min, max) : undefined;

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-2",
        className
      )}
      onPointerDown={(e) => e.stopPropagation()}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range 
          className={cn("absolute h-full", !colorByValue && "bg-primary")}
          style={colorByValue ? { backgroundColor: dynamicColor } : undefined}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 bg-background shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
          !colorByValue && "border-primary"
        )}
        style={colorByValue ? { borderColor: dynamicColor } : undefined}
      />
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
