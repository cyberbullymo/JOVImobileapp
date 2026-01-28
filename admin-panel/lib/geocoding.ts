import type { GigLocation } from "@/types";
import { Loader } from "@googlemaps/js-api-loader";

let loader: Loader | null = null;

function getLoader(): Loader {
  if (!loader) {
    loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      // Libraries are now better handled via importLibrary, but we keep core here
      version: "weekly",
    });
  }
  return loader;
}

/**
 * Modern way to load libraries using the New API's importLibrary pattern
 */
async function getPlacesLibrary() {
  await getLoader().importLibrary("maps");
  return (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
}

async function getGeocodingLibrary() {
  await getLoader().importLibrary("maps");
  return (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
}

export interface GeocodeResult {
  city: string;
  state: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Helper to extract components from legacy Geocoder results
 */
function extractComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  useShortName: boolean = false
): string | null {
  const component = components.find((c) => c.types.includes(type));
  if (!component) return null;
  return useShortName ? component.short_name : component.long_name;
}

/**
 * Helper to extract components from the New Place class
 */
function extractComponentFromPlace(
  components: google.maps.places.AddressComponent[] | undefined,
  type: string,
  useShortName: boolean = false
): string | null {
  if (!components || !Array.isArray(components)) return null;
  const component = components.find((c) => c.types.includes(type));
  if (!component) return null;
  return useShortName ? component.shortText : component.longText;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const { Geocoder } = await getGeocodingLibrary();
  const geocoder = new Geocoder();

  const { results } = await geocoder.geocode({ address });
  
  if (results && results[0]) {
    const result = results[0];
    const { lat, lng } = result.geometry.location;

    return {
      city: extractComponent(result.address_components, "locality") || 
            extractComponent(result.address_components, "sublocality") || "",
      state: extractComponent(result.address_components, "administrative_area_level_1", true) || "",
      lat: lat(),
      lng: lng(),
      formattedAddress: result.formatted_address,
    };
  }
  throw new Error("Geocoding failed");
}

export interface AutocompleteInstance {
  element: HTMLElement;
  cleanup: () => void;
}

export interface AutocompleteOptions {
  placeholder?: string;
  disabled?: boolean;
}

export async function initAutocomplete(
  containerElement: HTMLElement,
  onPlaceSelected: (location: GigLocation, formattedAddress: string) => void,
  options: AutocompleteOptions = {}
): Promise<AutocompleteInstance> {
  // Create a simple input element - we'll use Geocoder API instead of Autocomplete
  const inputElement = document.createElement("input");
  inputElement.type = "text";
  inputElement.className = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  if (options.placeholder) {
    inputElement.placeholder = options.placeholder;
  }
  if (options.disabled) {
    inputElement.disabled = true;
  }

  containerElement.appendChild(inputElement);

  // Debounced geocoding on blur or Enter key
  let debounceTimer: NodeJS.Timeout | null = null;

  const handleGeocode = async () => {
    const address = inputElement.value.trim();
    if (!address) return;

    console.log("Geocoding address:", address);

    try {
      const result = await geocodeAddress(address);
      console.log("Geocode result:", result);

      const gigLocation: GigLocation = {
        city: result.city,
        state: result.state,
        lat: result.lat,
        lng: result.lng,
        address: result.formattedAddress,
      };

      onPlaceSelected(gigLocation, result.formattedAddress);
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
  };

  // Geocode on blur (when user clicks away)
  inputElement.addEventListener("blur", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleGeocode, 300);
  });

  // Geocode on Enter key
  inputElement.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceTimer) clearTimeout(debounceTimer);
      handleGeocode();
    }
  });

  return {
    element: inputElement,
    cleanup: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (containerElement.contains(inputElement)) {
        containerElement.removeChild(inputElement);
      }
    },
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const { Geocoder } = await getGeocodingLibrary();
  const geocoder = new Geocoder();

  try {
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    if (results && results[0]) {
      const result = results[0];
      return {
        city: extractComponent(result.address_components, "locality") || "",
        state: extractComponent(result.address_components, "administrative_area_level_1", true) || "",
        lat,
        lng,
        formattedAddress: result.formatted_address,
      };
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}