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

  // Two-tier chrome. Native macOS title bar (28px) above shows ONLY the
  // traffic lights — `hiddenTitle: true` strips the app-name text so there
  // is no duplication. This <header> is the second tier, sitting flush
  // below the native bar with the app's own branding + actions.
  //
  // We tried `titleBarStyle: "Overlay"` for a single-row Cursor-style
  // look, but Tauri 2's overlay pushes webview content down by the
  // title-bar-zone height regardless of CSS, leaving the lights and the
  // content visibly stacked on two rows anyway. Going with explicit two
  // tiers gives macOS-native alignment of the lights and a clean,
  // predictable layout below.
  return (
    <header
      data-tauri-drag-region
      className="flex h-11 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
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
