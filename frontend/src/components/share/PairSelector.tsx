import { ArrowLeftRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { type Profile, profileKey, profileLabel } from "@/types";

interface PairSelectorProps {
  /** Already filtered to a single category by App. */
  profiles: Profile[];
  aKey: string;
  bKey: string;
  busy: boolean;
  onChangeA: (key: string) => void;
  onChangeB: (key: string) => void;
  onSwap: () => void;
  /** Hint shown when the picked category has 0 or 1 profiles. */
  emptyHint?: string;
}

export function PairSelector({
  profiles,
  aKey,
  bKey,
  busy,
  onChangeA,
  onChangeB,
  onSwap,
  emptyHint,
}: PairSelectorProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Profile A (source)
        </label>
        <Select value={aKey} onValueChange={onChangeA} disabled={busy}>
          <SelectTrigger>
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => {
              const key = profileKey(profile);
              return (
                <SelectItem key={key} value={key}>
                  {profileLabel(profile)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {emptyHint ? (
          <p className="mt-1 text-[10px] text-muted-foreground">{emptyHint}</p>
        ) : null}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="mb-0.5"
        onClick={onSwap}
        disabled={busy || profiles.length < 2}
        aria-label="Swap A and B"
      >
        <ArrowLeftRight />
      </Button>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Profile B (target)
        </label>
        <Select value={bKey} onValueChange={onChangeB} disabled={busy}>
          <SelectTrigger>
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => {
              const key = profileKey(profile);
              return (
                <SelectItem key={key} value={key}>
                  {profileLabel(profile)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
