import { Download, FileSpreadsheet, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Date-range filter + export menu shown in the Reports page header. */
export function ReportsToolbar({
  range,
  onRangeChange,
  onDownload,
}: {
  range: string;
  onRangeChange: (value: string) => void;
  onDownload: (label: string) => void;
}) {
  return (
    <>
      <Select value={range} onValueChange={onRangeChange}>
        <SelectTrigger className="w-36 rounded-full">
          <Filter className="mr-1 h-3.5 w-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">This week</SelectItem>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="quarter">This quarter</SelectItem>
          <SelectItem value="year">This year</SelectItem>
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-md shadow-glow">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onDownload("CSV")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Download CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDownload("Excel")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDownload("PDF")}>
            <FileText className="mr-2 h-4 w-4" /> Download PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
