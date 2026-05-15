import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme, spacing, borderRadius, touchTarget } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import PhotoSlots, { PhotoSlotItem } from '../../components/profile/PhotoSlots';
import { pickImage, uploadPhoto } from '../../services/photoService';

const WORK_TYPES = [
  'Remote Employee',
  'Freelancer',
  'Founder',
  'Student',
  'Digital Nomad',
  'Other',
];

const INTERESTS = [
  'Deep Focus',
  'Casual Chat',
  'Networking',
  'Accountability',
  'Pomodoro',
  'Coffee Breaks',
];

const PHOTO_PROMPTS = [
  'A clear photo of your face',
  'You working in your favorite spot',
  'Your workspace vibe',
  'A casual everyday photo',
  'A photo that shows your personality',
];

export default function OnboardingScreen() {
  const { user, signOut, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [workType, setWorkType] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [photosByPosition, setPhotosByPosition] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const photoItems: PhotoSlotItem[] = useMemo(
    () =>
      Object.entries(photosByPosition)
        .map(([position, photo_url]) => ({ position: Number(position), photo_url }))
        .sort((a, b) => a.position - b.position),
    [photosByPosition]
  );

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(name.trim());
    if (step === 2) return Boolean(workType);
    if (step === 4) return photoItems.length > 0;
    return true;
  }, [step, name, workType, photoItems.length]);

  const handlePhotoAdd = async (position: number) => {
    if (loading) return;
    const { uri, error } = await pickImage();

    if (error) {
      Alert.alert('Photo access required', error);
      return;
    }

    if (!uri) return;

    setPhotosByPosition((prev) => ({
      ...prev,
      [position]: uri,
    }));
  };

  const handlePhotoRemove = (position: number) => {
    setPhotosByPosition((prev) => {
      const next = { ...prev };
      delete next[position];
      return next;
    });
  };

  const handleSetPrimary = (position: number) => {
    setPhotosByPosition((prev) => {
      const next = { ...prev };
      const selected = next[position];
      if (!selected) return prev;

      const currentPrimary = next[0];
      next[0] = selected;
      if (currentPrimary) {
        next[position] = currentPrimary;
      } else {
        delete next[position];
      }
      return next;
    });
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    if (step === 2 && !workType) {
      Alert.alert('Work type required', 'Please select how you work.');
      return;
    }
    if (step === 4 && photoItems.length === 0) {
      Alert.alert('Photo required', 'Please add at least one photo to continue.');
      return;
    }

    if (step < totalSteps) {
      setStep((s) => s + 1);
      return;
    }

    void handleComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);

    const fallbackUsername = `user_${user.id.replace(/-/g, '').slice(0, 8)}`;
    const basePayload = {
      id: user.id,
      email: user.email ?? null,
      username: fallbackUsername,
      name: name.trim(),
      work_type: workType,
      interests: selectedInterests,
      onboarding_complete: false,
      updated_at: new Date().toISOString(),
    };

    const { error: baseError } = await supabase.from('profiles').upsert(basePayload, { onConflict: 'id' });

    if (baseError) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error('Base profile save error:', JSON.stringify(baseError, null, 2));
      return;
    }

    for (const photo of photoItems) {
      const { error } = await uploadPhoto(user.id, photo.photo_url, photo.position);
      if (error) {
        setLoading(false);
        Alert.alert('Photo upload failed', error);
        return;
      }
    }

    const { error: completionError } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setLoading(false);

    if (completionError) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      console.error('Onboarding completion error:', JSON.stringify(completionError, null, 2));
      return;
    }

    await refreshProfile();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What&apos;s your name?</Text>
            <Text style={styles.stepSubtitle}>This is how others will see you</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How do you work?</Text>
            <Text style={styles.stepSubtitle}>Select the option that best describes you</Text>
            <View style={styles.optionsGrid}>
              {WORK_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.optionButton, workType === type && styles.optionButtonSelected]}
                  onPress={() => setWorkType(type)}
                  disabled={loading}
                >
                  <Text style={[styles.optionText, workType === type && styles.optionTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What&apos;s your style?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            <View style={styles.optionsGrid}>
              {INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.optionButton,
                    selectedInterests.includes(interest) && styles.optionButtonSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedInterests.includes(interest) && styles.optionTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add a photo</Text>
            <Text style={styles.stepSubtitle}>Add at least 1 photo so people know who they&apos;re meeting</Text>

            <PhotoSlots
              photos={photoItems}
              totalSlots={5}
              onAddPhoto={handlePhotoAdd}
              onRemovePhoto={handlePhotoRemove}
              onSetPrimary={handleSetPrimary}
              prompts={PHOTO_PROMPTS}
              editable={!loading}
            />

            <Text style={styles.photoHint}>
              Tap an empty slot to add. Tap a filled primary slot to remove. Tap any other filled slot to set as
              primary.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.progress}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={[styles.progressDot, i + 1 <= step && styles.progressDotActive]} />
        ))}
      </View>

      {renderStep()}

      <View style={styles.buttons}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} disabled={loading}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, (!canContinue || loading) && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!canContinue || loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.surface} />
          ) : (
            <Text style={styles.nextButtonText}>{step === totalSteps ? 'Get Started' : 'Continue'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutLink} onPress={signOut} disabled={loading}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing[6],
    paddingTop: spacing[12],
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[10],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2DDD6',
  },
  progressDotActive: {
    backgroundColor: theme.primary,
    width: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing[2],
  },
  stepSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: spacing[8],
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: '#E2DDD6',
    borderRadius: borderRadius.md,
    padding: spacing[4],
    fontSize: 18,
    color: theme.text,
    minHeight: touchTarget.min,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  optionButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: '#E2DDD6',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  optionText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: theme.surface,
  },
  photoHint: {
    marginTop: spacing[4],
    fontSize: 12,
    color: theme.textMuted,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[8],
    paddingBottom: spacing[8],
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: '#E2DDD6',
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  backButtonText: {
    color: theme.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: theme.primary,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: theme.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  signOutLink: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  signOutText: {
    color: theme.error,
    fontSize: 14,
  },
});
