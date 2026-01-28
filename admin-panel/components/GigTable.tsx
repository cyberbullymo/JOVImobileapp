"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDate, truncate } from "@/lib/utils";
import type { Gig } from "@/types";
import {
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  ExternalLink,
  Star,
} from "lucide-react";

interface GigTableProps {
  gigs: Gig[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

const sourceColors: Record<string, "default" | "secondary" | "outline"> = {
  craigslist: "default",
  indeed: "secondary",
  "school-board": "outline",
  instagram: "default",
  manual: "outline",
};

export function GigTable({
  gigs,
  selectedIds,
  onSelectChange,
  onDeactivate,
  onReactivate,
  onDelete,
}: GigTableProps) {
  const [deleteGigId, setDeleteGigId] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (selectedIds.length === gigs.length) {
      onSelectChange([]);
    } else {
      onSelectChange(gigs.map((g) => g.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const confirmDelete = () => {
    if (deleteGigId) {
      onDelete(deleteGigId);
      setDeleteGigId(null);
    }
  };

  if (gigs.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No gigs found</p>
        <Link href="/gigs/new">
          <Button className="mt-4">Create Your First Gig</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === gigs.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-center">Quality</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gigs.map((gig) => (
              <TableRow key={gig.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(gig.id)}
                    onCheckedChange={() => handleSelectOne(gig.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Link
                      href={`/gigs/${gig.id}/edit`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {truncate(gig.title, 40)}
                    </Link>
                    <div className="flex flex-wrap gap-1">
                      {gig.profession.slice(0, 2).map((prof) => (
                        <Badge
                          key={prof}
                          variant="secondary"
                          className="text-xs"
                        >
                          {prof}
                        </Badge>
                      ))}
                      {gig.profession.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{gig.profession.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {gig.location.city}, {gig.location.state}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={sourceColors[gig.source] || "outline"}>
                      {gig.source}
                    </Badge>
                    {gig.sourceUrl && (
                      <a
                        href={gig.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">
                      {gig.qualityScore}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={gig.isActive ? "success" : "destructive"}>
                    {gig.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(gig.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/gigs/${gig.id}/edit`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {gig.isActive ? (
                        <DropdownMenuItem onClick={() => onDeactivate(gig.id)}>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onReactivate(gig.id)}>
                          <Power className="h-4 w-4 mr-2" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteGigId(gig.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGigId} onOpenChange={() => setDeleteGigId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gig</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this gig? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
