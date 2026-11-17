export interface UserProfile {
  id: string;
  name: string;
  firstName: string;
  email: string;
  avatarInitial: string;
  plan: 'free' | 'pro';
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  language: 'en' | 'hi';
}

