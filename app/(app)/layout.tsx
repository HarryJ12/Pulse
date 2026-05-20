import { AppShell } from "@/components/pulse/app-shell";
import { DatabaseSetupRequired } from "@/components/pulse/database-setup-required";
import { requireUser } from "@/lib/auth";
import { isDatabaseSetupError } from "@/lib/errors";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { profile } = await requireUser();

    return <AppShell profile={profile}>{children}</AppShell>;
  } catch (error) {
    if (isDatabaseSetupError(error)) {
      return (
        <DatabaseSetupRequired
          detail={
            error instanceof Error && "originalMessage" in error
              ? String(error.originalMessage)
              : undefined
          }
        />
      );
    }

    throw error;
  }
}
