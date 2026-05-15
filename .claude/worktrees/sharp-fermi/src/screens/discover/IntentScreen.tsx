import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, theme, spacing, borderRadius } from '../../constants';
import { WorkStyle, LocationType } from '../../types';
import { upsertIntent, IntentInput, getTodayIntent } from '../../services/discoveryService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const WORK_STYLES: { value: WorkStyle; emoji: string; label: string }[] = [
  { value: 'Deep focus', emoji: '🎧', label: 'Deep focus' },
  { value: 'Chat mode', emoji: '💬', label: 'Chat mode' },
  { value: 'Flexible', emoji: '✌️', label: 'Flexible' },
];
const LOCATION_TYPES: { value: LocationType; emoji: string; label: string }[] = [
  { value: 'Cafe', emoji: '☕️', label: 'Cafe' },
  { value: 'Library', emoji: '📚', label: 'Library' },
  { value: 'Anywhere', emoji: '📍', label: 'Anywhere' },
];

const TIME_START_MINUTES = 7 * 60; // 07:00
const TIME_END_MINUTES = 23 * 60; // 23:00
const TIME_INTERVAL = 30;
const DEFAULT_SESSION_MINUTES = 120;

type IntentScreenProps = {
  latitude: number;
  longitude: number;
  onIntentSet: () => void;
  locationLoading?: boolean;
  locationError?: string | null;
  onRequestLocation?: () => void;
};

