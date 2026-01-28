"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { getGigSources } from "@/lib/firebase";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import type { GigSourceConfig } from "@/types";
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";

function getHealthStatus(source: GigSourceConfig): {
  status: "healthy" | "warning" | "critical" | "inactive";
  label: string;
  color: "success" | "warning" | "destructive" | "outline";
} {
  if (!source.isActive) {
    return { status: "inactive", label: "Inactive", color: "outline" };
  }

  if (source.errorCount >= 3) {
    return { status: "critical", label: "Critical", color: "destructive" };
  }

  if (source.errorCount >= 1) {
    return { status: "warning", label: "Warning", color: "warning" };
  }

  if (!source.lastScraped) {
    return { status: "warning", label: "Never Scraped", color: "warning" };
  }

  // Check if last scrape was within expected frequency
  const now = new Date();
  const lastScraped = new Date(source.lastScraped);
  const hoursSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);

  const frequencyHours: Record<string, number> = {
    hourly: 2,
    "every-6-hours": 12,
    daily: 48,
    weekly: 168 * 2,
    manual: Infinity,
  };

  const expectedHours = frequencyHours[source.scrapingFrequency] || 48;

  if (hoursSinceLastScrape > expectedHours) {
    return { status: "warning", label: "Overdue", color: "warning" };
  }

  return { status: "healthy", label: "Healthy", color: "success" };
}

export default function SourcesPage() {
  const { toast } = useToast();
  const [sources, setSources] = useState<GigSourceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSources = async () => {
      try {
        setIsLoading(true);
        const sourcesData = await getGigSources();
        setSources(sourcesData);
      } catch (error) {
        console.error("Failed to load sources:", error);
        toast({
          title: "Error",
          description: "Failed to load gig sources",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSources();
  }, [toast]);

  const totalGigs = sources.reduce((sum, s) => sum + s.gigCount, 0);
  const activeSources = sources.filter((s) => s.isActive).length;
  const healthySources = sources.filter((s) => getHealthStatus(s).status === "healthy").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Gig Sources</h1>
          <p className="text-muted-foreground">
            Monitor and manage gig source configurations
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : sources.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : activeSources}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : healthySources}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gigs</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : totalGigs}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sources Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No gig sources configured yet.</p>
                <p className="text-sm">
                  Run the seed script to add initial sources.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Last Scraped</TableHead>
                    <TableHead className="text-center">Gigs</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => {
                    const health = getHealthStatus(source);
                    return (
                      <TableRow key={source.sourceId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{source.name}</span>
                            {source.url && (
                              <a
                                href={source.url}
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
                          <Badge variant="outline">{source.platform}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {source.location.city}, {source.location.state}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {source.scrapingFrequency}
                          </div>
                        </TableCell>
                        <TableCell>
                          {source.lastScraped ? (
                            <span
                              className="text-sm"
                              title={formatDate(source.lastScraped)}
                            >
                              {formatRelativeDate(source.lastScraped)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Never
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{source.gigCount}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={health.color}>
                            {health.status === "healthy" && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {health.status === "warning" && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {health.status === "critical" && (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {health.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">About Gig Sources</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gig sources represent external platforms and feeds where gigs are
                  scraped from. During the manual curation phase, you can use these
                  sources as reference points when creating gigs. Once automated
                  scrapers are implemented, this dashboard will show real-time
                  scraping status and metrics.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  To seed initial sources, run:{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                    npm run seed:gig-sources seed
                  </code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
