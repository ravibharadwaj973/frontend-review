export const CATEGORIES = ['Beauty salon', 'Hair salon', 'Spa', 'Barbershop', 'Gym', 'Yoga studio', 'Dental clinic', 'Medical clinic', 'Physiotherapy', 'Restaurant', 'Cafe', 'Hotel', 'Other'];

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const PHOTO_CATEGORIES: { value: string; label: string }[] = [
  { value: 'logo', label: 'Logo' },
  { value: 'cover', label: 'Cover' },
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'team', label: 'Team' },
  { value: 'services', label: 'Services' },
  { value: 'products', label: 'Products' },
  { value: 'before_after', label: 'Before / after' },
  { value: 'events', label: 'Events' },
  { value: 'other', label: 'Other' },
];

export const TONES = [
  { value: 'warm', label: 'Warm', example: 'Thank you so much, Priya! We’re thrilled you loved your facial.' },
  { value: 'professional', label: 'Professional', example: 'Thank you for your feedback, Priya. We are pleased you enjoyed your facial.' },
  { value: 'playful', label: 'Playful', example: 'Priya, you just made our day! So happy the facial left you glowing.' },
  { value: 'concise', label: 'Concise', example: 'Thanks, Priya — glad you enjoyed the facial. See you soon!' },
];

/** Starter menus by business type, used in onboarding. */
export const PRESET_SERVICES: Record<string, { name: string; category: string; price: number; duration: number }[]> = {
  salon: [
    { name: 'Haircut', category: 'Hair', price: 500, duration: 45 },
    { name: 'Hair Spa', category: 'Hair', price: 1200, duration: 60 },
    { name: 'Hair Colour', category: 'Hair', price: 2500, duration: 120 },
    { name: 'Cleanup', category: 'Skin', price: 700, duration: 30 },
    { name: 'Facial', category: 'Skin', price: 1000, duration: 45 },
    { name: 'Manicure', category: 'Hands & feet', price: 600, duration: 40 },
    { name: 'Pedicure', category: 'Hands & feet', price: 800, duration: 50 },
    { name: 'Makeup', category: 'Makeup', price: 2500, duration: 75 },
  ],
  gym: [
    { name: 'Monthly membership', category: 'Membership', price: 2500, duration: 0 },
    { name: 'Personal training session', category: 'Training', price: 800, duration: 60 },
    { name: 'Yoga class', category: 'Classes', price: 400, duration: 60 },
    { name: 'Zumba class', category: 'Classes', price: 400, duration: 45 },
  ],
  clinic: [
    { name: 'General consultation', category: 'Consultation', price: 600, duration: 20 },
    { name: 'Dental cleaning', category: 'Dental', price: 1500, duration: 45 },
    { name: 'Physiotherapy session', category: 'Therapy', price: 900, duration: 45 },
    { name: 'Follow-up visit', category: 'Consultation', price: 300, duration: 15 },
  ],
  restaurant: [
    { name: 'Dine-in', category: 'Dining', price: 0, duration: 0 },
    { name: 'Takeaway', category: 'Dining', price: 0, duration: 0 },
    { name: 'Home delivery', category: 'Dining', price: 0, duration: 0 },
    { name: 'Private party', category: 'Events', price: 0, duration: 180 },
  ],
};

export function presetFor(category = ''): keyof typeof PRESET_SERVICES {
  const c = category.toLowerCase();
  if (/gym|yoga|fitness/.test(c)) return 'gym';
  if (/clinic|dental|physio|medical/.test(c)) return 'clinic';
  if (/restaurant|cafe|hotel/.test(c)) return 'restaurant';
  return 'salon';
}
