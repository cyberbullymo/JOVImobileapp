/**
 * Gig Location Queries
 * Functions for querying gigs by location using geohash
 * GIG-009: Location-Based Filtering
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase/config';
import { getGeohashRange } from './geohash';
import { filterGigsByDistance } from './distance';
import type { Gig } from '../types';

export async function queryGigsByLocation(
  userLat: number,
  userLng: number,
  radiusMiles: number
): Promise<Gig[]> {
  const { center, neighbors } = getGeohashRange(userLat, userLng, radiusMiles);

  const gigsRef = collection(firestore, 'gigs');

  // Query gigs with matching geohash prefixes
  const queries = [center, ...neighbors].map((hash) =>
    getDocs(
      query(
        gigsRef,
        where('isActive', '==', true),
        where('geohash', '>=', hash),
        where('geohash', '<=', hash + '~')
      )
    )
  );

  const snapshots = await Promise.all(queries);

  // Combine results and remove duplicates
  const gigMap = new Map<string, Gig>();
  snapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      if (!gigMap.has(doc.id)) {
        gigMap.set(doc.id, { id: doc.id, ...doc.data() } as Gig);
      }
    });
  });

  // Filter by exact distance and sort
  const gigs = Array.from(gigMap.values());
  return filterGigsByDistance(gigs, userLat, userLng, radiusMiles);
}
