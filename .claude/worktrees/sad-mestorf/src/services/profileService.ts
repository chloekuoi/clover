import { supabase } from '../../lib/supabase';
import { Profile, ProfilePhoto } from '../types';

type UpdateProfileFields = Partial<{
  username: string;
  phone_number: string | null;
  name: string | null;
  tagline: string | null;
  currently_working_on: string | null;
  work: string | null;
  school: string | null;
  work_type: string | null;
  birthday: string | null;
  neighborhood: string | null;
  city: string | null;
}>;

type ServiceResult<T> = {
  data: T;
  error: string | null;
};

type FullProfile = {
  profile: Profile | null;
  photos: ProfilePhoto[];
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;
  const message = (error as { message?: string }).message;
  return message || fallback;
}

function toProfileUpdateErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Failed to update profile';

  const { code, message, details } = error as {
    code?: string;
    message?: string;
    details?: string;
  };

  const combined = `${message || ''} ${details || ''}`.toLowerCase();
  if (code === '23505' && combined.includes('username')) {
    return 'Username is already taken.';
  }

  return message || 'Failed to update profile';
}

export async function updateProfile(
  userId: string,
  fields: UpdateProfileFields
): Promise<ServiceResult<Profile | null>> {
  const payload: UpdateProfileFields & { updated_at: string } = {
    ...fields,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    const message = toProfileUpdateErrorMessage(error);
    console.error('Error updating profile:', message);
    return { data: null, error: message };
  }

  return { data: (data as Profile) || null, error: null };
}

export async function getFullProfile(userId: string): Promise<ServiceResult<FullProfile>> {
  const [profileResult, photosResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true }),
  ]);

  if (profileResult.error) {
    const message = toErrorMessage(profileResult.error, 'Failed to fetch profile');
    console.error('Error fetching profile:', message);
    return { data: { profile: null, photos: [] }, error: message };
  }

  if (photosResult.error) {
    const message = toErrorMessage(photosResult.error, 'Failed to fetch profile photos');
    console.error('Error fetching profile photos:', message);
    return {
      data: {
        profile: (profileResult.data as Profile | null) || null,
        photos: [],
      },
      error: message,
    };
  }

  return {
    data: {
      profile: (profileResult.data as Profile | null) || null,
      photos: (photosResult.data || []) as ProfilePhoto[],
    },
    error: null,
  };
}
