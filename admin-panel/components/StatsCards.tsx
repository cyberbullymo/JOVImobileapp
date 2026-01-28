"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurationStats } from "@/types";
import { Briefcase, CheckCircle, TrendingUp, Star, Target } from "lucide-react";

interface StatsCardsProps {
  stats: CurationStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const weeklyGoal = 15;
  const weeklyProgress = Math.min((stats.thisWeekGigs / weeklyGoal) * 100, 100);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Gigs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gigs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalGigs}</div>
          <p className="text-xs text-muted-foreground">
            Manually curated gigs
          </p>
        </CardContent>
      </Card>

      {/* Active Gigs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Gigs</CardTitle>
          <CheckCircle className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeGigs}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalGigs > 0
              ? `${Math.round((stats.activeGigs / stats.totalGigs) * 100)}% of total`
              : "No gigs yet"}
          </p>
        </CardContent>
      </Card>

      {/* This Week */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisWeekGigs}</div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Goal: {weeklyGoal}</span>
              <span className="font-medium">{Math.round(weeklyProgress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${weeklyProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Quality */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
          <Star className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgQualityScore}/10</div>
          <p className="text-xs text-muted-foreground">
            Quality score average
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface SourceBreakdownProps {
  bySource: Record<string, number>;
}

export function SourceBreakdown({ bySource }: SourceBreakdownProps) {
  const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const total = sources.reduce((sum, [_, count]) => sum + count, 0);

  const sourceLabels: Record<string, string> = {
    craigslist: "Craigslist",
    indeed: "Indeed",
    "school-board": "School Board",
    instagram: "Instagram",
    manual: "Manual",
  };

  const sourceColors: Record<string, string> = {
    craigslist: "bg-blue-500",
    indeed: "bg-indigo-500",
    "school-board": "bg-green-500",
    instagram: "bg-pink-500",
    manual: "bg-gray-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Gigs by Source</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map(([source, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={source}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{sourceLabels[source] || source}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${sourceColors[source] || "bg-primary"} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {sources.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfessionBreakdownProps {
  byProfession: Record<string, number>;
}

export function ProfessionBreakdown({ byProfession }: ProfessionBreakdownProps) {
  const professions = Object.entries(byProfession).sort((a, b) => b[1] - a[1]);
  const total = professions.reduce((sum, [_, count]) => sum + count, 0);

  const professionLabels: Record<string, string> = {
    hairstylist: "Hairstylist",
    "nail-tech": "Nail Tech",
    esthetician: "Esthetician",
    "makeup-artist": "Makeup Artist",
    barber: "Barber",
    "lash-tech": "Lash Tech",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Gigs by Profession</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {professions.map(([profession, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={profession}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{professionLabels[profession] || profession}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {professions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
