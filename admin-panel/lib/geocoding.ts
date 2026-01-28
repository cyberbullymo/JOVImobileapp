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
  components: google.maps.places.AddressComponent[],
  type: string,
  useShortName: boolean = false
): string | null {
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

export async function initAutocomplete(
  containerElement: HTMLElement,
  onPlaceSelected: (location: GigLocation, formattedAddress: string) => void
): Promise<AutocompleteInstance> {
  await getPlacesLibrary();

  // Create the web component
  const autocompleteElement = new google.maps.places.PlaceAutocompleteElement({
    componentRestrictions: { country: "us" },
  });

  // Inject styles to make the web component look like a standard input
  // The new element uses a shadow DOM, so we style the host
  autocompleteElement.classList.add("w-full");

  const handlePlaceSelect = async (event: any) => {
    const place = event.place; // This is a google.maps.places.Place object

    // Request specific fields to minimize cost/latency
    await place.fetchFields({
      fields: ["location", "addressComponents", "formattedAddress"],
    });

    if (place.location) {
      const city = extractComponentFromPlace(place.addressComponents, "locality") ||
                   extractComponentFromPlace(place.addressComponents, "sublocality") || "";
      
      const state = extractComponentFromPlace(place.addressComponents, "administrative_area_level_1", true) || "";

      const gigLocation: GigLocation = {
        city,
        state,
        lat: place.location.lat(),
        lng: place.location.lng(),
        address: place.formattedAddress,
      };

      onPlaceSelected(gigLocation, place.formattedAddress || "");
    }
  };

  autocompleteElement.addEventListener("gmp-placeselect", handlePlaceSelect);
  containerElement.appendChild(autocompleteElement);

  return {
    element: autocompleteElement,
    cleanup: () => {
      autocompleteElement.removeEventListener("gmp-placeselect", handlePlaceSelect);
      if (containerElement.contains(autocompleteElement)) {
        containerElement.removeChild(autocompleteElement);
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