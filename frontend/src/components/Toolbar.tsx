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
  pendingCount: number;
  onApply: () => void;
}

export function Toolbar({ onRefresh, busy, pendingCount, onApply }: ToolbarProps) {
  const { theme, toggle } = useTheme();
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : SunMoon;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow">
          <span className="text-sm font-semibold">C</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold">Claude Multiprofile</h1>
          <p className="text-xs text-muted-foreground">
            Switch Desktop accounts · share Cowork & Code locally
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              <ThemeIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Theme: {theme}</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="h-5" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={busy}
          className="gap-2"
        >
          <RefreshCw className={busy ? "animate-spin" : ""} />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={onApply}
          disabled={busy || pendingCount === 0}
        >
          Apply{pendingCount ? ` (${pendingCount})` : ""}
        </Button>
      </div>
    </header>
  );
}
