import { Blocks, Boxes, Hammer, Settings2, Lock, History, MessagesSquare } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { ContentKind, Profile } from "@/types";

interface ShareTabsProps {
  category: Profile["category"];
  value: ContentKind;
  onChange: (value: ContentKind) => void;
  children: React.ReactNode;
}

type TabDef = {
  value: ContentKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When true, this tab is wired to a real backend; false = "Coming soon". */
  ready: boolean;
};

const DESKTOP_TABS: TabDef[] = [
  { value: "extensions", label: "Extensions", icon: Blocks, ready: true },
  { value: "code_history", label: "Code History", icon: MessagesSquare, ready: true },
  { value: "mcp_servers", label: "MCP Servers", icon: Boxes, ready: false },
  { value: "cowork_skills", label: "Cowork Skills", icon: Hammer, ready: false },
  { value: "preferences", label: "Preferences", icon: Settings2, ready: false },
];

const CODE_TABS: TabDef[] = [
  { value: "history", label: "History", icon: History, ready: true },
];

function tabsFor(category: Profile["category"]): TabDef[] {
  return category === "desktop" ? DESKTOP_TABS : CODE_TABS;
}

export function defaultTabFor(category: Profile["category"]): ContentKind {
  return tabsFor(category)[0]!.value;
}

export function isTabValidFor(
  category: Profile["category"],
  kind: ContentKind,
): boolean {
  return tabsFor(category).some((tab) => tab.value === kind);
}

export function ShareTabs({ category, value, onChange, children }: ShareTabsProps) {
  const tabs = tabsFor(category);
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as ContentKind)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <TabsList className="self-start">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {!tab.ready ? (
                <Lock className="ml-1 h-3 w-3 text-muted-foreground" />
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>
      <TabsContent
        value={value}
        className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        {children}
      </TabsContent>
    </Tabs>
  );
}
