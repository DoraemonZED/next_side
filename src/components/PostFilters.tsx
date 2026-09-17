"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SortAsc, SortDesc, Clock, Eye, ThumbsUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState, useTransition } from "react";

const sortOptions = [
  { label: "最新发布", value: "date", icon: Clock },
  { label: "最多浏览", value: "views", icon: Eye },
  { label: "最多点赞", value: "likes", icon: ThumbsUp },
] as const;

export function PostFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const requestedSortBy = searchParams.get("sortBy");
  const currentSortBy = sortOptions.some((option) => option.value === requestedSortBy) ? requestedSortBy! : "date";
  const currentSortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset page to 1 when filters change
    params.set("page", "1");
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [pathname, router, searchParams, startTransition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateFilters({ q: searchInput || null });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentSearch, searchInput, updateFilters]);

  const currentSortOption = sortOptions.find(opt => opt.value === currentSortBy) || sortOptions[0];

  return (
    <div className="blog-filters flex flex-col sm:flex-row items-center gap-4 mb-8">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索标题或标签..."
          className="blog-filters__search pl-9 h-10 bg-card/50"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-sort={currentSortBy} className="blog-filters__control h-10 gap-2 min-w-[140px] justify-between">
              <span className="flex items-center gap-2">
                <currentSortOption.icon className="h-4 w-4" />
                {currentSortOption.label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="blog-sort-menu w-[148px]">
            <DropdownMenuRadioGroup value={currentSortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
              {sortOptions.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                data-sort={option.value}
                value={option.value}
                className="px-2 pl-7 text-xs whitespace-nowrap"
              >
                <option.icon className="mr-1.5 h-3.5 w-3.5" />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          className="blog-filters__control h-10 w-10 shrink-0"
          data-sort-order={currentSortOrder}
          onClick={() => updateFilters({ sortOrder: currentSortOrder === "asc" ? "desc" : "asc" })}
          title={currentSortOrder === "asc" ? "正序" : "倒序"}
        >
          {currentSortOrder === "asc" ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
