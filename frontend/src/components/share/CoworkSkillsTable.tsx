import { useMemo } from "react";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ShareTable } from "./ShareTable";
import type {
  PairCoworkSkillShare,
  PairCoworkSkillsResult,
  ShareRow,
} from "@/types";

interface CoworkSkillsTableProps {
  data: PairCoworkSkillsResult | null;
  pending: Map<string, boolean>;
  search: string;
  setSearch: (next: string) => void;
  onToggle: (row: ShareRow, nextChecked: boolean) => void;
  columnA: string;
  columnB: string;
}

/**
 * Skills live at:
 *   <dataDir>/local-agent-mode-sessions/skills-plugin/<deviceId>/<accountId>/
 *     ├── manifest.json     (array of {skillId, name, description, enabled})
 *     └── skills/<id>/       (the actual bundle)
 *
 * Sharing is symlink-based (Model A): the target's `skills/<id>/` becomes a
 * symlink to the source's, AND the target's manifest entry is patched to
 * match the source's. Both halves must agree for `shared = true`.
 *
 * Either side can lack the `<dev>/<acct>/` combo entirely if the user has
 * never opened the Cowork panel on that profile. The empty state below
 * walks them through fixing that.
 */
function toShareRow(skill: PairCoworkSkillShare): ShareRow {
  const sourceDetail = skill.source_present
    ? skill.source_enabled
      ? "Enabled"
      : "Disabled"
    : undefined;
  const targetDetail = skill.target_present
    ? skill.target_enabled
      ? "Enabled"
      : "Disabled"
    : undefined;
  return {
    id: skill.skill_id,
    label: skill.name,
    source_present: skill.source_present,
    target_present: skill.target_present,
    source_detail: sourceDetail,
    target_detail: targetDetail,
    shared: skill.shared,
    partial: false,
  };
}

function BootstrapHint({
  whichSide,
  columnLabel,
}: {
  whichSide: "source" | "target";
  columnLabel: string;
}) {
  return (
    <Card className="flex h-full items-center justify-center">
      <CardContent className="flex max-w-md flex-col items-center gap-3 py-12 text-center">
        <Construction className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold">
          {columnLabel} hasn't opened Cowork yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Skills are stored under{" "}
          <code className="text-xs">
            local-agent-mode-sessions/skills-plugin/&lt;dev&gt;/&lt;acct&gt;/
          </code>
          , which Claude Desktop only creates after you open the Cowork panel
          on that profile at least once.
        </p>
        <p className="text-xs text-muted-foreground">
          Launch the {whichSide === "source" ? "source" : "target"} profile,
          open Cowork, then come back and Refresh.
        </p>
      </CardContent>
    </Card>
  );
}

export function CoworkSkillsTable({
  data,
  pending,
  search,
  setSearch,
  onToggle,
  columnA,
  columnB,
}: CoworkSkillsTableProps) {
  const shareRows = useMemo(
    () => (data?.rows ?? []).map(toShareRow),
    [data?.rows],
  );

  if (data?.source_needs_bootstrap) {
    return <BootstrapHint whichSide="source" columnLabel={columnA} />;
  }
  if (data?.target_needs_bootstrap) {
    return <BootstrapHint whichSide="target" columnLabel={columnB} />;
  }

  return (
    <ShareTable
      rows={shareRows}
      pending={pending}
      search={search}
      setSearch={setSearch}
      onToggle={onToggle}
      columnA={columnA}
      columnB={columnB}
      emptyHint="No Cowork skills in either profile yet. Install one via Claude Desktop, then Refresh."
    />
  );
}
