"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCards, SourceBreakdown, ProfessionBreakdown } from "@/components/StatsCards";
import { GigTable } from "@/components/GigTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import {
  getCurationStats,
  getManuallyCuratedGigs,
  deactivateGig,
  reactivateGig,
  deleteGig,
} from "@/lib/firebase";
import type { CurationStats, Gig } from "@/types";
import { Plus, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<CurationStats | null>(null);
  const [recentGigs, setRecentGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, gigsData] = await Promise.all([
        getCurationStats(),
        getManuallyCuratedGigs(),
      ]);
      setStats(statsData);
      setRecentGigs(gigsData.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateGig(id);
      await loadData();
      toast({ title: "Gig deactivated" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate gig",
        variant: "destructive",
      });
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await reactivateGig(id);
      await loadData();
      toast({ title: "Gig reactivated" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate gig",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGig(id);
      await loadData();
      toast({ title: "Gig deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gig",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your gig curation.
            </p>
          </div>
          <Link href="/gigs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Gig
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {stats && <StatsCards stats={stats} />}

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {stats && <SourceBreakdown bySource={stats.bySource} />}
          {stats && <ProfessionBreakdown byProfession={stats.byProfession} />}
        </div>

        {/* Recent Gigs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Gigs</CardTitle>
            <Link href="/gigs">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <GigTable
              gigs={recentGigs}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
