import { useMemo } from "react";
import { ShareTable } from "./ShareTable";
import type { PairMcpServerShare, ShareRow } from "@/types";

interface McpServerTableProps {
  rows: PairMcpServerShare[];
  pending: Map<string, boolean>;
  search: string;
  setSearch: (next: string) => void;
  onToggle: (row: ShareRow, nextChecked: boolean) => void;
  columnA: string;
  columnB: string;
}

/**
 * MCP servers live as keys in `<dataDir>/claude_desktop_config.json → mcpServers`.
 * Sharing here is "copy on apply" (Model B): no symlinks possible inside a JSON
 * object, so the backend rewrites the target file atomically when the user
 * clicks Apply. `shared` in the underlying ShareRow means "values are
 * currently identical between source and target".
 */
function toShareRow(server: PairMcpServerShare): ShareRow {
  return {
    id: server.name,
    label: server.name,
    source_present: server.source_present,
    target_present: server.target_present,
    source_detail: server.source_summary ?? undefined,
    target_detail: server.target_summary ?? undefined,
    shared: server.copied,
    partial: false,
  };
}

export function McpServerTable({
  rows,
  pending,
  search,
  setSearch,
  onToggle,
  columnA,
  columnB,
}: McpServerTableProps) {
  const shareRows = useMemo(() => rows.map(toShareRow), [rows]);
  return (
    <ShareTable
      rows={shareRows}
      pending={pending}
      search={search}
      setSearch={setSearch}
      onToggle={onToggle}
      columnA={columnA}
      columnB={columnB}
      emptyHint="No MCP servers configured in either profile. Add one to claude_desktop_config.json and click Refresh."
    />
  );
}
