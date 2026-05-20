import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, theme, spacing, borderRadius, touchTarget } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import PhotoSlots, { PhotoSlotItem } from '../../components/profile/PhotoSlots';
import { deletePhoto, getPhotos, pickImage, setPrimaryPhoto, uploadPhoto } from '../../services/photoService';
import { getFullProfile, updateProfile } from '../../services/profileService';

const WORK_TYPES = [
  'Remote Employee',
  'Freelancer',
  'Founder',
  'Student',
  'Digital Nomad',
  'Other',
];

const PHOTO_PROMPTS = [
  "Hi, I'm a real person 👋",
  'Proof I touch grass sometimes',
  'What my camera roll actually looks like',
  'Currently building something...',
];

const PHOTO_SUBTITLES = [
  'Not a stock photo, promise',
  'Hobbies, activities, general humanness',
  'Candid is an understatement',
  'Still figuring it out, send help',
];

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

type FormState = {
  username: string;
  phone_number: string;
  name: string;
  tagline: string;
  currently_working_on: string;
  work: string;
  school: string;
  neighborhood: string;
  city: string;
  work_type: string;
  birthday: string;
};

const EMPTY_FORM: FormState = {
  username: '',
  phone_number: '',
  name: '',
  tagline: '',
  currently_working_on: '',
  work: '',
  school: '',
  neighborhood: '',
  city: '',
  work_type: '',
  birthday: '',
};

function toInputValue(value: string | null | undefined): string {
  return value ?? '';
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, '').toLowerCase();
}

function validateUsername(value: string): string | null {
  const normalized = normalizeUsername(value);

  if (normalized.length < 3) {
    return 'Username must be at least 3 characters.';
  }

  if (normalized.length > 24) {
    return 'Username must be 24 characters or fewer.';
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return 'Username can use only lowercase letters, numbers, and underscores.';
  }

  return null;
}

