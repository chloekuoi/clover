import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { colors, theme, spacing, borderRadius, shadows } from '../../constants';
import { CLOVER_FOREST, CLOVER_BG } from '../../constants/clover';
import { WorkStyle, LocationType } from '../../types';
import { upsertIntent, IntentInput, getTodayIntent, getDefaultIntentTimes } from '../../services/discoveryService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import CloverMark from '../../components/common/CloverMark';

const WORK_STYLES: { value: WorkStyle; label: string }[] = [
  { value: 'Deep focus', label: 'Deep focus' },
  { value: 'Chat mode', label: 'Chat mode' },
  { value: 'Flexible', label: 'Flexible' },
];
const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'Cafe', label: 'Cafe' },
  { value: 'Library', label: 'Library' },
  { value: 'Anywhere', label: 'Anywhere' },
];

const TIME_START_MINUTES = 7 * 60;    // 07:00
const TIME_MAX_START = 23 * 60;       // 23:00 — latest allowed start
const TIME_MAX_END = 23 * 60 + 30;    // 23:30 — latest allowed end (so 23:00 start always has a valid end)
const TIME_INTERVAL = 30;

type IntentScreenProps = {
  latitude: number;
  longitude: number;
  onIntentSet: () => void;
  locationLoading?: boolean;
  locationError?: string | null;
  onRequestLocation?: () => void;
  isBottomSheet?: boolean;
};

export default function IntentScreen({
  latitude,
  longitude,
  onIntentSet,
  locationLoading = false,
  locationError = null,
  onRequestLocation,
  isBottomSheet = false,
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

  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const startTimeOptions = getTimeOptions(TIME_MAX_START);
  const allEndOptions = getTimeOptions(TIME_MAX_END);
  const endTimeOptions = allEndOptions.filter(option => option.value > startTime);
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
        const { defaultStart, defaultEnd } = getDefaultIntentTimes();
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

  const Wrapper = isBottomSheet ? View : SafeAreaView;

  if (locationLoading || initialLoading) {
    return (
      <Wrapper style={styles.container} {...(!isBottomSheet && { edges: ['top'] as const })}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Wrapper>
    );
  }

  if (locationError) {
    return (
      <Wrapper style={styles.container} {...(!isBottomSheet && { edges: ['top'] as const })}>
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
      </Wrapper>
    );
  }

  return (
    <Wrapper style={styles.container} {...(!isBottomSheet && { edges: ['top'] as const })}>
      <KeyboardAvoidingView
        behavior={isBottomSheet ? 'padding' : (Platform.OS === 'ios' ? 'padding' : 'height')}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleRow}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <CloverMark size={22} />
            </Animated.View>
            <Text style={styles.title}>what are we cooking today?</Text>
          </View>

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
              <TouchableOpacity
                style={styles.timePicker}
                onPress={() => setIsStartPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.timePickerText}>{formatDisplayTime(startTime)}</Text>
              </TouchableOpacity>
              <Text style={styles.timeSeparator}>→</Text>
              <TouchableOpacity
                style={styles.timePicker}
                onPress={() => setIsEndPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.timePickerText}>
                  {endTimeOptions.length > 0 ? formatDisplayTime(endTime) : '--'}
                </Text>
              </TouchableOpacity>
              {durationLabel !== '--' && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationBadgeText}>{durationLabel}</Text>
                </View>
              )}
            </View>
          </View>

          <Button
            title="Save focus"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <TimePickerModal
        visible={isStartPickerOpen}
        title="Select start time"
        options={startTimeOptions}
        selectedValue={startTime}
        onClose={() => setIsStartPickerOpen(false)}
        onSelect={(value) => {
          setIsStartPickerOpen(false);
          setStartTime(value);
          const nextValidEnd = getNextValidEndTime(value, endTime, allEndOptions);
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
    </Wrapper>
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
    padding: spacing[4],
    paddingBottom: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing[3],
  },
  star: {
    fontSize: 22,
    color: colors.accentSecondaryDark,
    lineHeight: 28,
  },
  title: {
    flex: 1,
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 28,
    fontWeight: '300',
    color: theme.text,
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  section: {
    marginBottom: spacing[4],
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
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    fontWeight: '400',
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  textInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    fontSize: 16,
    color: theme.text,
    minHeight: 50,
    ...shadows.card,
  },
  singleLineInput: {
    minHeight: 48,
  },
  optionsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: spacing[4],
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: spacing[1],
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    backgroundColor: CLOVER_FOREST,
    borderColor: CLOVER_FOREST,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing[3],
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
    alignItems: 'center',
  },
  timeSeparator: {
    fontSize: 14,
    color: theme.textMuted,
    alignSelf: 'center',
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
    backgroundColor: CLOVER_BG,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: CLOVER_FOREST,
  },
  button: {
    marginTop: spacing[2],
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

function getTimeOptions(maxMinutes: number): TimeOption[] {
  const options: TimeOption[] = [];
  for (let minutes = TIME_START_MINUTES; minutes <= maxMinutes; minutes += TIME_INTERVAL) {
    const value = formatValueTime(minutes);
    options.push({
      value,
      label: formatDisplayTime(value),
    });
  }
  return options;
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
