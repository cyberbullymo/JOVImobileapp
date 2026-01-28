"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { GigForm } from "@/components/GigForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewGigPage() {
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
            <h1 className="text-2xl font-bold">Create New Gig</h1>
            <p className="text-muted-foreground">
              Manually add a new gig from an external source
            </p>
          </div>
        </div>

        {/* Form */}
        <GigForm />
      </div>
    </DashboardLayout>
  );
}
