import { Loader } from "@googlemaps/js-api-loader";
import type { GigLocation } from "@/types";

let loader: Loader | null = null;
let googleMapsLoaded: typeof google | null = null;

function getLoader(): Loader {
  if (!loader) {
    loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      libraries: ["places", "geocoding"],
    });
  }
  return loader;
}

async function loadGoogleMaps(): Promise<typeof google> {
  if (googleMapsLoaded) return googleMapsLoaded;

  const l = getLoader();
  googleMapsLoaded = await l.load();
  return googleMapsLoaded;
}

export interface GeocodeResult {
  city: string;
  state: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const result = results[0];
        const { lat, lng } = result.geometry.location;
        const addressComponents = result.address_components;

        const city = extractComponent(addressComponents, "locality") ||
          extractComponent(addressComponents, "sublocality") ||
          extractComponent(addressComponents, "administrative_area_level_2") ||
          "";

        const state = extractComponent(addressComponents, "administrative_area_level_1", true) || "";

        resolve({
          city,
          state,
          lat: lat(),
          lng: lng(),
          formattedAddress: result.formatted_address,
        });
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

function extractComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  useShortName: boolean = false
): string | null {
  const component = components.find((c) => c.types.includes(type));
  if (!component) return null;
  return useShortName ? component.short_name : component.long_name;
}

export async function initAutocomplete(
  inputElement: HTMLInputElement,
  onPlaceSelected: (location: GigLocation, formattedAddress: string) => void
): Promise<google.maps.places.Autocomplete> {
  const google = await loadGoogleMaps();

  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    types: ["address"],
    componentRestrictions: { country: "us" },
    fields: ["address_components", "geometry", "formatted_address"],
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (!place.geometry?.location || !place.address_components) {
      return;
    }

    const addressComponents = place.address_components;
    const city = extractComponent(addressComponents, "locality") ||
      extractComponent(addressComponents, "sublocality") ||
      extractComponent(addressComponents, "administrative_area_level_2") ||
      "";

    const state = extractComponent(addressComponents, "administrative_area_level_1", true) || "";

    const location: GigLocation = {
      city,
      state,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address,
    };

    onPlaceSelected(location, place.formatted_address || "");
  });

  return autocomplete;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const result = results[0];
        const addressComponents = result.address_components;

        const city = extractComponent(addressComponents, "locality") ||
          extractComponent(addressComponents, "sublocality") ||
          "";

        const state = extractComponent(addressComponents, "administrative_area_level_1", true) || "";

        resolve({
          city,
          state,
          lat,
          lng,
          formattedAddress: result.formatted_address,
        });
      } else {
        resolve(null);
      }
    });
  });
}
