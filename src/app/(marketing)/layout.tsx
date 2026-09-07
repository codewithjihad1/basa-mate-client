import { MarketingHeader } from "@/components/layout/MarketingHeader";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>BasaMate — shared expense tracking for bachelor basas.</p>
          <p>
            Developed by{" "}
            <a
              href="mailto:mdjihadhossain793@gmail.com"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              MD Jihad Hossain
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
