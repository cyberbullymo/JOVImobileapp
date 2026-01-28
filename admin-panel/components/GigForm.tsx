"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { GigPreview } from "@/components/GigPreview";
import { useToast } from "@/hooks/useToast";
import { validateGigForm, validateSourceUrl, getCharacterCountInfo } from "@/lib/validators";
import { createGig, updateGig, checkForDuplicates, saveDraft, deleteDraft } from "@/lib/firebase";
import { debounce } from "@/lib/utils";
import type {
  GigFormData,
  GigProfession,
  Gig,
  DEFAULT_GIG_DATA,
  GIG_TYPE_OPTIONS,
  PROFESSION_OPTIONS,
  SOURCE_OPTIONS,
  PAY_TYPE_OPTIONS,
} from "@/types";
import { Loader2, Save, Send, AlertTriangle, X } from "lucide-react";

const GIG_TYPE_OPTIONS_LOCAL = [
  { value: "booth-rental", label: "Booth Rental" },
  { value: "freelance", label: "Freelance" },
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "internship", label: "Internship" },
  { value: "apprenticeship", label: "Apprenticeship" },
  { value: "commission", label: "Commission" },
];

const PROFESSION_OPTIONS_LOCAL = [
  { value: "hairstylist", label: "Hairstylist" },
  { value: "nail-tech", label: "Nail Technician" },
  { value: "esthetician", label: "Esthetician" },
  { value: "makeup-artist", label: "Makeup Artist" },
  { value: "barber", label: "Barber" },
  { value: "lash-tech", label: "Lash Technician" },
];

const SOURCE_OPTIONS_LOCAL = [
  { value: "craigslist", label: "Craigslist" },
  { value: "school-board", label: "School Board" },
  { value: "instagram", label: "Instagram" },
  { value: "indeed", label: "Indeed" },
  { value: "manual", label: "Manual Entry" },
];

const PAY_TYPE_OPTIONS_LOCAL = [
  { value: "hourly", label: "Hourly" },
  { value: "salary", label: "Salary" },
  { value: "per-service", label: "Per Service" },
  { value: "commission", label: "Commission" },
  { value: "booth-rental", label: "Booth Rental" },
];

const DEFAULT_GIG_DATA_LOCAL: GigFormData = {
  title: "",
  description: "",
  location: { city: "", state: "" },
  gigType: "freelance",
  profession: [],
  payRange: { min: 0, max: 0, type: "hourly" },
  source: "manual",
  qualityScore: 5,
  requirements: [],
  benefits: [],
};

interface GigFormProps {
  initialData?: Partial<Gig>;
  isEdit?: boolean;
  gigId?: string;
}

