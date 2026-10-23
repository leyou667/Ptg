import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("flex flex-col rounded-3xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgb(20_35_58/0.04),0_8px_24px_-12px_rgb(20_35_58/0.12)]", className)} {...props} />;
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("grid gap-2 px-7 pt-8", className)} {...props} />;
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-7", className)} {...props} />;
}
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("mt-auto px-7 pb-8", className)} {...props} />;
}

export { Card, CardHeader, CardContent, CardFooter };
