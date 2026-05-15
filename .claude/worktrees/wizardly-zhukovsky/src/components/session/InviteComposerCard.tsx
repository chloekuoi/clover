import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, shadows } from '../../constants';

type DateOption = {
  label: string;
  value: string;
};

type InviteComposerCardProps = {
  options: DateOption[];
  selectedDate: string;
  onSelectDate: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
};

export default function InviteComposerCard({
  options,
  selectedDate,
  onSelectDate,
  onSend,
  onCancel,
}: InviteComposerCardProps) {
  const dateOptions = useMemo(() => {
    const rows: { value: string; dayLabel: string; dateLabel: string }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const value = date.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' });
      const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      rows.push({ value, dayLabel, dateLabel });
    }
    return rows;
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pick a day</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {dateOptions.map((option) => {
          const selected = option.value === selectedDate;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelectDate(option.value)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillDay, selected && styles.pillDaySelected]}>
                {option.dayLabel}
              </Text>
              <Text style={[styles.pillDate, selected && styles.pillDateSelected]}>
                {option.dateLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onSend} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    maxWidth: 360,
    width: '88%',
    alignSelf: 'center',
    ...shadows.card,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pillsRow: {
    marginTop: spacing[3],
    paddingRight: spacing[2],
  },
  pill: {
    width: 54,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pillSelected: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  pillDay: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  pillDaySelected: {
    color: colors.textInverse,
  },
  pillDate: {
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 2,
  },
  pillDateSelected: {
    color: colors.textInverse,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing[4],
    alignItems: 'center',
  },
  sendButton: {
    flex: 1,
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.button,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    marginLeft: spacing[4],
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  cancelButtonText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
});
