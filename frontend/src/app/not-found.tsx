import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={
          <Button asChild>
            <Link href="/">Go to dashboard</Link>
          </Button>
        }
      />
    </main>
  );
}
