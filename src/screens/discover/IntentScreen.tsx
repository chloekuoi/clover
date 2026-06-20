import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Keyboard,
} from 'react-native';
import { colors, theme, spacing, borderRadius, shadows } from '../../constants';
import { CLOVER_FOREST, CLOVER_BG, FONT_CORMORANT_LIGHT } from '../../constants/clover';
import { upsertIntent, IntentInput, getTodayIntent, getDefaultIntentTimes } from '../../services/discoveryService';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import CloverMark from '../../components/common/CloverMark';
import LocationSearchModal, { SearchedPlace } from '../../components/discover/LocationSearchModal';

const TIME_START_MINUTES = 7 * 60;    // 07:00
const TIME_MAX_START = 23 * 60;       // 23:00 — latest allowed start
const TIME_MAX_END = 23 * 60 + 30;    // 23:30 — latest allowed end
const TIME_INTERVAL = 30;

type IntentScreenProps = {
  latitude: number;
  longitude: number;
  onIntentSet: () => void;
  onCancel?: () => void;
};

export default function IntentScreen({
  latitude,
  longitude,
  onIntentSet,
  onCancel,
}: IntentScreenProps) {
  const { user } = useAuth();
  const [taskDescription, setTaskDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [venueCoords, setVenueCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [startTime, setStartTime] = useState('09:00:00');
  const [endTime, setEndTime] = useState('17:00:00');
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
        if (existingIntent.location_name) {
          setLocationName(existingIntent.location_name);
          if (existingIntent.latitude != null && existingIntent.longitude != null) {
            setVenueCoords({ latitude: existingIntent.latitude, longitude: existingIntent.longitude });
          }
        }
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
      location_name: locationName.trim() || null,
      latitude: venueCoords?.latitude ?? latitude,
      longitude: venueCoords?.longitude ?? longitude,
    };

    const { error } = await upsertIntent(user.id, intentData);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to save your intent. Please try again.');
      return;
    }

    onIntentSet();
  };

  if (initialLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <CloverMark size={22} />
        <Text style={styles.title}>Today's focus</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>WHAT ARE YOU WORKING ON?</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Writing a blog post, Coding my app"
          placeholderTextColor={theme.textMuted}
          value={taskDescription}
          onChangeText={setTaskDescription}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>LOCATION</Text>
        <TouchableOpacity
          style={[styles.textInput, styles.locationField]}
          onPress={() => setIsLocationSearchOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.locationPin}>📍</Text>
          <Text
            style={[styles.locationText, !locationName && styles.locationPlaceholder]}
            numberOfLines={1}
          >
            {locationName || 'Search a café, library, place…'}
          </Text>
          {locationName ? (
            <TouchableOpacity
              onPress={() => {
                setLocationName('');
                setVenueCoords(null);
              }}
              hitSlop={10}
            >
              <Text style={styles.locationClear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>AVAILABLE</Text>
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

      <View style={styles.actions}>
        {onCancel ? (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
        <Button
          title="Save focus"
          onPress={handleSubmit}
          loading={loading}
          style={styles.saveButton}
        />
      </View>

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

      <LocationSearchModal
        visible={isLocationSearchOpen}
        onClose={() => setIsLocationSearchOpen(false)}
        biasLatitude={latitude}
        biasLongitude={longitude}
        hereLabel="No specific place"
        onSelectHere={() => {
          setLocationName('');
          setVenueCoords(null);
          setIsLocationSearchOpen(false);
        }}
        onSelectPlace={(loc: SearchedPlace) => {
          setLocationName(loc.name);
          setVenueCoords({ latitude: loc.latitude, longitude: loc.longitude });
          setIsLocationSearchOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadows.card,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing[3],
  },
  title: {
    flex: 1,
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 24,
    fontWeight: '300',
    color: theme.text,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  section: {
    marginBottom: spacing[3],
  },
  label: {
    fontSize: 11,
    color: theme.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: theme.text,
    minHeight: 44,
    ...shadows.card,
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPin: {
    fontSize: 15,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  locationPlaceholder: {
    color: theme.textMuted,
  },
  locationClear: {
    fontSize: 15,
    color: theme.textMuted,
    paddingHorizontal: 4,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing[3],
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
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  timePickerText: {
    fontSize: 15,
    color: theme.text,
  },
  durationBadge: {
    backgroundColor: CLOVER_BG,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: CLOVER_FOREST,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textMuted,
  },
  // TimePickerModal
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
