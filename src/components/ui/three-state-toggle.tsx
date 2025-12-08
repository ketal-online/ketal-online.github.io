import { cn } from "@/lib/utils"
import { Sun, Moon, Monitor } from "lucide-react"
import type { Theme } from "@/lib/theme-context"

type ThreeStateToggleProps = {
  value: Theme
  onChange: (value: Theme) => void
  className?: string
}

export function ThreeStateToggle({ value, onChange, className }: ThreeStateToggleProps) {
  const themes: Theme[] = ['light', 'system', 'dark']
  const activeIndex = themes.indexOf(value)

  return (
    <div 
      className={cn(
        "relative inline-grid grid-cols-3 h-8 w-[84px] rounded-full bg-muted p-1 gap-0",
        className
      )}
    >
      {/* Sliding indicator */}
      <div 
        className="absolute top-1 h-6 w-6 rounded-full bg-primary transition-all duration-200 ease-in-out"
        style={{ left: `calc(${activeIndex} * 26px + 4px)` }}
      />
      
      {/* Light button */}
      <button
        type="button"
        onClick={() => onChange('light')}
        className={cn(
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors",
          value === 'light' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="Light"
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      
      {/* System button */}
      <button
        type="button"
        onClick={() => onChange('system')}
        className={cn(
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors",
          value === 'system' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="System"
      >
        <Monitor className="h-3.5 w-3.5" />
      </button>
      
      {/* Dark button */}
      <button
        type="button"
        onClick={() => onChange('dark')}
        className={cn(
          "relative z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors",
          value === 'dark' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="Dark"
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
