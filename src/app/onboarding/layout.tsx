import { AuthGuard } from "@/components/providers/AuthGuard";
import Image from "next/image";
import Link from "next/link";
import logo from "../../assets/logo.png";

export default function OnboardingLayout({
    children,
}: LayoutProps<"/onboarding">) {
    return (
        <AuthGuard>
            <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
                <Link
                    href="/"
                    className="mb-8 text-xl font-semibold tracking-tight"
                >
                    <Image
                        src={logo}
                        alt="Basa"
                        width={48}
                        height={48}
                        className="inline-block"
                    />
                </Link>
                <div className="w-full max-w-md">{children}</div>
            </div>
        </AuthGuard>
    );
}
