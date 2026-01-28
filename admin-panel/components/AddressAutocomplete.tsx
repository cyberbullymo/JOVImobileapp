"use client";

import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { initAutocomplete } from "@/lib/geocoding";
import type { GigLocation } from "@/types";
import { MapPin, Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onLocationSelect: (location: GigLocation, formattedAddress: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter address...",
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inputRef.current || typeof window === "undefined") return;

    let autocomplete: google.maps.places.Autocomplete | null = null;

    const initAC = async () => {
      try {
        setIsLoading(true);
        autocomplete = await initAutocomplete(
          inputRef.current!,
          (location, formattedAddress) => {
            onLocationSelect(location, formattedAddress);
            onChange(formattedAddress);
            setError(null);
          }
        );
      } catch (err) {
        console.error("Failed to initialize autocomplete:", err);
        setError("Address autocomplete unavailable");
      } finally {
        setIsLoading(false);
      }
    };

    // Only initialize if Google Maps API key is available
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      initAC();
    }

    return () => {
      // Cleanup autocomplete listeners
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [onChange, onLocationSelect]);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
