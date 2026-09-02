"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, Home, Plus, Settings, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/config/constants";
import { useActiveBasa } from "@/hooks/useActiveBasa";
import { cn } from "@/lib/utils/cn";

/**
 * The active-basa switcher (frontend-requirements §7).
 *
 * Switching dispatches `setActiveBasa`, which clears the active cycle and changes
 * every basa-scoped RTK Query argument — so the old basa's meals, expenses and
 * settlement are refetched rather than shown against the new basa.
 */
export function BasaSelector() {
  const { basa, basaId, memberships, role, switchBasa, isLoading } = useActiveBasa();

  if (isLoading && !basa) {
    return <Skeleton className="h-10 w-44" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex max-w-64 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium",
          "hover:bg-accent hover:text-accent-foreground",
        )}
        aria-label="Switch basa"
      >
        <Home className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{basa?.name ?? "Select a basa"}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Your basas</DropdownMenuLabel>
        {memberships.map((membership) => {
          const isActive = membership.basa.id === basaId;
          return (
            <DropdownMenuItem
              key={membership.basa.id}
              onSelect={() => switchBasa(membership.basa.id)}
              className="justify-between"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Check className={cn("size-4", isActive ? "opacity-100" : "opacity-0")} aria-hidden />
                <span className="truncate">{membership.basa.name}</span>
              </span>
              <Badge variant="outline">{ROLE_LABELS[membership.role]}</Badge>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding/create-basa">
            <Plus aria-hidden />
            Create a basa
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/onboarding/join-basa">
            <UserPlus aria-hidden />
            Join a basa
          </Link>
        </DropdownMenuItem>
        {role === "OWNER" || role === "MANAGER" ? (
          <DropdownMenuItem asChild>
            <Link href="/settings/basa">
              <Settings aria-hidden />
              Basa settings
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
