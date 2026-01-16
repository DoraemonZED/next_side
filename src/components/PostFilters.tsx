"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SortAsc, SortDesc, Clock, Eye, ThumbsUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useTransition } from "react";
import { useDebounce } from "@/lib/utils"; // Assuming a debounce hook or utility exists

export function PostFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("q") || "";
  const currentSortBy = searchParams.get("sortBy") || "date";
  const currentSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateFilters = (updates: Record<string, string | null>) => {
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
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateFilters({ q: searchInput || null });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const sortOptions = [
    { label: "最新发布", value: "date", icon: Clock },
    { label: "最多浏览", value: "views", icon: Eye },
    { label: "最多点赞", value: "likes", icon: ThumbsUp },
  ];

  const currentSortOption = sortOptions.find(opt => opt.value === currentSortBy) || sortOptions[0];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索文章标题..."
          className="pl-9 h-10 bg-card/50"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 min-w-[140px] justify-between">
              <span className="flex items-center gap-2">
                <currentSortOption.icon className="h-4 w-4" />
                {currentSortOption.label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateFilters({ sortBy: option.value })}
                className={currentSortBy === option.value ? "bg-accent" : ""}
              >
                <option.icon className="mr-2 h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
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
