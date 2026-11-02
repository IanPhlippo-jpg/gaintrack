/**
 * Bottom sheet drawer (ontwerp uit 21st.dev "Drawer" van wensity, gebouwd op vaul voor iOS-swipe).
 */
import * as React from "react";
import { Drawer as Vaul } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** volledige hoogte (bv. actieve training) */
  full?: boolean;
  dismissible?: boolean;
}

export function Drawer({ open, onOpenChange, title, description, children, className, full = false, dismissible = true }: DrawerProps) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible} repositionInputs={false}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Vaul.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px] border-t border-border bg-popover text-popover-foreground outline-none short:mx-auto short:max-w-[760px] short:rounded-t-[20px]",
            "shadow-[0_-24px_64px_-28px_rgba(0,0,0,0.6)]",
            full ? "h-[96dvh] short:h-[94dvh]" : "max-h-[92dvh]",
            className,
          )}
        >
          <div className="flex shrink-0 flex-col items-center px-4 pb-1 pt-3 short:pb-0 short:pt-2">
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/35" />
          </div>
          {(title || description) && (
            <div className="relative shrink-0 border-b border-border px-5 pb-4 pr-12 pt-1">
              {title ? <Vaul.Title className="text-lg font-bold tracking-tight">{title}</Vaul.Title> : <Vaul.Title className="sr-only">Paneel</Vaul.Title>}
              {description ? <Vaul.Description className="mt-0.5 text-[13px] text-muted-foreground">{description}</Vaul.Description> : <Vaul.Description className="sr-only">Paneel</Vaul.Description>}
              {dismissible && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Sluiten"
                  className="absolute right-3 top-1 inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              )}
            </div>
          )}
          {!title && !description && (
            <>
              <Vaul.Title className="sr-only">Paneel</Vaul.Title>
              <Vaul.Description className="sr-only">Paneel</Vaul.Description>
            </>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+20px)]">{children}</div>
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
