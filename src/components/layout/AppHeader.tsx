"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMobileNavOpen } from "@/store/slices/uiSlice";
import { BasaSelector } from "./BasaSelector";
import { BillingCycleSelector } from "./BillingCycleSelector";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { SidebarNav } from "./SidebarNav";

export function AppHeader() {
  const dispatch = useAppDispatch();
  const mobileNavOpen = useAppSelector((state) => state.ui.mobileNavOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={(open) => dispatch(setMobileNavOpen(open))}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
          onClick={() => dispatch(setMobileNavOpen(true))}
        >
          <Menu aria-hidden />
        </Button>
        <SheetContent side="left">
          <SheetTitle className="px-3 text-lg font-semibold">BasaMate</SheetTitle>
          <SidebarNav onNavigate={() => dispatch(setMobileNavOpen(false))} />
        </SheetContent>
      </Sheet>

      <BasaSelector />

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:block">
          <BillingCycleSelector />
        </div>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
