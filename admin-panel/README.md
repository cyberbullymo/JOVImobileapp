# Jovi Admin Panel

Web-based admin panel for manually curating gigs from external sources during the Phase 1 aggregation roadmap.

## Features

- **Authentication**: Firebase Auth with admin role verification
- **Gig Management**: Create, edit, deactivate, and delete gigs
- **Google Maps Integration**: Auto-geocoding from address input
- **Duplicate Detection**: Warns when similar gigs exist
- **Draft Saving**: Autosave every 30 seconds
- **Mobile Preview**: Real-time preview of how gigs appear in the app
- **Bulk Actions**: Select multiple gigs for bulk operations
- **CSV Export**: Export gigs for reporting
- **Analytics Dashboard**: Track curation progress and goals

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui components
- **Auth**: Firebase Auth
- **Database**: Firebase Firestore
- **Geocoding**: Google Maps JavaScript API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore and Auth enabled
- Google Maps API key with Geocoding and Places enabled

### Environment Variables

Create a `.env.local` file in the `admin-panel` directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Installation

```bash
cd admin-panel
npm install
```

### Development

```bash
npm run dev
```

The admin panel will be available at http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## Setting Up Admin Users

Admin users need the `admin` custom claim set on their Firebase Auth account. This can be done via:

1. **Firebase Console**: Navigate to Authentication > Users > Select user > Custom claims
2. **Firebase Admin SDK**: Use a Cloud Function or script to set claims

Example script to set admin claim:

```typescript
import { getAuth } from 'firebase-admin/auth';

async function setAdminClaim(uid: string) {
  await getAuth().setCustomUserClaims(uid, { admin: true });
  console.log(`Admin claim set for user ${uid}`);
}
```

## Project Structure

```
admin-panel/
├── app/
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Dashboard
│   ├── login/page.tsx       # Login page
│   ├── gigs/
│   │   ├── page.tsx         # Gigs list view
│   │   ├── new/page.tsx     # Create new gig
│   │   └── [id]/edit/page.tsx  # Edit existing gig
│   └── sources/page.tsx     # Source tracking
├── components/
│   ├── ui/                  # UI primitives (shadcn/ui style)
│   ├── AuthProvider.tsx     # Authentication context
│   ├── DashboardLayout.tsx  # Main layout with sidebar
│   ├── GigForm.tsx          # Gig creation/editing form
│   ├── GigPreview.tsx       # Mobile preview component
│   ├── GigTable.tsx         # Gigs data table
│   ├── AddressAutocomplete.tsx  # Google Places input
│   └── StatsCards.tsx       # Analytics components
├── lib/
│   ├── firebase.ts          # Firebase configuration and operations
│   ├── geocoding.ts         # Google Maps geocoding
│   ├── validators.ts        # Form validation
│   └── utils.ts             # Utility functions
├── hooks/
│   └── useToast.ts          # Toast notifications
├── types/
│   └── index.ts             # TypeScript types
└── package.json
```

## Deployment

### Vercel (Recommended)

1. Push the admin-panel directory to your repository
2. Connect your repo to Vercel
3. Set the root directory to `admin-panel`
4. Add environment variables in Vercel dashboard
5. Deploy

### Manual Deployment

Build the production bundle and deploy to your hosting provider:

```bash
npm run build
# Deploy the .next folder
```

## Security Considerations

- Admin access is verified on every page load via Firebase Auth custom claims
- Firestore security rules enforce admin-only access for gig management
- Source URLs are validated to prevent injection
- Draft data is tied to user sessions

## Weekly Curation Goals

The dashboard tracks progress toward weekly goals:

- **Target**: 10-15 gigs per week
- **Quality Score Target**: Average 7+/10
- **Sources**: Prioritize Craigslist, school boards, salon Instagram

## Support

For issues or questions, contact the Jovi development team.
