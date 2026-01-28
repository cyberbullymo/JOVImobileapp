"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GigForm } from "@/components/GigForm";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getDraft } from "@/lib/firebase";
import type { CreateGigInput } from "@/types";

export default function NewGigPage() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const [draftData, setDraftData] = useState<Partial<CreateGigInput> | null>(null);
  const [isLoading, setIsLoading] = useState(!!draftId);

  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    }
  }, [draftId]);

  const loadDraft = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await getDraft(id);
      setDraftData(data);
    } catch (error) {
      console.error("Failed to load draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={draftId ? "/drafts" : "/gigs"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {draftId ? "Continue Draft" : "Create New Gig"}
            </h1>
            <p className="text-muted-foreground">
              {draftId
                ? "Continue editing your saved draft"
                : "Manually add a new gig from an external source"}
            </p>
          </div>
        </div>

        {/* Form - key forces re-mount when draft loads */}
        <GigForm
          key={draftId || "new"}
          initialData={draftData || undefined}
          existingDraftId={draftId}
        />
      </div>
    </DashboardLayout>
  );
}
