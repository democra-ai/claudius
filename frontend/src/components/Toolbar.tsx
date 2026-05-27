import { Moon, RefreshCw, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolbarProps {
  onRefresh: () => void;
  busy: boolean;
}

/**
 * Top chrome. Title, refresh, theme toggle. The Apply action lives on the
 * floating PendingBar inside the page body — keeping it out of the chrome
 * means the user's hand stays close to the matrix when toggling.
 */
export function Toolbar({ onRefresh, busy }: ToolbarProps) {
  const { theme, toggle } = useTheme();
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : SunMoon;

  // Custom title bar matching Claude.app's compact one-row layout:
  // traffic lights + breadcrumb-style content on the SAME baseline.
  //
  // Why these exact numbers:
  //   - h-11 (44px) toolbar matches Claude.app's bar height visually.
  //   - With items-center, content lives at y=22 (center of 44px).
  //   - Tauri's `trafficLightPosition` extends the title-bar VIEW by `y`
  //     past the button height, so lights end up at top + y/2.
  //     For button_height≈14 and y=14, lights center sits at y=14, which
  //     is reasonably close to content center y=22 for a compact bar.
  //   - Title text bumped down to 13px to match the breadcrumb feel of
  //     the reference (Claude.app's path text is small and quiet).
  return (
    <header
      data-tauri-drag-region
      className="flex h-11 items-center justify-between border-b bg-background/95 pl-[80px] pr-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div
        data-tauri-drag-region
        className="flex items-center gap-2"
      >
        <div
          data-tauri-drag-region
          className="flex h-5 w-5 items-center justify-center rounded bg-primary font-display text-[11px] font-semibold text-primary-foreground"
        >
          C
        </div>
        <h1
          data-tauri-drag-region
          className="font-display text-[13px] leading-none tracking-tight"
        >
          Claude Multiprofile
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-7 w-7 rounded-md"
            >
              <ThemeIcon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Theme: {theme}</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-4" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={busy}
          className="h-7 gap-1.5 rounded-md font-sans text-xs"
        >
          <RefreshCw className={busy ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
