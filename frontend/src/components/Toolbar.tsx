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

  return (
    <header
      // `data-tauri-drag-region` makes the empty space of the bar draggable
      // like a native title bar. `pl-[88px]` leaves room for the macOS
      // traffic-light cluster — Tauri's `titleBarStyle: Overlay` shows them
      // on top of the webview at x≈18, and the cluster is ~70px wide.
      data-tauri-drag-region
      className="flex h-12 items-center justify-between border-b bg-background/95 pl-[88px] pr-5 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex items-center gap-3" data-tauri-drag-region>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-display text-[14px] font-semibold text-primary-foreground">
          C
        </div>
        <h1
          className="font-display text-[16px] leading-none tracking-tight"
          data-tauri-drag-region
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
              className="h-8 w-8 rounded-md"
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
          className="h-8 gap-1.5 rounded-md font-sans text-xs"
        >
          <RefreshCw className={busy ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
