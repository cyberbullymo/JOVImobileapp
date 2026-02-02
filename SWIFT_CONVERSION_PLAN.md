# JoviApp: React Native to Swift/SwiftUI Conversion Plan

## Overview

Convert JoviApp from React Native/Expo to native Swift/SwiftUI for iOS, iPadOS, and macOS, while keeping the existing Firebase backend and Next.js admin panel unchanged.

| Current Stack | Target Stack |
|---------------|--------------|
| React Native 0.81 | Swift 5.9+ |
| Expo 54 | SwiftUI |
| TypeScript | Firebase iOS SDK |
| Zustand | MVVM Architecture |

---

## Project Structure

```
JoviApp-Swift/
├── JoviApp/
│   ├── App/                    # Entry point, ContentView
│   ├── Core/
│   │   ├── Models/             # Swift structs (Codable)
│   │   ├── Services/           # Firebase services (protocol-based)
│   │   ├── ViewModels/         # @Observable classes
│   │   └── Utilities/          # Extensions, helpers, constants
│   ├── Features/
│   │   ├── Authentication/     # SignIn, SignUp views
│   │   ├── Home/               # Feed, filters, search
│   │   ├── Gigs/               # Opportunities screen
│   │   ├── Messages/           # Conversations
│   │   ├── Profile/            # User profile
│   │   └── Apply/              # Internal/External apply flows
│   ├── DesignSystem/           # Theme, reusable components
│   └── Resources/              # Assets, GoogleService-Info.plist
├── JoviAppMac/                 # macOS-specific target
└── JoviAppTests/               # Unit and UI tests
```

---

## Architecture: MVVM with Dependency Injection

| Layer | Responsibility |
|-------|---------------|
| **Models** | Swift structs conforming to `Codable` |
| **Views** | SwiftUI views observing ViewModels |
| **ViewModels** | `@Observable` classes handling business logic |
| **Services** | Protocol-based Firebase services (testable) |

---

## State Management Mapping

| React Native (Zustand) | SwiftUI Equivalent |
|------------------------|-------------------|
| `useAuthStore` | `AuthViewModel` (`@Observable`) |
| `useFeedStore` | `FeedViewModel` (`@Observable`) |
| Local `useState` | `@State` |
| Props | `@Binding` or direct parameters |
| Context | `@Environment` |

---

## Screen Conversion Mapping

| # | React Native | Swift/SwiftUI | Notes |
|---|--------------|---------------|-------|
| 1 | SignInScreen | SignInView | Form validation, OAuth buttons |
| 2 | SignUpScreen | SignUpView | User type picker |
| 3 | HomeScreen | HomeView | LazyVStack, .refreshable() |
| 4 | GigsScreen | GigsView | Placeholder (MVP) |
| 5 | MessagesScreen | MessagesView | Placeholder (MVP) |
| 6 | ProfileScreen | ProfileView | Menu items, logout |
| 7 | FilterModal | FilterModalView | .sheet() presentation |
| 8 | InternalApplyModal | InternalApplyView | .sheet() with form |
| 9 | ExternalApplyConfirm | ExternalApplyConfirmView | Confirmation dialog |

---

## Navigation Architecture

### Platform-Specific Navigation Patterns

| Platform | Pattern | Implementation |
|----------|---------|----------------|
| **iPhone** | Bottom Tab Bar | `TabView` with 4 tabs |
| **iPad** | Sidebar + Tab Bar (adaptive) | `NavigationSplitView` with collapsible sidebar |
| **macOS** | Sidebar Navigation | `NavigationSplitView` with permanent sidebar |

### iPhone Navigation (Compact)

```swift
// Bottom tab navigation for iPhone
TabView(selection: $selectedTab) {
    NavigationStack {
        HomeView()
    }
    .tabItem { Label("Home", systemImage: "house") }
    .tag(Tab.home)

    NavigationStack {
        GigsView()
    }
    .tabItem { Label("Opportunities", systemImage: "briefcase") }
    .tag(Tab.gigs)

    NavigationStack {
        MessagesView()
    }
    .tabItem { Label("Messages", systemImage: "message") }
    .tag(Tab.messages)

    NavigationStack {
        ProfileView()
    }
    .tabItem { Label("Profile", systemImage: "person") }
    .tag(Tab.profile)
}
```

### iPad Navigation (Regular)

