"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GigForm } from "@/components/GigForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getGig } from "@/lib/firebase";
import type { Gig } from "@/types";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function EditGigPage() {
  const params = useParams();
  const gigId = params.id as string;

  const [gig, setGig] = useState<Gig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGig = async () => {
      try {
        setIsLoading(true);
        const gigData = await getGig(gigId);
        if (!gigData) {
          setError("Gig not found");
        } else {
          setGig(gigData);
        }
      } catch (err) {
        console.error("Failed to load gig:", err);
        setError("Failed to load gig");
      } finally {
        setIsLoading(false);
      }
    };

    if (gigId) {
      loadGig();
    }
  }, [gigId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !gig) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error || "Gig not found"}</span>
          </div>
          <Link href="/gigs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gigs
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/gigs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Gig</h1>
            <p className="text-muted-foreground truncate max-w-md">
              {gig.title}
            </p>
          </div>
        </div>

        {/* Form */}
        <GigForm initialData={gig} isEdit gigId={gigId} />
      </div>
    </DashboardLayout>
  );
}
