import React, { useRef, useState, type ComponentType } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LockedNavNote } from "@/lib/locked-nav";

type LockedNavIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

/**
 * A visible, focusable locked nav control. The dialog stays mounted so closing it
 * (Escape, overlay, or Close) returns focus to this button. Activating it never
 * opens the locked route; `onActivate` only supplies the join note.
 */
export function LockedNavItem({
  title,
  label,
  isCollapsed,
  icon: Icon,
  testId,
  onActivate,
}: {
  title: string;
  label: string;
  isCollapsed: boolean;
  icon: LockedNavIcon;
  testId: string;
  onActivate: () => LockedNavNote | null;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [note, setNote] = useState<LockedNavNote | null>(null);
  const shown = useRef<LockedNavNote | null>(null);
  if (note) shown.current = note;
  const visible = note ?? shown.current;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={false}
            className="cursor-not-allowed aria-disabled:pointer-events-auto"
          >
            <button
              ref={buttonRef}
              type="button"
              aria-disabled="true"
              aria-haspopup="dialog"
              aria-label={label}
              data-testid={testId}
              onClick={(event) => {
                event.preventDefault();
                const next = onActivate();
                if (next) setNote(next);
              }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{title}</span>
              {!isCollapsed && <Lock className="ml-auto h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          {label}
        </TooltipContent>
      </Tooltip>
      <Dialog open={Boolean(note)} onOpenChange={(next) => { if (!next) setNote(null); }}>
        <DialogContent
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            buttonRef.current?.focus();
          }}
        >
          {visible && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-base leading-6">{visible.sentence}</DialogTitle>
              </DialogHeader>
              <Link
                href={visible.href}
                onClick={() => setNote(null)}
                className="inline-flex min-h-11 items-center font-bold text-link underline underline-offset-4"
              >
                {visible.linkLabel}
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
