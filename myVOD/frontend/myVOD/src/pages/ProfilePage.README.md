# Profile Page Documentation

## Overview

The Profile page (`/app/profile`) allows authenticated users to manage their VOD platform preferences and account settings. Users can configure which streaming platforms they have access to, and permanently delete their account if needed.

## Features

### Platform Preferences Management
- **Visual Platform Selection**: Users can select/deselect VOD platforms using accessible checkboxes
- **Real-time Updates**: Changes are immediately reflected in the watchlist and suggestions
- **Persistent Storage**: Platform preferences are saved to the backend and persist across sessions

### Account Management
- **GDPR Compliance**: Account deletion follows GDPR requirements with clear warnings
- **Confirmation Dialog**: Multiple confirmation steps prevent accidental account deletion
- **Session Cleanup**: Proper logout and token cleanup after account deletion

## Component Architecture

### ProfilePage (Main Container)
```tsx
<ProfilePage />
```

**Responsibilities:**
- Orchestrates data fetching and mutations
- Manages local state for platform selections
- Handles authentication redirects
- Provides error boundaries and loading states

**Props:** None (routed component)

**State:**
- `platformSelection`: Local state for platform checkboxes and dirty tracking
- `deleteAccountState`: State for delete account dialog

### PageHeader
```tsx
<PageHeader email="user@example.com" />
```

**Props:**
- `email: string` - User's email address

**Features:**
- Displays page title and user email
- Responsive layout

### PlatformPreferencesCard
```tsx
<PlatformPreferencesCard
  platforms={platforms}
  selectedIds={selectedIds}
  onToggle={handleToggle}
  dirty={isDirty}
  saving={isSaving}
  onSave={handleSave}
  onReset={handleReset}
/>
```

**Props:**
- `platforms: PlatformDto[]` - Available platforms
- `selectedIds: number[]` - Currently selected platform IDs
- `onToggle: (id: number) => void` - Toggle platform selection
- `dirty: boolean` - Whether changes have been made
- `saving: boolean` - Whether save operation is in progress
- `onSave: () => void` - Save changes callback
- `onReset: () => void` - Reset changes callback

### PlatformCheckboxGroup
```tsx
<PlatformCheckboxGroup
  platforms={platforms}
  selectedIds={selectedIds}
  onToggle={handleToggle}
/>
```

**Props:**
- `platforms: PlatformDto[]` - Platforms to display
- `selectedIds: number[]` - Selected platform IDs
- `onToggle: (id: number) => void` - Toggle callback

**Accessibility Features:**
- Uses semantic `<fieldset>` and `<legend>` elements
- Provides selection count in `aria-label`

### PlatformCheckboxItem
```tsx
<PlatformCheckboxItem
  platform={platform}
  checked={isChecked}
  onChange={handleChange}
/>
```

**Props:**
- `platform: PlatformDto` - Platform data
- `checked: boolean` - Whether platform is selected
- `onChange: (id: number) => void` - Change callback

**Accessibility Features:**
- Proper `aria-describedby` linking to status text
- Screen reader announcements for checked/unchecked states
- Focus management with visible focus indicators

### SaveChangesBar
```tsx
<SaveChangesBar
  dirty={isDirty}
  saving={isSaving}
  onSave={handleSave}
  onReset={handleReset}
/>
```

**Props:**
- `dirty: boolean` - Whether changes exist
- `saving: boolean` - Save operation status
- `onSave: () => void` - Save callback
- `onReset: () => void` - Reset callback

**Accessibility Features:**
- `role="toolbar"` for action grouping
- `aria-describedby` linking to action descriptions
- Screen reader text for button states

### DangerZoneCard
```tsx
<DangerZoneCard onRequestDelete={handleDeleteRequest} />
```

**Props:**
- `onRequestDelete: () => void` - Delete request callback

**Features:**
- Warning styling with destructive color scheme
- Clear GDPR compliance messaging

### DeleteAccountSection
```tsx
<DeleteAccountSection
  open={isOpen}
  onOpenChange={setIsOpen}
  deleting={isDeleting}
  onConfirm={handleConfirm}
/>
```

**Props:**
- `open: boolean` - Dialog visibility
- `onOpenChange: (open: boolean) => void` - Dialog state callback
- `deleting: boolean` - Deletion operation status
- `onConfirm: () => void` - Confirm deletion callback

**Accessibility Features:**
- `role="alertdialog"` for screen readers
- Proper `aria-labelledby` and `aria-describedby` attributes
- Focus management and keyboard navigation

## API Integration

