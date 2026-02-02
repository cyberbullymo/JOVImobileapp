"use client";

import { Star, StarHalf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ScoringBreakdown } from "@/types";

interface QualityBadgeProps {
  score: number;
  breakdown?: ScoringBreakdown;
  reasoning?: string;
  scoredAt?: Date;
  showDetails?: boolean;
}

const getScoreConfig = (score: number) => {
  if (score >= 9) {
    return {
      variant: "success" as const,
      label: "Excellent",
      textColor: "text-green-700",
      bgColor: "bg-green-50",
    };
  }
  if (score >= 7) {
    return {
      variant: "success" as const,
      label: "Great",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    };
  }
  if (score >= 5) {
    return {
      variant: "warning" as const,
      label: "Good",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    };
  }
  if (score >= 3) {
    return {
      variant: "outline" as const,
      label: "Fair",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
    };
  }
  return {
    variant: "destructive" as const,
    label: "Poor",
    textColor: "text-red-600",
    bgColor: "bg-red-50",
  };
};

const ScoreIcon = ({ score }: { score: number }) => {
  if (score >= 7) {
    return <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />;
  }
  if (score >= 5) {
    return <StarHalf className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />;
  }
  return <Star className="h-3.5 w-3.5 text-gray-400" />;
};

const BreakdownBar = ({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: string;
}) => {
  const percentage = (score / 10) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {label} ({weight})
        </span>
        <span className="font-medium">{score}/10</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 7
              ? "bg-green-500"
              : score >= 5
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export function QualityBadge({
  score,
  breakdown,
  reasoning,
  scoredAt,
  showDetails = true,
}: QualityBadgeProps) {
  const config = getScoreConfig(score);

  const badgeContent = (
    <Badge
      variant={config.variant}
      className="cursor-pointer gap-1 font-medium"
    >
      <ScoreIcon score={score} />
      {score}/10
    </Badge>
  );

  if (!showDetails || (!breakdown && !reasoning)) {
    return badgeContent;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{badgeContent}</PopoverTrigger>
      <PopoverContent className="w-72" align="center">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Quality Score</h4>
              <p className={`text-xs ${config.textColor}`}>{config.label}</p>
            </div>
            <div
              className={`text-2xl font-bold ${config.textColor} ${config.bgColor} px-3 py-1 rounded-lg`}
            >
              {score}/10
            </div>
          </div>

          {/* Breakdown */}
          {breakdown && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Breakdown
              </h5>
              <BreakdownBar
                label="Completeness"
                score={breakdown.completeness}
                weight="30%"
              />
              <BreakdownBar
                label="Professionalism"
                score={breakdown.professionalism}
                weight="25%"
              />
              <BreakdownBar
                label="Student Relevance"
                score={breakdown.studentRelevance}
                weight="25%"
              />
              <BreakdownBar
                label="Actionability"
                score={breakdown.actionability}
                weight="20%"
              />
            </div>
          )}

          {/* Reasoning */}
          {reasoning && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Analysis
              </h5>
              <p className="text-xs text-muted-foreground">{reasoning}</p>
            </div>
          )}

          {/* Timestamp */}
          {scoredAt && (
            <p className="text-xs text-muted-foreground text-right">
              Scored:{" "}
              {new Date(scoredAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default QualityBadge;
