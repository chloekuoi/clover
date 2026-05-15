import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import * as Crypto from 'expo-crypto';
import { supabase } from '../../../../lib/supabase';
import { uploadPhoto } from '../../../services/photoService';
import type { OnboardingState } from './CinematicOnboardingFlow';

/**
 * Save all onboarding data and mark profile as complete.
 * Called from SuccessScreen before navigating to MainTabs.
 */
export async function completeOnboarding(
  userId: string,
  state: OnboardingState
): Promise<void> {
  // Upload photo if present (position 0)
  if (state.photoUri) {
    await uploadPhoto(userId, state.photoUri, 0).catch(() => {
      // Photo upload failure shouldn't block onboarding
    });
  }

  // Save profile fields
  const { error } = await supabase
    .from('profiles')
    .update({
      name: state.name.trim() || null,
      birthday: state.birthday || null,
      work_type: (state.workType as string[]).length > 0 ? (state.workType as string[]).join(', ') : null,
      currently_working_on: state.currentlyWorkingOn.trim() || null,
      school: state.school.trim() || null,
      onboarding_complete: true,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to complete onboarding: ${error.message}`);
  }
}

/**
 * Sync device contacts to find friends on the app.
 * Hashes phone numbers client-side before sending to Supabase.
 * Results stored in AsyncStorage for later use.
 */
export async function syncContacts(): Promise<{ matched: number }> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      return { matched: 0 };
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    // Collect and normalize phone numbers
    const phones: string[] = [];
    for (const contact of data) {
      if (!contact.phoneNumbers) continue;
      for (const ph of contact.phoneNumbers) {
        if (ph.number) {
          // Normalize: digits only
          const normalized = ph.number.replace(/\D/g, '');
          if (normalized.length >= 7) {
            phones.push(normalized);
          }
        }
      }
    }

    if (phones.length === 0) return { matched: 0 };

    // SHA-256 hash each phone number
    const hashed = await Promise.all(
      phones.map(p =>
        Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, p)
      )
    );

    // Deduplicate
    const uniqueHashed = [...new Set(hashed)];

    // Query Supabase RPC
    const { data: matches, error } = await supabase.rpc('find_contacts_on_app', {
      hashed_phones: uniqueHashed,
    });

    if (error) {
      console.warn('Contact sync RPC error:', error.message);
      return { matched: 0 };
    }

    // Cache results
    await AsyncStorage.setItem('contact_matches', JSON.stringify(matches ?? []));

    return { matched: (matches ?? []).length };
  } catch (err) {
    console.warn('Contact sync failed:', err);
    return { matched: 0 };
  }
}
