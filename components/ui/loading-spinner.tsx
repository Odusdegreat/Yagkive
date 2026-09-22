import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function LoadingSpinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return <LoaderCircle className={cn("size-4 animate-spin", className)} aria-label={label} role="status" />;
}

export { LoadingSpinner };
