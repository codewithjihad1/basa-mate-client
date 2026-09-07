import { MarketingHeader } from "@/components/layout/MarketingHeader";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto w-full max-w-6xl px-4 text-sm text-muted-foreground">
          BasaMate — shared expense tracking for bachelor basas.
        </div>
      </footer>
    </div>
  );
}
