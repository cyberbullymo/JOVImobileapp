"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/useToast";
import { getAllDrafts, deleteDraft, type GigDraft } from "@/lib/firebase";
import { Edit, Trash2, FileText, Plus } from "lucide-react";

export default function DraftsPage() {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<GigDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setIsLoading(true);
      const data = await getAllDrafts();
      setDrafts(data);
    } catch (error) {
      console.error("Failed to load drafts:", error);
      toast({
        title: "Error",
        description: "Failed to load drafts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Draft deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-2xl font-bold">Drafts</h1>
            <p className="text-muted-foreground">
              View and manage your saved gig drafts
            </p>
          </div>
          <Link href="/gigs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Gig
            </Button>
          </Link>
        </div>

        {/* Drafts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Saved Drafts ({drafts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {drafts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No drafts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Drafts are automatically saved when you create a new gig.
                </p>
                <Link href="/gigs/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Gig
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell className="font-medium">
                        {draft.title || (
                          <span className="text-muted-foreground italic">
                            Untitled
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {draft.location?.city && draft.location?.state
                          ? `${draft.location.city}, ${draft.location.state}`
                          : (
                            <span className="text-muted-foreground">
                              No location
                            </span>
                          )}
                      </TableCell>
                      <TableCell>{formatDate(draft.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/gigs/new?draft=${draft.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this draft?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(draft.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