```swift
// Adaptive sidebar + detail view for iPad
struct iPadNavigationView: View {
    @State private var selectedSection: NavigationSection? = .home
    @State private var columnVisibility: NavigationSplitViewVisibility = .automatic

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            // Sidebar
            List(NavigationSection.allCases, selection: $selectedSection) { section in
                Label(section.title, systemImage: section.icon)
                    .tag(section)
            }
            .navigationTitle("Jovi")
            .listStyle(.sidebar)
        } detail: {
            // Detail view based on selection
            if let section = selectedSection {
                NavigationStack {
                    switch section {
                    case .home:
                        HomeView()
                    case .gigs:
                        GigsView()
                    case .messages:
                        MessagesView()
                    case .profile:
                        ProfileView()
                    }
                }
            } else {
                ContentUnavailableView("Select a section",
                    systemImage: "sidebar.left",
                    description: Text("Choose from the sidebar"))
            }
        }
        .navigationSplitViewStyle(.balanced)
    }
}
```

### iPad Multi-Column Layout (Landscape)

```swift
// Three-column layout for iPad landscape (e.g., Messages)
struct iPadMessagesView: View {
    @State private var selectedConversation: Conversation?

    var body: some View {
        NavigationSplitView {
            // Sidebar: Navigation sections
            SidebarView()
        } content: {
            // Content: Conversation list
            ConversationListView(selection: $selectedConversation)
        } detail: {
            // Detail: Chat view
            if let conversation = selectedConversation {
                ChatView(conversation: conversation)
            } else {
                ContentUnavailableView("No Conversation Selected",
                    systemImage: "message",
                    description: Text("Select a conversation to view"))
            }
        }
    }
}
```

### macOS Navigation

```swift
// Permanent sidebar for macOS
struct MacNavigationSplitView: View {
    @State private var selectedSection: NavigationSection? = .home

    var body: some View {
        NavigationSplitView {
            List(NavigationSection.allCases, selection: $selectedSection) { section in
                Label(section.title, systemImage: section.icon)
                    .tag(section)
            }
            .navigationSplitViewColumnWidth(min: 200, ideal: 220, max: 300)
            .listStyle(.sidebar)
        } detail: {
            if let section = selectedSection {
                switch section {
                case .home: HomeView()
                case .gigs: GigsView()
                case .messages: MessagesView()
                case .profile: ProfileView()
                }
            }
        }
        .navigationSplitViewStyle(.prominentDetail)
    }
}
```

### Adaptive Navigation Controller

```swift
// Unified navigation that adapts to device
struct MainNavigationView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        #if os(macOS)
        MacNavigationSplitView()
        #else
        if horizontalSizeClass == .compact {
            // iPhone: Tab bar navigation
            MainTabView()
        } else {
            // iPad: Sidebar navigation
            iPadNavigationView()
        }
        #endif
    }
}
```

### Navigation Section Enum

```swift
enum NavigationSection: String, CaseIterable, Identifiable {
    case home
    case gigs
    case messages
    case profile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: return "Home"
        case .gigs: return "Opportunities"
        case .messages: return "Messages"
        case .profile: return "Profile"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house"
        case .gigs: return "briefcase"
        case .messages: return "message"
        case .profile: return "person"
        }
    }

    var selectedIcon: String {
        switch self {
        case .home: return "house.fill"
        case .gigs: return "briefcase.fill"
        case .messages: return "message.fill"
        case .profile: return "person.fill"
        }
    }
}
```

### iPad-Specific Features

| Feature | Implementation |
|---------|----------------|
| **Slide Over** | Supported automatically with `NavigationSplitView` |
| **Split View** | App runs in split screen with other apps |
| **Pointer Support** | Hover states on buttons via `.hoverEffect()` |
| **Keyboard Shortcuts** | `.keyboardShortcut()` modifiers |
| **Drag & Drop** | `.draggable()` and `.dropDestination()` |
| **Stage Manager** | Window resizing supported |

### Keyboard Shortcuts (iPad + macOS)

```swift
extension View {
    func joviKeyboardShortcuts() -> some View {
        self
            .keyboardShortcut("1", modifiers: .command) // Home
            .keyboardShortcut("2", modifiers: .command) // Gigs
            .keyboardShortcut("3", modifiers: .command) // Messages
            .keyboardShortcut("4", modifiers: .command) // Profile
            .keyboardShortcut("f", modifiers: .command) // Search/Filter
            .keyboardShortcut("n", modifiers: .command) // New gig
    }
}
```

---

## Firebase Integration

**Dependencies (Swift Package Manager):**
- `firebase-ios-sdk` (Auth, Firestore, Storage)

**Configuration:**
- Download `GoogleService-Info.plist` from Firebase Console
- Project ID: `jovi-10873` (existing)

**Services to implement:**
- `AuthService` - sign in, sign up, sign out, password reset
- `GigService` - CRUD, queries, quality score updates
- `ApplicationService` - track applications, analytics

