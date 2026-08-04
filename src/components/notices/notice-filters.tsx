import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NoticeFilterKey } from "./use-notice-filters";

export const noticeFilterKeys: NoticeFilterKey[] = [
  "all",
  "published",
  "draft",
  "expired",
  "pinned",
];

/** Search box + status tabs above the notice list. */
export function NoticeFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  counts,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filter: NoticeFilterKey;
  onFilterChange: (value: NoticeFilterKey) => void;
  counts: Record<NoticeFilterKey, number>;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search headline, content or type"
          className="pl-9"
        />
      </div>
      <Tabs value={filter} onValueChange={(v) => onFilterChange(v as NoticeFilterKey)}>
        <TabsList className="flex-wrap">
          {noticeFilterKeys.map((k) => (
            <TabsTrigger key={k} value={k} className="capitalize">
              {k} <span className="ml-1 text-muted-foreground">{counts[k]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
