"use client";

import Link from "next/link";
import { Hash, Trash2, GripVertical, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { Category } from "@/lib/blogService";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryListProps {
  categories: Category[];
  currentCategory: string;
}

interface SortableCategoryItemProps {
  cat: Category;
  isActive: boolean;
  isAuthenticated: boolean;
  onDelete: (slug: string) => void;
  onUpdate: (oldSlug: string, newData: Partial<Category>) => Promise<void>;
}

function EditCategoryDialog({ cat, onUpdate }: { cat: Category; onUpdate: SortableCategoryItemProps['onUpdate'] }) {
  const [name, setName] = useState(cat.name);
  const [slug, setSlug] = useState(cat.slug);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(cat.slug, { name, slug });
      setOpen(false);
    } catch (err) {
      showToast("更新失败", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑分类</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">分类名称</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-slug">路径 (Slug)</Label>
            <Input
              id="edit-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : "保存修改"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SortableCategoryItem({ cat, isActive, isAuthenticated, onDelete, onUpdate }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center ${isDragging ? "opacity-50" : ""}`}
    >
      {isAuthenticated && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing p-1 text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
          title="按住拖动排序"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className="flex-1 justify-between h-10 px-4 font-normal transition-all"
        asChild
      >
        <Link href={`/blog/${cat.slug}`}>
          <span className="truncate mr-2">{cat.name}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border shrink-0 transition-all duration-200 ${
              isAuthenticated ? "group-hover:opacity-0 group-hover:scale-50" : ""
            } ${
              isActive
                ? "bg-primary/20 text-primary border-primary/20"
                : "text-muted-foreground bg-background border-border/40"
            }`}
          >
            {cat.count}
          </span>
        </Link>
      </Button>

      {isAuthenticated && (
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-2 top-1/2 -translate-y-1/2 scale-50 group-hover:scale-100 flex items-center gap-0.5 bg-background/80 backdrop-blur shadow-sm border rounded-md p-0.5">
          <EditCategoryDialog cat={cat} onUpdate={onUpdate} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(cat.slug);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function CategoryList({ categories: initialCategories, currentCategory }: CategoryListProps) {
  const { isAuthenticated } = useAuthStore();
  const { showConfirm, showToast, setLoading } = useUIStore();
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);

  // 当服务端数据通过 router.refresh() 更新时，同步更新本地状态
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUpdate = async (oldSlug: string, newData: Partial<Category>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: oldSlug, ...newData }),
      });

      if (res.ok) {
        showToast("分类更新成功", "success");
        if (newData.slug && newData.slug !== oldSlug) {
          router.push(`/blog/${newData.slug}`);
        } else {
          router.refresh();
        }
      } else {
        const data = await res.json();
        showToast(data.message || "更新失败", "error");
      }
    } catch (err) {
      showToast("网络错误", "error");
      console.error("Failed to update category", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.slug === active.id);
      const newIndex = categories.findIndex((c) => c.slug === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      const updatedCategories = newCategories.map((cat, i) => ({ ...cat, order: i }));
      setCategories(updatedCategories);

      // 发送到后端保存
      setLoading(true);
      try {
        await Promise.all(
          updatedCategories.map((cat) =>
            fetch("/api/blog/categories", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: cat.slug, order: cat.order }),
            })
          )
        );
        showToast("排序已保存", "success");
        router.refresh();
      } catch (error) {
        showToast("排序保存失败", "error");
        console.error("Failed to update category order", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (slug: string) => {
    showConfirm({
      title: "删除分类",
      message: "确定要删除这个分类及其下的所有文章吗？此操作不可撤销。",
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/blog/categories?slug=${slug}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showToast("分类删除成功", "success");
            setCategories(categories.filter((c) => c.slug !== slug));
            if (currentCategory === slug) {
              router.push("/blog");
            } else {
              router.refresh();
            }
          } else {
            showToast("删除失败", "error");
          }
        } catch (error) {
          showToast("网络错误", "error");
          console.error("Failed to delete category", error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 计算所有文章总数
  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          文章分类
        </h3>
        <nav className="flex flex-col gap-1">
          {/* 全部分类 - 固定在最上方 */}
          <div className="group relative flex items-center gap-1">
            <Button
              variant={currentCategory === "all" ? "secondary" : "ghost"}
              className="flex-1 justify-between h-10 px-4 font-normal transition-all"
              asChild
            >
              <Link href="/blog">
                <span className="truncate">全部</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                    currentCategory === "all"
                      ? "bg-primary/20 text-primary border-primary/20"
                      : "text-muted-foreground bg-background border-border/40"
                  }`}
                >
                  {totalCount}
                </span>
              </Link>
            </Button>
          </div>
          
          {isAuthenticated ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.slug)}
                strategy={verticalListSortingStrategy}
              >
                {categories.map((cat) => (
                  <SortableCategoryItem
                    key={cat.slug}
                    cat={cat}
                    isActive={currentCategory === cat.slug}
                    isAuthenticated={isAuthenticated}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            categories.map((cat) => (
              <div key={cat.slug} className="group relative flex items-center gap-1">
                <Button
                  variant={currentCategory === cat.slug ? "secondary" : "ghost"}
                  className="flex-1 justify-between h-10 px-4 font-normal transition-all"
                  asChild
                >
                  <Link href={`/blog/${cat.slug}`}>
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                        currentCategory === cat.slug
                          ? "bg-primary/20 text-primary border-primary/20"
                          : "text-muted-foreground bg-background border-border/40"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </Link>
                </Button>
              </div>
            ))
          )}
        </nav>
      </div>
    </div>
  );
}