---

## Data Model Conversion

**Key types to convert from TypeScript to Swift:**

| TypeScript | Swift |
|------------|-------|
| `UserProfile` | `struct UserProfile: Codable, Identifiable` |
| `Gig` | `struct Gig: Codable, Identifiable` |
| `Application` | `struct Application: Codable` |
| `FeedFilters` | `struct FeedFilters: Equatable` |
| Union types | `enum` with `Codable` |

---

## iOS/iPadOS/macOS Shared Code Strategy

- **90%+ shared:** Models, ViewModels, Services, most Views
- **Platform-specific:** Navigation structure, keyboard handling, window management
- **Conditional compilation:** `#if os(iOS)` / `#if os(macOS)`
- **Size class detection:** `@Environment(\.horizontalSizeClass)` for iPhone vs iPad

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create Xcode project with iOS/macOS targets
- [ ] Set up Firebase SDK via SPM
- [ ] Implement all data models
- [ ] Create design system (JoviTheme)
- [ ] Set up basic navigation shell

### Phase 2: Authentication (Weeks 3-4)
- [ ] AuthService + AuthViewModel
- [ ] SignInView with form validation
- [ ] SignUpView with user type selection
- [ ] Auth state persistence
- [ ] Unit tests

### Phase 3: Core Feed (Weeks 5-7)
- [ ] GigService + FeedViewModel
- [ ] HomeView with feed list
- [ ] FeedCard component
- [ ] FilterModalView + SortDropdown
- [ ] Location permission handling
- [ ] Pull-to-refresh

### Phase 4: Application Flow (Weeks 8-9)
- [ ] ApplicationService
- [ ] ApplyButton component
- [ ] InternalApplyView modal
- [ ] ExternalApplyConfirmView modal
- [ ] Applied gigs tracking
- [ ] SourceBadge + QualityBadge

### Phase 5: Supporting Screens (Weeks 10-11)
- [ ] GigsView (placeholder)
- [ ] MessagesView (placeholder)
- [ ] ProfileView with menu
- [ ] Logout functionality

### Phase 6: iPad & macOS Adaptation (Week 12)
- [ ] iPad NavigationSplitView with adaptive sidebar
- [ ] iPad multi-column layouts (Messages)
- [ ] Pointer/hover effects for iPad
- [ ] Keyboard shortcuts (Cmd+1-4, etc.)
- [ ] macOS sidebar navigation
- [ ] macOS menu bar items
- [ ] Window resizing support

### Phase 7: Polish & Testing (Weeks 13-14)
- [ ] Unit test coverage (80%+)
- [ ] UI tests for critical flows
- [ ] Accessibility (VoiceOver, Dynamic Type)
- [ ] Dark mode support
- [ ] Bug fixes

### Phase 8: Launch (Weeks 15-16)
- [ ] TestFlight beta
- [ ] App Store screenshots/metadata (iPhone, iPad, Mac)
- [ ] App Review submission

---

## Critical Source Files to Reference

| Purpose | Current File |
|---------|-------------|
| Type definitions | `src/types/index.ts` |
| Auth state pattern | `src/store/authStore.ts` |
| Firestore queries | `src/services/firebase/gigService.ts` |
| Complex screen example | `src/screens/home/HomeScreen.tsx` |
| Design tokens | `src/components/design-system/theme/theme.ts` |

---

## Verification Plan

1. **Unit Tests:** All ViewModels and Services with mock dependencies
2. **UI Tests:** Critical flows (auth, apply to gig)
3. **Manual Testing:**
   - Sign up → Sign in → Browse feed → Apply to gig → Logout
   - Filter and sort gigs
   - Location-based filtering
   - External apply flow (opens URL)
4. **Platform Testing:**
   - iPhone (various sizes)
   - iPad (portrait, landscape, split view, slide over)
   - macOS (window resizing)

---

## What Stays Unchanged

- Firebase backend (Firestore, Auth, Storage, Cloud Functions)
- Next.js admin panel
- Cloud Functions for AI quality scoring
- Firestore security rules and indexes

---

## Getting Started

1. Open `JoviApp-Swift/` in Xcode
2. Add Firebase SDK via Swift Package Manager
3. Download `GoogleService-Info.plist` from Firebase Console and add to project
4. Build and run on iOS Simulator or macOS

---

## Resources

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Firebase iOS SDK](https://github.com/firebase/firebase-ios-sdk)
- [Human Interface Guidelines - iPad](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados)
- [NavigationSplitView](https://developer.apple.com/documentation/swiftui/navigationsplitview)
