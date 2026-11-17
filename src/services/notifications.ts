import { Platform } from 'react-native';
import { Subscription } from '../domain/subscription';
import { differenceInDays, subDays } from 'date-fns';

let NotificationsModule: any = null;

function getNotifications(): any {
  if (Platform.OS === 'web' || typeof window === 'undefined') {
    return null;
  }
  if (!NotificationsModule) {
    try {
      NotificationsModule = require('expo-notifications');
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch {
      NotificationsModule = null;
    }
  }
  return NotificationsModule;
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    const Notifications = getNotifications();
    if (!Notifications) return false;

    try {
      const permissions: any = await Notifications.getPermissionsAsync();
      let isGranted = permissions?.granted || permissions?.status === 'granted';
      if (!isGranted) {
        const req: any = await Notifications.requestPermissionsAsync();
        isGranted = req?.granted || req?.status === 'granted';
      }
      return !!isGranted;
    } catch {
      return false;
    }
  }

  static async scheduleSubscriptionReminder(subscription: Subscription): Promise<string[]> {
    const Notifications = getNotifications();
    if (!Notifications || subscription.status !== 'active') return [];

    const scheduledIds: string[] = [];
    const renewalDate = new Date(subscription.nextRenewalDate);
    const now = new Date();

    const reminderDaysList = [1, subscription.reminderDays || 3];
    const uniqueDays = Array.from(new Set(reminderDaysList));

    for (const daysBefore of uniqueDays) {
      const triggerDate = subDays(renewalDate, daysBefore);
      const diffDays = differenceInDays(triggerDate, now);

      if (diffDays >= 0) {
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: `Upcoming Renewal: ${subscription.name}`,
              body: `${subscription.name} is scheduled for renewal in ${daysBefore} day${daysBefore > 1 ? 's' : ''} (₹${(subscription.amountPaise / 100).toFixed(2)}).`,
              data: { subscriptionId: subscription.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes?.DATE || 'date',
              date: triggerDate,
            },
          });
          scheduledIds.push(id);
        } catch (e) {
          console.warn('Could not schedule notification:', e);
        }
      }
    }

    return scheduledIds;
  }

  static async cancelAllScheduled(): Promise<void> {
    const Notifications = getNotifications();
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignored
    }
  }
}