function formatDateLabel(value: string): string {
  if (!value) return 'Select birthday';
  return value;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photos, setPhotos] = useState<PhotoSlotItem[]>([]);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [profileResult, photosResult] = await Promise.all([getFullProfile(user.id), getPhotos(user.id)]);

    if (profileResult.data.profile) {
      const profile = profileResult.data.profile;
      setForm({
        username: toInputValue(profile.username),
        phone_number: toInputValue(profile.phone_number),
        name: toInputValue(profile.name),
        tagline: toInputValue(profile.tagline),
        currently_working_on: toInputValue(profile.currently_working_on),
        work: toInputValue(profile.work),
        school: toInputValue(profile.school),
        neighborhood: toInputValue(profile.neighborhood),
        city: toInputValue(profile.city),
        work_type: toInputValue(profile.work_type),
        birthday: toInputValue(profile.birthday),
      });
    } else {
      setForm(EMPTY_FORM);
    }

    if (photosResult.error) {
      Alert.alert('Photos unavailable', photosResult.error);
    }
    setPhotos(
      photosResult.data.map((photo) => ({
        position: photo.position,
        photo_url: photo.photo_url,
      }))
    );

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handlePickAndUpload = useCallback(
    async (position: number) => {
      if (!user || photoBusy) return;

      const { uri, error: pickError } = await pickImage();
      if (pickError) {
        Alert.alert('Photo access required', pickError);
        return;
      }

      if (!uri) return;

      setPhotoBusy(true);
      const result = await uploadPhoto(user.id, uri, position);
      if (result.error) {
        Alert.alert('Upload failed', result.error);
        setPhotoBusy(false);
        return;
      }

      const refreshResult = await getPhotos(user.id);
      if (refreshResult.error) {
        Alert.alert('Refresh failed', refreshResult.error);
      } else {
        setPhotos(
          refreshResult.data.map((photo) => ({
            position: photo.position,
            photo_url: photo.photo_url,
          }))
        );
      }
      setPhotoBusy(false);
    },
    [photoBusy, user]
  );

  const handleDeletePhoto = useCallback(
    async (position: number) => {
      if (!user || photoBusy) return;
      setPhotoBusy(true);

      const result = await deletePhoto(user.id, position);
      if (result.error) {
        Alert.alert('Delete failed', result.error);
      }

      const refreshResult = await getPhotos(user.id);
      if (refreshResult.error) {
        Alert.alert('Refresh failed', refreshResult.error);
      } else {
        setPhotos(
          refreshResult.data.map((photo) => ({
            position: photo.position,
            photo_url: photo.photo_url,
          }))
        );
      }

      setPhotoBusy(false);
    },
    [photoBusy, user]
  );

  const handleSetPrimary = useCallback(
    async (position: number) => {
      if (!user || photoBusy || position === 0) return;
      setPhotoBusy(true);

      const result = await setPrimaryPhoto(user.id, position);
      if (result.error) {
        Alert.alert('Set primary failed', result.error);
      } else {
        setPhotos(
          result.data.map((photo) => ({
            position: photo.position,
            photo_url: photo.photo_url,
          }))
        );
      }

      setPhotoBusy(false);
    },
    [photoBusy, user]
  );

  const openPhotoActionSheet = useCallback(
    (position: number) => {
      const options = position === 0
        ? ['Change Photo', 'Remove Photo', 'Cancel']
        : ['Change Photo', 'Remove Photo', 'Set as Primary', 'Cancel'];

      Alert.alert('Photo options', undefined, [
        { text: options[0], onPress: () => void handlePickAndUpload(position) },
        { text: options[1], style: 'destructive', onPress: () => void handleDeletePhoto(position) },
        ...(position !== 0
          ? [{ text: options[2], onPress: () => void handleSetPrimary(position) }]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [handleDeletePhoto, handlePickAndUpload, handleSetPrimary]
  );

  const onPhotoSlotAdd = useCallback(
    async (position: number) => {
      await handlePickAndUpload(position);
    },
    [handlePickAndUpload]
  );

  const onPhotoSlotRemove = useCallback(
    (position: number) => {
      openPhotoActionSheet(position);
    },
    [openPhotoActionSheet]
  );

  const onPhotoSlotSetPrimary = useCallback(
    (position: number) => {
      openPhotoActionSheet(position);
    },
    [openPhotoActionSheet]
  );

  const handleWorkTypePress = useCallback(() => {
    if (saving || photoBusy) return;
    Alert.alert('Work type', 'Select your work type', [
      ...WORK_TYPES.map((type) => ({
        text: type,
        onPress: () => setForm((prev) => ({ ...prev, work_type: type })),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, [saving, photoBusy]);

  const birthdayDate = useMemo(() => {
    if (!form.birthday) return new Date();
    const parsed = new Date(form.birthday);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [form.birthday]);

  const handleBirthdayChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBirthdayPicker(false);
    }

    if (selectedDate) {
      setForm((prev) => ({
        ...prev,
        birthday: toIsoDate(selectedDate),
      }));
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;

    const normalizedUsername = normalizeUsername(form.username);
    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      Alert.alert('Invalid username', usernameError);
      return;
    }

    setSaving(true);
    const { error } = await updateProfile(user.id, {
      username: normalizedUsername,
      phone_number: toNullable(form.phone_number),
      name: toNullable(form.name),
      tagline: toNullable(form.tagline),
      currently_working_on: toNullable(form.currently_working_on),
      work: toNullable(form.work),
      school: toNullable(form.school),
      neighborhood: toNullable(form.neighborhood),
      city: toNullable(form.city),
      work_type: toNullable(form.work_type),
      birthday: toNullable(form.birthday),
    });

    if (error) {
      setSaving(false);
      Alert.alert('Save failed', error);
      return;
    }

    await refreshProfile();
    setSaving(false);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={[styles.headerSide, styles.headerSideLeft]}
          onPress={() => navigation.goBack()}
          disabled={saving || photoBusy}
        >
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.headerSide, styles.headerSideRight]}
          onPress={handleSave}
          disabled={saving || photoBusy}
        >
          <Text style={[styles.headerButton, styles.saveButton]}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PhotoSlots
          photos={photos}
          totalSlots={4}
          onAddPhoto={onPhotoSlotAdd}
          onRemovePhoto={onPhotoSlotRemove}
          onSetPrimary={onPhotoSlotSetPrimary}
          prompts={PHOTO_PROMPTS}
          promptSubtitles={PHOTO_SUBTITLES}
          layout="stack"
          editable={!saving && !photoBusy}
        />

        {/* ── Fields: white area with flat rows ── */}
        <View style={styles.fieldsArea}>

          {/* Group 1: About you */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.username}
              onChangeText={(text) => setForm((prev) => ({ ...prev, username: normalizeUsername(text) }))}
              placeholder="@handle"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.phone_number}
              onChangeText={(text) => setForm((prev) => ({ ...prev, phone_number: text }))}
              placeholder="Phone number"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Tagline</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.tagline}
              onChangeText={(text) => setForm((prev) => ({ ...prev, tagline: text }))}
              placeholder="One-line intro"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Currently working on</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.currently_working_on}
              onChangeText={(text) => setForm((prev) => ({ ...prev, currently_working_on: text }))}
              placeholder="What are you building?"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Group break */}
          <View style={styles.groupSep} />

          {/* Group 2: Work & School */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Work</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.work}
              onChangeText={(text) => setForm((prev) => ({ ...prev, work: text }))}
              placeholder="Company"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>School</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.school}
              onChangeText={(text) => setForm((prev) => ({ ...prev, school: text }))}
              placeholder="School"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Group break */}
          <View style={styles.groupSep} />

          {/* Group 3: Location */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Neighbourhood</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.neighborhood}
              onChangeText={(text) => setForm((prev) => ({ ...prev, neighborhood: text }))}
              placeholder="Your area"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.city}
              onChangeText={(text) => setForm((prev) => ({ ...prev, city: text }))}
              placeholder="Your city"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          {/* Birthday — tappable row */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowBirthdayPicker((prev) => !prev)}
            disabled={saving || photoBusy}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Birthday</Text>
            <View style={styles.fieldRowRight}>
              <Text style={[styles.fieldValue, form.birthday ? styles.fieldValueFilled : null]}>
                {formatDateLabel(form.birthday)}
              </Text>
              <Text style={styles.rowChevron}>›</Text>
            </View>
          </TouchableOpacity>

          {showBirthdayPicker && (
            <DateTimePicker
              value={birthdayDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleBirthdayChange}
            />
          )}

          {/* Group break */}
          <View style={styles.groupSep} />

          {/* Group 4: Work type — ActionSheet row */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={handleWorkTypePress}
            disabled={saving || photoBusy}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Work type</Text>
            <View style={styles.fieldRowRight}>
              <Text style={[styles.fieldValue, form.work_type ? styles.fieldValueFilled : null]}>
                {form.work_type || 'Select type'}
              </Text>
              <Text style={styles.rowChevronDown}>▾</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: theme.surface,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  headerSide: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerSideLeft: {
    alignItems: 'flex-start',
  },
  headerSideRight: {
    alignItems: 'flex-end',
  },
  headerButton: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  saveButton: {
    textAlign: 'right',
    color: theme.primary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[12],
    gap: spacing[3],
  },
  fieldsArea: {
    backgroundColor: theme.surface,
    marginHorizontal: -spacing[4],
    paddingBottom: spacing[4],
  },
  fieldRow: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  fieldInput: {
    fontSize: 14,
    color: theme.textSecondary,
    padding: 0,
    margin: 0,
  },
  fieldRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  fieldValue: {
    fontSize: 14,
    color: colors.textTertiary,
    flex: 1,
  },
  fieldValueFilled: {
    color: theme.textSecondary,
  },
  rowChevron: {
    fontSize: 16,
    color: colors.borderDefault,
  },
  rowChevronDown: {
    fontSize: 14,
    color: colors.borderDefault,
  },
  rowSep: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginHorizontal: spacing[4],
  },
  groupSep: {
    height: 8,
    backgroundColor: colors.bgSecondary,
  },
});
