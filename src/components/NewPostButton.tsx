"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PostFormDialog } from "./PostFormDialog";

interface NewPostButtonProps {
  category: string;
}

export function NewPostButton({ category }: NewPostButtonProps) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> 新建文章
      </Button>
      <PostFormDialog
        mode="create"
        open={open}
        onOpenChange={setOpen}
        category={category}
      />
    </>
  );
}