export default function IntentScreen({
  latitude,
  longitude,
  onIntentSet,
  locationLoading = false,
  locationError = null,
  onRequestLocation,
}: IntentScreenProps) {
  const { user } = useAuth();
  const [taskDescription, setTaskDescription] = useState('');
  const [workStyle, setWorkStyle] = useState<WorkStyle>('Flexible');
  const [locationType, setLocationType] = useState<LocationType>('Anywhere');
  const [locationName, setLocationName] = useState('');
  const [startTime, setStartTime] = useState('09:00:00');
  const [endTime, setEndTime] = useState('17:00:00');
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const timeOptions = getTimeOptions();
  const endTimeOptions = timeOptions.filter(option => option.value > startTime);
  const durationLabel = getDurationLabel(startTime, endTime);

  useEffect(() => {
    let isMounted = true;

    const loadIntent = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }

      const existingIntent = await getTodayIntent(user.id);
      if (existingIntent && isMounted) {
        setTaskDescription(existingIntent.task_description || '');
        const rawWorkStyle = existingIntent.work_style as string;
        const normalizedWorkStyle: WorkStyle =
          rawWorkStyle === 'Pomodoro fan'
            ? 'Flexible'
            : rawWorkStyle === 'Happy to chat'
              ? 'Chat mode'
              : rawWorkStyle === 'Deep focus' || rawWorkStyle === 'Chat mode' || rawWorkStyle === 'Flexible'
                ? rawWorkStyle
                : 'Flexible';
        setWorkStyle(normalizedWorkStyle);
        
        const rawLocationType = existingIntent.location_type as string;
        const normalizedLocation: LocationType =
          rawLocationType === 'Video Call' || rawLocationType === 'Anywhere/Other'
            ? 'Anywhere'
            : rawLocationType === 'Cafe' || rawLocationType === 'Library' || rawLocationType === 'Anywhere'
              ? rawLocationType
              : 'Anywhere';
        setLocationType(normalizedLocation);
        setLocationName(existingIntent.location_name || '');
        setStartTime(existingIntent.available_from);
        setEndTime(existingIntent.available_until);
      } else if (isMounted) {
        const { defaultStart, defaultEnd } = getDefaultTimes();
        setStartTime(defaultStart);
        setEndTime(defaultEnd);
      }

      if (isMounted) {
        setInitialLoading(false);
      }
    };

    loadIntent();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSubmit = async () => {
    if (!taskDescription.trim()) {
      Alert.alert('Missing info', 'Please describe what you\'ll be working on');
      return;
    }

    if (endTime <= startTime) {
      Alert.alert('Invalid time', 'End time must be after start time');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);

    const intentData: IntentInput = {
      task_description: taskDescription.trim(),
      available_from: startTime,
      available_until: endTime,
      work_style: workStyle,
      location_type: locationType,
      location_name:
        locationType === 'Cafe' || locationType === 'Library' ? locationName.trim() || null : null,
      latitude,
      longitude,
    };

    const { error } = await upsertIntent(user.id, intentData);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to save your intent. Please try again.');
      return;
    }

    onIntentSet();
  };

  if (locationLoading || initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (locationError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorTitle}>Location Required</Text>
          <Text style={styles.errorText}>
            CoWork Connect needs your location to find co-workers nearby.
          </Text>
          <Button
            title="Enable Location"
            onPress={onRequestLocation || (() => {})}
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Set availability to connect</Text>
          <Text style={styles.title}>Today's focus</Text>

          <View style={styles.section}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Writing a blog post, Coding my app"
              placeholderTextColor={theme.textMuted}
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.optionsCard}>
            <View style={styles.section}>
              <Text style={styles.label}>Work vibe</Text>
              <View style={styles.chipRow}>
                {WORK_STYLES.map((style, index) => {
                  const selected = workStyle === style.value;
                  const isLast = index === WORK_STYLES.length - 1;
                  return (
                    <TouchableOpacity
                      key={style.value}
                      onPress={() => setWorkStyle(style.value)}
                      style={[
                        styles.chip,
                        selected && styles.chipSelected,
                        !isLast && styles.chipSpacer,
                      ]}
                    >
                      <Text style={[styles.chipEmoji, selected && styles.chipTextSelected]}>
                        {style.emoji}
                      </Text>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {style.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.label}>Where</Text>
              <View style={styles.chipRow}>
                {LOCATION_TYPES.map((type, index) => {
                  const selected = locationType === type.value;
                  const isLast = index === LOCATION_TYPES.length - 1;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setLocationType(type.value)}
                      style={[
                        styles.chip,
                        selected && styles.chipSelected,
                        !isLast && styles.chipSpacer,
                      ]}
                    >
                      <Text style={[styles.chipEmoji, selected && styles.chipTextSelected]}>
                        {type.emoji}
                      </Text>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {(locationType === 'Cafe' || locationType === 'Library') && (
            <View style={styles.section}>
              <Text style={styles.label}>Specific place (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.singleLineInput]}
                placeholder="e.g., Blue Bottle Coffee, Downtown Library"
                placeholderTextColor={theme.textMuted}
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Available</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Start</Text>
                <TouchableOpacity
                  style={styles.timePicker}
                  onPress={() => setIsStartPickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timePickerText}>{formatDisplayTime(startTime)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>End</Text>
                <TouchableOpacity
                  style={styles.timePicker}
                  onPress={() => setIsEndPickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timePickerText}>
                    {endTimeOptions.length > 0 ? formatDisplayTime(endTime) : '--'}
                  </Text>
                </TouchableOpacity>
              </View>
              {durationLabel !== '--' && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationBadgeText}>{durationLabel}</Text>
                </View>
              )}
            </View>
          </View>

          <Button
            title="Find Co-Workers"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <TimePickerModal
        visible={isStartPickerOpen}
        title="Select start time"
        options={timeOptions}
        selectedValue={startTime}
        onClose={() => setIsStartPickerOpen(false)}
        onSelect={(value) => {
          setIsStartPickerOpen(false);
          setStartTime(value);
          const nextValidEnd = getNextValidEndTime(value, endTime, timeOptions);
          setEndTime(nextValidEnd);
        }}
      />

      <TimePickerModal
        visible={isEndPickerOpen}
        title="Select end time"
        options={endTimeOptions}
        selectedValue={endTime}
        onClose={() => setIsEndPickerOpen(false)}
        onSelect={(value) => {
          setIsEndPickerOpen(false);
          setEndTime(value);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing[5],
    paddingBottom: spacing[10],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: spacing[6],
  },
  section: {
    marginBottom: spacing[5],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: 16,
    color: theme.textSecondary,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing[2],
  },
  textInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    fontSize: 16,
    color: theme.text,
    minHeight: 50,
  },
  singleLineInput: {
    minHeight: 48,
  },
  optionsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: 20,
    marginBottom: spacing[5],
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: spacing[2],
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSpacer: {
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chipEmoji: {
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing[4],
  },
  availabilityText: {
    fontSize: 16,
    color: theme.textSecondary,
    backgroundColor: theme.surface,
    padding: spacing[4],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing[4],
    alignItems: 'flex-end',
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: spacing[2],
  },
  timePicker: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  timePickerText: {
    fontSize: 16,
    color: theme.text,
  },
  durationBadge: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accentPrimaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: spacing[3],
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.accentPrimary,
  },
  button: {
    marginTop: spacing[4],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  modalHeader: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  modalItem: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  modalItemText: {
    fontSize: 16,
    color: theme.text,
  },
  modalItemSelected: {
    backgroundColor: colors.accentPrimaryLight,
  },
  modalItemTextSelected: {
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  modalClose: {
    marginTop: spacing[4],
    alignSelf: 'center',
  },
});

type TimeOption = {
  label: string;
  value: string; // HH:MM:SS
};

function getTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  for (let minutes = TIME_START_MINUTES; minutes <= TIME_END_MINUTES; minutes += TIME_INTERVAL) {
    const value = formatValueTime(minutes);
    options.push({
      value,
      label: formatDisplayTime(value),
    });
  }
  return options;
}

function getDefaultTimes(): { defaultStart: string; defaultEnd: string } {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(currentMinutes / TIME_INTERVAL) * TIME_INTERVAL;
  const clampedStart = clampMinutes(rounded, TIME_START_MINUTES, TIME_END_MINUTES);
  const defaultStart = formatValueTime(clampedStart);
  const defaultEndMinutes = clampMinutes(clampedStart + DEFAULT_SESSION_MINUTES, TIME_START_MINUTES, TIME_END_MINUTES);
  const defaultEnd = formatValueTime(defaultEndMinutes);

  if (defaultEnd <= defaultStart) {
    return { defaultStart, defaultEnd: formatValueTime(TIME_END_MINUTES) };
  }

  return { defaultStart, defaultEnd };
}

function getNextValidEndTime(
  newStart: string,
  currentEnd: string,
  allOptions: TimeOption[]
): string {
  const validOptions = allOptions.filter(option => option.value > newStart);
  if (validOptions.length === 0) {
    return newStart;
  }
  const currentEndStillValid = validOptions.some(option => option.value === currentEnd);
  return currentEndStillValid ? currentEnd : validOptions[0].value;
}

function clampMinutes(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatValueTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
}

function formatDisplayTime(value: string): string {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function getDurationLabel(startValue: string, endValue: string): string {
  if (!startValue || !endValue || endValue <= startValue) return '--';
  const [startH, startM] = startValue.split(':').map(Number);
  const [endH, endM] = endValue.split(':').map(Number);
  if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) {
    return '--';
  }
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const totalMinutes = Math.max(endMinutes - startMinutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
}

type TimePickerModalProps = {
  visible: boolean;
  title: string;
  options: TimeOption[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

function TimePickerModal({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
}: TimePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => onSelect(item.value)}
                >
                  <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
          <Button title="Close" variant="secondary" onPress={onClose} style={styles.modalClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
