"use client";

import {
  TaskFilter,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  Priority,
  TaskStatus,
  Project,
} from "@/lib/types/task";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskFiltersProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  projects: Project[];
  allTags: string[];
}

export function TaskFilters({
  filter,
  onFilterChange,
  projects,
  allTags,
}: TaskFiltersProps) {
  const hasActiveFilter =
    filter.priority !== "all" ||
    filter.status !== "all" ||
    filter.project_id !== "all" ||
    filter.tag !== "all" ||
    filter.search !== "";

  const clearFilters = () =>
    onFilterChange({
      priority: "all",
      status: "all",
      project_id: "all",
      tag: "all",
      search: "",
    });

  return (
    <div className="flex flex-wrap items-center gap-2" suppressHydrationWarning>
      {/* Search */}
      <div className="relative" suppressHydrationWarning>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" suppressHydrationWarning />
        <Input
          placeholder="Search tasks..."
          value={filter.search}
          onChange={(e) =>
            onFilterChange({ ...filter, search: e.target.value })
          }
          className="pl-8 h-8 w-48 text-sm"
        />
      </div>

      {/* Priority */}
      <Select
        value={filter.priority}
        onValueChange={(val) =>
          onFilterChange({ ...filter, priority: (val as Priority | "all") || "all" })
        }
      >
        <SelectTrigger className="h-8 text-xs" size="sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
            <SelectItem key={p} value={p}>
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${PRIORITY_CONFIG[p].dotColor}`} />
                {PRIORITY_CONFIG[p].label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filter.status}
        onValueChange={(val) =>
          onFilterChange({ ...filter, status: (val as TaskStatus | "all") || "all" })
        }
      >
        <SelectTrigger className="h-8 text-xs" size="sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Project */}
      <Select
        value={filter.project_id}
        onValueChange={(val) =>
          onFilterChange({ ...filter, project_id: val || "all" })
        }
      >
        <SelectTrigger className="h-8 text-xs" size="sm">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tags */}
      {allTags.length > 0 && (
        <Select
          value={filter.tag}
          onValueChange={(val) => onFilterChange({ ...filter, tag: val || "all" })}
        >
          <SelectTrigger className="h-8 text-xs" size="sm">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear */}
      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="xs"
          onClick={clearFilters}
          className="text-xs text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
