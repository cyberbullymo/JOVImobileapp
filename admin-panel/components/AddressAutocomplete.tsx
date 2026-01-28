"use client";

import { initAutocomplete, type AutocompleteInstance } from "@/lib/geocoding";
import type { GigLocation } from "@/types";
import { Loader2, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteProps {
  value?: string; // Accepted for API compatibility; web component manages its own input state
  onChange: (address: string) => void;
  onLocationSelect: (location: GigLocation, formattedAddress: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  onChange,
  onLocationSelect,
  placeholder = "Enter address...",
  disabled = false,
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<AutocompleteInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to store callbacks to avoid re-running effect when they change
  const onChangeRef = useRef(onChange);
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onChangeRef.current = onChange;
    onLocationSelectRef.current = onLocationSelect;
  }, [onChange, onLocationSelect]);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    // Prevent duplicate initialization
    if (autocompleteRef.current) {
      return;
    }

    const initAC = async () => {
      try {
        setIsLoading(true);
        // Clear container to prevent duplicate inputs
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        autocompleteRef.current = await initAutocomplete(
          containerRef.current!,
          (location, formattedAddress) => {
            onLocationSelectRef.current(location, formattedAddress);
            onChangeRef.current(formattedAddress);
            setError(null);
          },
          { placeholder, disabled }
        );
      } catch (err) {
        console.error("Failed to initialize autocomplete:", err);
        setError("Address autocomplete unavailable");
      } finally {
        setIsLoading(false);
      }
    };

    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      initAC();
    }

    return () => {
      if (autocompleteRef.current) {
        autocompleteRef.current.cleanup();
        autocompleteRef.current = null;
      }
      // Also clear the container on cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [placeholder, disabled]);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-20 pointer-events-none" />

      <div
        ref={containerRef}
        className="w-full jovi-autocomplete"
      />

      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground z-20" />
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
