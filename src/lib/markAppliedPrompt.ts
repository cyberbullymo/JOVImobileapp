/**
 * Mark Applied Prompt Utility (GIG-008)
 * Shows a prompt to mark a gig as applied after external application
 */

import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Show an alert prompting the user to mark the gig as applied
 */
export function showMarkAppliedPrompt(
  gigId: string,
  gigTitle: string,
  onMarkApplied: () => void
): void {
  // Haptic feedback to get attention
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  Alert.alert(
    'Did you apply?',
    `Mark "${gigTitle}" as applied to track your applications`,
    [
      {
        text: 'Not Yet',
        style: 'cancel',
      },
      {
        text: 'Mark Applied',
        onPress: () => {
          onMarkApplied();
          // Success haptic
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ],
    { cancelable: true }
  );
}

/**
 * Show a toast notification (simplified version using Alert)
 * In production, use a proper toast library like react-native-toast-message
 */
export function showAppliedToast(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  Alert.alert(
    'Marked as applied!',
    'View in My Applications to track your progress',
    [{ text: 'OK', style: 'default' }],
    { cancelable: true }
  );
}
