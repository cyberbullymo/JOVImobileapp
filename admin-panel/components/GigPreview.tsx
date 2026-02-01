"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { GigFormData, GigProfession } from "@/types";
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Star,
  ExternalLink,
} from "lucide-react";

interface GigPreviewProps {
  data: GigFormData;
}

const professionLabels: Record<GigProfession, string> = {
  hairstylist: "Hairstylist",
  "nail-tech": "Nail Tech",
  esthetician: "Esthetician",
  "makeup-artist": "Makeup Artist",
  barber: "Barber",
  "lash-tech": "Lash Tech",
};

const gigTypeLabels: Record<string, string> = {
  "booth-rental": "Booth Rental",
  freelance: "Freelance",
  "full-time": "Full-Time",
  "part-time": "Part-Time",
  internship: "Internship",
  apprenticeship: "Apprenticeship",
  commission: "Commission",
};

const payTypeLabels: Record<string, string> = {
  hourly: "/hr",
  salary: "/yr",
  "per-service": "/service",
  commission: " comm",
  "booth-rental": "/week",
};

export function GigPreview({ data }: GigPreviewProps) {
  const hasLocation = data.location?.city || data.location?.state;
  const hasPay = data.payRange?.min > 0 || data.payRange?.max > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Preview</h3>
        <Badge variant="outline" className="text-xs">
          Mobile Card View
        </Badge>
      </div>

      {/* Mobile Card Preview */}
      <Card className="max-w-sm mx-auto bg-white shadow-md overflow-hidden">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base text-gray-900 truncate">
                {data.title || "Gig Title"}
              </h4>
              {hasLocation && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>
                    {data.location.city}
                    {data.location.city && data.location.state && ", "}
                    {data.location.state}
                  </span>
                </div>
              )}
            </div>
            {data.qualityScore && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">{data.qualityScore}</span>
              </div>
            )}
          </div>

          {/* Professions */}
          {data.profession.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {data.profession.map((prof) => (
                <Badge
                  key={prof}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-0"
                >
                  {professionLabels[prof]}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {data.description || "Gig description will appear here..."}
          </p>

          <Separator className="my-3" />

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Gig Type */}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{gigTypeLabels[data.gigType] || "Freelance"}</span>
              </div>

              {/* Pay */}
              {hasPay && (
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>
                    {formatCurrency(data.payRange.min)}
                    {data.payRange.max > data.payRange.min &&
                      ` - ${formatCurrency(data.payRange.max)}`}
                    {payTypeLabels[data.payRange.type]}
                  </span>
                </div>
              )}
            </div>

            {/* Source indicator */}
            {data.sourceUrl && (
              <div className="flex items-center text-xs text-gray-400">
                <ExternalLink className="h-3 w-3 mr-1" />
                {data.source}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Character counts and validation hints */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Title</span>
          <span
            className={
              data.title.length > 100 ? "text-destructive" : ""
            }
          >
            {data.title.length}/100 characters
          </span>
        </div>
        <div className="flex justify-between">
          <span>Description</span>
          <span
            className={
              data.description.length > 8000 ? "text-destructive" : ""
            }
          >
            {data.description.length}/8000 characters
          </span>
        </div>
        {data.location.lat && data.location.lng && (
          <div className="flex justify-between">
            <span>Coordinates</span>
            <span className="text-success">
              {data.location.lat.toFixed(4)}, {data.location.lng.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
