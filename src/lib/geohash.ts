import Geohash from 'latlon-geohash';

export function generateGeohash(lat: number, lng: number, precision: number = 6): string {
  return Geohash.encode(lat, lng, precision);
}

export function getGeohashRange(lat: number, lng: number, radiusMiles: number) {
  // Convert miles to km
  const radiusKm = radiusMiles * 1.60934;
  
  // Calculate geohash precision based on radius
  // Smaller radius = higher precision
  const precision = radiusKm < 10 ? 6 : radiusKm < 50 ? 5 : 4;
  
  const centerHash = generateGeohash(lat, lng, precision);
  
  // Get neighboring geohashes to cover full radius
  const neighbors = Geohash.neighbours(centerHash);
  
  return {
    center: centerHash,
    neighbors: Object.values(neighbors),
    precision
  };
}

// Add geohash to gig on creation
export async function addGeohashToGig(gigId: string, lat: number, lng: number) {
  const geohash = generateGeohash(lat, lng);
  
  await firestore()
    .collection('gigs')
    .doc(gigId)
    .update({ geohash });
}
