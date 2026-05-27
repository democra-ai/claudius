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

  // Single-row chrome via `transparent: true + titleBarStyle: Overlay`.
  // The `transparent: true` window flag makes the macOS title-bar zone
  // truly transparent — no vibrancy material on top — so the webview
  // bg shows through behind the traffic lights instead of stacking
  // them on a separate band.
  //
  // pl-[80px] reserves horizontal room for the lights cluster
  // (~70px starting at x=18). bg-background (no /95 opacity) is
  // required because transparent windows compose with whatever's
  // behind — using a translucent value would let the desktop show
  // through.
  return (
    <header
      data-tauri-drag-region
      className="flex h-11 items-center justify-between border-b bg-background pl-[80px] pr-4"
    >
      <div data-tauri-drag-region className="flex items-center gap-2.5">
        <div
          data-tauri-drag-region
          className="flex h-6 w-6 items-center justify-center rounded-md bg-primary font-display text-[12px] font-semibold text-primary-foreground"
        >
          C
        </div>
        <h1
          data-tauri-drag-region
          className="font-display text-[14px] leading-none tracking-tight"
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