export function GigForm({ initialData, isEdit = false, gigId }: GigFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<GigFormData>(() => ({
    ...DEFAULT_GIG_DATA_LOCAL,
    title: initialData?.title || DEFAULT_GIG_DATA_LOCAL.title,
    description: initialData?.description || DEFAULT_GIG_DATA_LOCAL.description,
    gigType: initialData?.gigType || DEFAULT_GIG_DATA_LOCAL.gigType,
    source: initialData?.source || DEFAULT_GIG_DATA_LOCAL.source,
    sourceUrl: initialData?.sourceUrl ?? undefined, // Convert null to undefined
    qualityScore: initialData?.qualityScore || DEFAULT_GIG_DATA_LOCAL.qualityScore,
    profession: initialData?.profession || [],
    payRange: initialData?.payRange || DEFAULT_GIG_DATA_LOCAL.payRange,
    location: initialData?.location || DEFAULT_GIG_DATA_LOCAL.location,
    requirements: initialData?.requirements || [],
    benefits: initialData?.benefits || [],
  }));

  const [addressInput, setAddressInput] = useState(
    initialData?.location?.address || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<Gig[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Autosave draft every 30 seconds
  const debouncedSaveDraft = useCallback(
    debounce(async (data: GigFormData) => {
      if (!data.title && !data.description) return;

      try {
        setIsSavingDraft(true);
        const id = await saveDraft("admin", draftId, data);
        setDraftId(id);
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save draft:", error);
      } finally {
        setIsSavingDraft(false);
      }
    }, 30000),
    [draftId]
  );

  // Trigger autosave on form changes
  useEffect(() => {
    if (!isEdit) {
      debouncedSaveDraft(formData);
    }
  }, [formData, isEdit, debouncedSaveDraft]);

  // Check for duplicates when title and location change
  useEffect(() => {
    const checkDupes = async () => {
      if (formData.title.length >= 5 && formData.location.city) {
        try {
          const dupes = await checkForDuplicates(
            formData.title,
            formData.location.city
          );
          // Filter out the current gig if editing
          const filteredDupes = isEdit && gigId
            ? dupes.filter((d) => d.id !== gigId)
            : dupes;
          setDuplicates(filteredDupes);
        } catch (error) {
          console.error("Failed to check duplicates:", error);
        }
      } else {
        setDuplicates([]);
      }
    };

    const timeoutId = setTimeout(checkDupes, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.title, formData.location.city, isEdit, gigId]);

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleProfessionToggle = (profession: GigProfession) => {
    setFormData((prev) => ({
      ...prev,
      profession: prev.profession.includes(profession)
        ? prev.profession.filter((p) => p !== profession)
        : [...prev.profession, profession],
    }));
  };

  const handlePayRangeChange = (field: "min" | "max" | "type", value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      payRange: {
        ...prev.payRange,
        [field]: field === "type" ? value : Number(value),
      },
    }));
  };

  const handleLocationSelect = useCallback(
    (
      location: { city: string; state: string; lat?: number; lng?: number },
      formattedAddress: string
    ) => {
      setFormData((prev) => ({
        ...prev,
        location: { ...location, address: formattedAddress },
      }));
      setAddressInput(formattedAddress);
    },
    []
  );

  const validateForm = (): boolean => {
    const validationErrors = validateGigForm(formData);
    const sourceUrlError = validateSourceUrl(
      formData.sourceUrl || "",
      formData.source
    );

    if (sourceUrlError) {
      validationErrors.push(sourceUrlError);
    }

    const errorMap: Record<string, string> = {};
    validationErrors.forEach((err) => {
      errorMap[err.field] = err.message;
    });

    setErrors(errorMap);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Show warning if duplicates found
    if (duplicates.length > 0 && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }

    await submitGig();
  };

  const submitGig = async () => {
    setIsSubmitting(true);
    setShowDuplicateWarning(false);

    try {
      if (isEdit && gigId) {
        await updateGig(gigId, formData);
        toast({
          title: "Success",
          description: "Gig updated successfully!",
          variant: "success",
        });
      } else {
        const newGigId = await createGig(formData);
        // Delete draft if it exists
        if (draftId) {
          await deleteDraft(draftId);
        }
        toast({
          title: "Success",
          description: "Gig created successfully!",
          variant: "success",
        });
      }
      router.push("/gigs");
    } catch (error) {
      console.error("Failed to submit gig:", error);
      toast({
        title: "Error",
        description: "Failed to save gig. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const id = await saveDraft("admin", draftId, formData);
      setDraftId(id);
      setLastSaved(new Date());
      toast({
        title: "Draft Saved",
        description: "Your draft has been saved.",
      });
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const titleInfo = getCharacterCountInfo(formData.title, 5, 100);
  const descInfo = getCharacterCountInfo(formData.description, 20, 5000);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Form */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="e.g., Hairstylist Needed at Downtown Salon"
                  className={errors.title ? "border-destructive" : ""}
                />
                <div className="flex justify-between text-xs">
                  {errors.title && (
                    <span className="text-destructive">{errors.title}</span>
                  )}
                  <span
                    className={`ml-auto ${
                      !titleInfo.isValid ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {titleInfo.message}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Describe the gig, requirements, and what the job involves..."
                  rows={6}
                  className={errors.description ? "border-destructive" : ""}
                />
                <div className="flex justify-between text-xs">
                  {errors.description && (
                    <span className="text-destructive">{errors.description}</span>
                  )}
                  <span
                    className={`ml-auto ${
                      !descInfo.isValid ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {descInfo.message}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label>
                  Location <span className="text-destructive">*</span>
                </Label>
                <AddressAutocomplete
                  value={addressInput}
                  onChange={setAddressInput}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Enter address for auto-geocoding..."
                />
                {formData.location.city && formData.location.state && (
                  <p className="text-sm text-muted-foreground">
                    Detected: {formData.location.city}, {formData.location.state}
                    {formData.location.lat && (
                      <span className="text-success ml-2">
                        (Geocoded)
                      </span>
                    )}
                  </p>
                )}
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gig Type */}
              <div className="space-y-2">
                <Label>Gig Type</Label>
                <Select
                  value={formData.gigType}
                  onValueChange={(value) => handleFieldChange("gigType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GIG_TYPE_OPTIONS_LOCAL.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Professions */}
              <div className="space-y-2">
                <Label>
                  Professions <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {PROFESSION_OPTIONS_LOCAL.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={opt.value}
                        checked={formData.profession.includes(opt.value as GigProfession)}
                        onCheckedChange={() =>
                          handleProfessionToggle(opt.value as GigProfession)
                        }
                      />
                      <label
                        htmlFor={opt.value}
                        className="text-sm cursor-pointer"
                      >
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.profession && (
                  <p className="text-xs text-destructive">{errors.profession}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card>
            <CardHeader>
              <CardTitle>Compensation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payMin">Min Pay ($)</Label>
                  <Input
                    id="payMin"
                    type="number"
                    min="0"
                    value={formData.payRange.min || ""}
                    onChange={(e) => handlePayRangeChange("min", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payMax">Max Pay ($)</Label>
                  <Input
                    id="payMax"
                    type="number"
                    min="0"
                    value={formData.payRange.max || ""}
                    onChange={(e) => handlePayRangeChange("max", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pay Type</Label>
                  <Select
                    value={formData.payRange.type}
                    onValueChange={(value) => handlePayRangeChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_TYPE_OPTIONS_LOCAL.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.payRange && (
                <p className="text-xs text-destructive">{errors.payRange}</p>
              )}
            </CardContent>
          </Card>

          {/* Source Info */}
          <Card>
            <CardHeader>
              <CardTitle>Source Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleFieldChange("source", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS_LOCAL.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">Source URL</Label>
                  <Input
                    id="sourceUrl"
                    type="url"
                    value={formData.sourceUrl || ""}
                    onChange={(e) => handleFieldChange("sourceUrl", e.target.value)}
                    placeholder="https://..."
                    className={errors.sourceUrl ? "border-destructive" : ""}
                  />
                  {errors.sourceUrl && (
                    <p className="text-xs text-destructive">{errors.sourceUrl}</p>
                  )}
                </div>
              </div>

              {/* Quality Score */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Quality Score</Label>
                  <span className="text-sm font-medium">
                    {formData.qualityScore}/10
                  </span>
                </div>
                <Slider
                  value={[formData.qualityScore || 5]}
                  onValueChange={([value]) =>
                    handleFieldChange("qualityScore", value)
                  }
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Higher quality gigs appear first in the feed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate Warning */}
          {duplicates.length > 0 && (
            <Card className="border-warning">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">
                      Possible Duplicate{duplicates.length > 1 ? "s" : ""} Detected
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Similar gigs found in {formData.location.city}:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {duplicates.slice(0, 3).map((dupe) => (
                        <li key={dupe.id} className="text-sm">
                          • {dupe.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lastSaved && (
                <span>
                  Draft saved at {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {isSavingDraft && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isEdit ? "Update Gig" : "Publish Gig"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Preview - Sticky on desktop */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-8">
          <GigPreview data={formData} />
        </div>
      </div>

      {/* Duplicate Warning Dialog */}
      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Possible Duplicate Gig</AlertDialogTitle>
            <AlertDialogDescription>
              We found {duplicates.length} similar gig{duplicates.length > 1 ? "s" : ""}{" "}
              in {formData.location.city}. Are you sure you want to create this gig?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitGig}>
              Create Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
