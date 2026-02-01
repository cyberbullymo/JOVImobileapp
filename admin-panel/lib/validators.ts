import type { GigFormData, ValidationError } from "@/types";

export function validateGigForm(data: GigFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (data.title.length < 5) {
    errors.push({ field: "title", message: "Title must be at least 5 characters" });
  } else if (data.title.length > 100) {
    errors.push({ field: "title", message: "Title must be less than 100 characters" });
  }

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: "description", message: "Description is required" });
  } else if (data.description.length < 20) {
    errors.push({ field: "description", message: "Description must be at least 20 characters" });
  } else if (data.description.length > 5000) {
    errors.push({ field: "description", message: "Description must be less than 5000 characters" });
  }

  // Location validation
  if (!data.location.city || data.location.city.trim().length === 0) {
    errors.push({ field: "location", message: "City is required" });
  }
  if (!data.location.state || data.location.state.trim().length === 0) {
    errors.push({ field: "location", message: "State is required" });
  }

  // Profession validation
  if (!data.profession || data.profession.length === 0) {
    errors.push({ field: "profession", message: "At least one profession must be selected" });
  }

  // 5. CONDITIONAL VALIDATION: Booth Rental vs. Pay Range
  if (data.gigType === "booth-rental") {
    // Check booth rent
    if (data.boothRentCost === undefined || data.boothRentCost === null || data.boothRentCost === 0) {
      errors.push({ field: "boothRentCost", message: "Booth rental cost is required" });
    } else if (data.boothRentCost < 0) {
      errors.push({ field: "boothRentCost", message: "Booth rental cost cannot be negative" });
    }
  } else {
    // Check standard pay range
    if (data.payRange.min < 0) {
      errors.push({ field: "payRange", message: "Minimum pay cannot be negative" });
    }
    if (data.payRange.max < data.payRange.min) {
      errors.push({ field: "payRange", message: "Maximum pay must be greater than minimum" });
    }
    if (data.payRange.max === 0 && data.payRange.min === 0) {
      errors.push({ field: "payRange", message: "Pay range is required" });
    }
  }

  // Source URL validation
  if (data.sourceUrl && !isValidUrl(data.sourceUrl)) {
    errors.push({ field: "sourceUrl", message: "Source URL must be a valid URL" });
  }

  // Quality score validation
  if (data.qualityScore !== undefined) {
    if (data.qualityScore < 1 || data.qualityScore > 10) {
      errors.push({ field: "qualityScore", message: "Quality score must be between 1 and 10" });
    }
  }

  return errors;
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function validateSourceUrl(url: string, source: string): ValidationError | null {
  if (!url) return null;

  if (!isValidUrl(url)) {
    return { field: "sourceUrl", message: "Invalid URL format" };
  }

  // Source-specific validation
  const urlLower = url.toLowerCase();

  if (source === "craigslist" && !urlLower.includes("craigslist")) {
    return { field: "sourceUrl", message: "URL should be from Craigslist" };
  }

  if (source === "indeed" && !urlLower.includes("indeed")) {
    return { field: "sourceUrl", message: "URL should be from Indeed" };
  }

  if (source === "instagram" && !urlLower.includes("instagram")) {
    return { field: "sourceUrl", message: "URL should be from Instagram" };
  }

  return null;
}

export function getCharacterCountInfo(
  text: string,
  min: number,
  max: number
): { count: number; isValid: boolean; message: string } {
  const count = text.length;
  const isValid = count >= min && count <= max;

  let message = `${count}/${max} characters`;
  if (count < min) {
    message = `${count}/${min} minimum characters required`;
  } else if (count > max) {
    message = `${count - max} characters over limit`;
  }

  return { count, isValid, message };
}
