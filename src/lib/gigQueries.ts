export async function queryGigsByLocation(
  userLat: number,
  userLng: number,
  radiusMiles: number
) {
  const { center, neighbors } = getGeohashRange(userLat, userLng, radiusMiles);
  
  // Query gigs with matching geohash prefixes
  const queries = [center, ...neighbors].map(hash =>
    firestore()
      .collection('gigs')
      .where('isActive', '==', true)
      .where('geohash', '>=', hash)
      .where('geohash', '<=', hash + '~')
      .get()
  );
  
  const snapshots = await Promise.all(queries);
  
  // Combine results and remove duplicates
  const gigMap = new Map<string, Gig>();
  snapshots.forEach(snapshot => {
    snapshot.forEach(doc => {
      if (!gigMap.has(doc.id)) {
        gigMap.set(doc.id, { gigId: doc.id, ...doc.data() } as Gig);
      }
    });
  });
  
  // Filter by exact distance and sort
  const gigs = Array.from(gigMap.values());
  return filterGigsByDistance(gigs, userLat, userLng, radiusMiles);
}