### Endpoints Used

#### GET `/api/me/`
- **Purpose**: Fetch user profile with selected platforms
- **Response**: `UserProfileDto`
- **Caching**: 5 minutes stale time
- **Error Handling**: Automatic token refresh on 401

#### PATCH `/api/me/`
- **Purpose**: Update user platform preferences
- **Request Body**: `UpdateUserProfileCommand`
- **Response**: Updated `UserProfileDto`
- **Side Effects**: Invalidates userMovies and aiSuggestions queries

#### GET `/api/platforms/`
- **Purpose**: Fetch all available VOD platforms
- **Response**: `PlatformDto[]`
- **Caching**: 30 minutes stale time

#### DELETE `/api/me/` (Planned)
- **Purpose**: Permanently delete user account
- **Response**: 204 No Content
- **Side Effects**: Session cleanup and redirect

## State Management

### TanStack Query Integration
- **User Profile**: `useUserProfile()` hook
- **Platforms**: `usePlatforms()` hook
- **Platform Updates**: `useUpdateUserPlatforms()` mutation
- **Account Deletion**: `useDeleteAccount()` mutation

### Local State
- **Platform Selection**: Tracks current selections and compares with initial state
- **Dirty Tracking**: Compares current vs initial platform selections
- **Delete Dialog**: Manages confirmation dialog state

## User Flows

### Platform Preferences Update
1. User visits profile page
2. System loads current platform preferences
3. User toggles platform checkboxes
4. System detects changes (`isDirty = true`)
5. Save button becomes enabled
6. User clicks "Zapisz zmiany"
7. System sends PATCH request to `/api/me/`
8. On success: Shows toast, invalidates related queries, resets dirty state
9. On error: Shows error toast, maintains local changes

### Account Deletion
1. User clicks "Usuń konto" button
2. System opens confirmation dialog
3. User confirms deletion
4. System sends DELETE request
5. On success: Shows toast, clears session, redirects to home
6. On error: Shows error toast, keeps dialog open

## Error Handling

### API Errors
- **401 Unauthorized**: Automatic token refresh, fallback to login redirect
- **Network Errors**: User-friendly error messages with retry options
- **Validation Errors**: Specific error messages for invalid platform IDs

### User Experience
- **Loading States**: Skeleton components during data fetching
- **Error Boundaries**: Graceful error display with recovery options
- **Toast Notifications**: Success and error feedback
- **Form Validation**: Client-side validation with immediate feedback

## Accessibility (WCAG 2.1 AA)

### Screen Reader Support
- Semantic HTML structure with proper headings
- ARIA labels and descriptions for complex interactions
- Live regions for dynamic content updates
- Focus management in dialogs and forms

### Keyboard Navigation
- Tab order follows logical reading order
- Enter/Space activation for interactive elements
- Escape key closes dialogs
- Focus indicators visible and high contrast

### Color and Contrast
- Sufficient contrast ratios for all text
- Color is not the only means of conveying information
- Focus indicators meet contrast requirements

### Motion and Animation
- Respects `prefers-reduced-motion` setting
- Animations are brief and non-distracting
- Loading states provide clear feedback

## Testing

### Unit Tests
- Component rendering and prop handling
- User interaction simulation
- Accessibility attribute verification
- Error state handling

### Integration Tests
- Full page rendering with mocked API
- User flow validation
- State management verification
- Error handling scenarios

## Performance Considerations

### Code Splitting
- Components are tree-shakeable
- Lazy loading opportunities identified

### Query Optimization
- Appropriate cache times for different data types
- Query invalidation minimizes unnecessary refetches
- Background updates for better UX

### Bundle Size
- Minimal dependencies added
- Shared UI components reused
- Tree-shaking enabled

## Future Enhancements

### Planned Features
- **Platform Icons**: Visual platform identification
- **Bulk Operations**: Select/deselect all platforms
- **Platform Search**: Filter long platform lists
- **Usage Analytics**: Show platform usage statistics

### Backend Integration
- **Account Deletion Endpoint**: Implement DELETE `/api/me/`
- **Platform Metadata**: Additional platform information
- **Audit Logging**: GDPR compliance logging

## Dependencies

### External Libraries
- `@tanstack/react-query`: Data fetching and caching
- `@radix-ui/react-alert-dialog`: Accessible dialog component
- `sonner`: Toast notifications
- `lucide-react`: Icons (planned)

### Internal Dependencies
- `AuthContext`: Authentication state management
- `API hooks`: Data fetching abstractions
- `UI components`: Shared design system components
