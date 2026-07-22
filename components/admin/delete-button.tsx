"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  confirmMessage,
  action,
  errorMessages,
  fallbackErrorMessage,
  successMessage,
  onSuccess,
}: {
  confirmMessage: string;
  action: () => Promise<{ ok: boolean; error?: string }>;
  errorMessages?: Record<string, string>;
  fallbackErrorMessage: string;
  successMessage: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error((result.error && errorMessages?.[result.error]) || fallbackErrorMessage);
        return;
      }
      toast.success(successMessage);
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="ghost" size="icon" onClick={handleClick} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
    </Button>
  );
}
