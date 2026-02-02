"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GigTable } from "@/components/GigTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/useToast";
import {
  getGigs,
  deactivateGig,
  reactivateGig,
  deleteGig,
  bulkDeactivateGigs,
  bulkDeleteGigs,
  exportGigsToCSV,
  scoreGig,
  batchScoreGigs,
} from "@/lib/firebase";
import type { Gig, GigFilters, GigSource, GigProfession } from "@/types";
import {
  Plus,
  Search,
  Download,
  PowerOff,
  Trash2,
  RefreshCw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { debounce } from "@/lib/utils";

const SOURCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "craigslist", label: "Craigslist" },
  { value: "school-board", label: "School Board" },
  { value: "instagram", label: "Instagram" },
  { value: "indeed", label: "Indeed" },
  { value: "manual", label: "Manual" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Inactive" },
];

const PROFESSION_OPTIONS = [
  { value: "all", label: "All Professions" },
  { value: "hairstylist", label: "Hairstylist" },
  { value: "nail-tech", label: "Nail Tech" },
  { value: "esthetician", label: "Esthetician" },
  { value: "makeup-artist", label: "Makeup Artist" },
  { value: "barber", label: "Barber" },
  { value: "lash-tech", label: "Lash Tech" },
];

// Form filter state type (includes "all" option)
interface FormFilters {
  source: GigSource | "all";
  status: "active" | "expired" | "all";
  profession: GigProfession | "all";
  search: string;
}

export default function GigsListPage() {
  const { toast } = useToast();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkDeactivateDialog, setShowBulkDeactivateDialog] = useState(false);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [isBatchScoring, setIsBatchScoring] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FormFilters>({
    source: "all",
    status: "all",
    profession: "all",
    search: "",
  });

  const loadGigs = useCallback(async () => {
    try {
      setIsLoading(true);
      const gigsData = await getGigs({
        source: filters.source === "all" ? undefined : filters.source,
        status: filters.status,
        profession: filters.profession === "all" ? undefined : filters.profession,
        search: filters.search,
      });
      // Filter to only show manually curated gigs (postedBy is null)
      const curatedGigs = gigsData.filter((g) => g.postedBy === null);
      setGigs(curatedGigs);
    } catch (error) {
      console.error("Failed to load gigs:", error);
      toast({
        title: "Error",
        description: "Failed to load gigs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadGigs();
  }, [loadGigs]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 300),
    []
  );

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateGig(id);
      await loadGigs();
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
      await loadGigs();
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
      await loadGigs();
      toast({ title: "Gig deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gig",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await bulkDeactivateGigs(selectedIds);
      setSelectedIds([]);
      setShowBulkDeactivateDialog(false);
      await loadGigs();
      toast({ title: `${selectedIds.length} gigs deactivated` });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate gigs",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteGigs(selectedIds);
      setSelectedIds([]);
      setShowBulkDeleteDialog(false);
      await loadGigs();
      toast({ title: `${selectedIds.length} gigs deleted` });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gigs",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const gigsToExport = selectedIds.length > 0
      ? gigs.filter((g) => selectedIds.includes(g.id))
      : gigs;

    const csv = exportGigsToCSV(gigsToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gigs-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export complete",
      description: `Exported ${gigsToExport.length} gigs to CSV`,
    });
  };

  const handleScore = async (id: string) => {
    try {
      setScoringId(id);
      const result = await scoreGig(id);
      await loadGigs();
      toast({
        title: "Gig scored",
        description: `Quality score: ${result.score}/10`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to score gig. Make sure Cloud Functions are deployed.",
        variant: "destructive",
      });
    } finally {
      setScoringId(null);
    }
  };

  const handleBatchScore = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsBatchScoring(true);
      const result = await batchScoreGigs(selectedIds);
      await loadGigs();
      setSelectedIds([]);
      toast({
        title: "Batch scoring complete",
        description: `${result.summary.success}/${result.summary.total} gigs scored successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to batch score gigs. Make sure Cloud Functions are deployed.",
        variant: "destructive",
      });
    } finally {
      setIsBatchScoring(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">All Gigs</h1>
            <p className="text-muted-foreground">
              Manage your manually curated gigs
            </p>
          </div>
          <Link href="/gigs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Gig
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or location..."
              className="pl-9"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.source}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, source: value as GigSource | "all" }))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value as "active" | "expired" | "all" }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.profession}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, profession: value as GigProfession | "all" }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFESSION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={loadGigs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeactivateDialog(true)}
              >
                <PowerOff className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchScore}
                disabled={isBatchScoring}
              >
                {isBatchScoring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isBatchScoring ? "Scoring..." : "Score with AI"}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="ml-auto"
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* Export All Button */}
        {selectedIds.length === 0 && gigs.length > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export All ({gigs.length})
            </Button>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <GigTable
            gigs={gigs}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onDelete={handleDelete}
            onScore={handleScore}
            scoringId={scoringId}
          />
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {gigs.length} gig{gigs.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Bulk Deactivate Dialog */}
      <AlertDialog
        open={showBulkDeactivateDialog}
        onOpenChange={setShowBulkDeactivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Gigs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedIds.length} gig
              {selectedIds.length !== 1 ? "s" : ""}? They will no longer appear
              in the mobile app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDeactivate}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gigs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} gig
              {selectedIds.length !== 1 ? "s" : ""}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
