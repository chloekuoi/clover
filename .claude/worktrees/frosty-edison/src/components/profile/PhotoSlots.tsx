import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, theme, borderRadius } from '../../constants';

export type PhotoSlotItem = {
  position: number;
  photo_url: string;
};

type PhotoSlotsProps = {
  photos: PhotoSlotItem[];
  totalSlots?: number;
  onAddPhoto: (position: number) => void;
  onRemovePhoto?: (position: number) => void;
  onSetPrimary?: (position: number) => void;
  prompts?: string[];
  promptSubtitles?: string[];
  layout?: 'grid' | 'stack';
  editable?: boolean;
};

function promptFor(prompts: string[] | undefined, position: number): string {
  if (prompts && prompts[position]) return prompts[position];
  return position === 0 ? 'Add your primary photo' : `Add photo ${position + 1}`;
}

export default function PhotoSlots({
  photos,
  totalSlots = 5,
  onAddPhoto,
  onRemovePhoto,
  onSetPrimary,
  prompts,
  promptSubtitles,
  layout = 'grid',
  editable = true,
}: PhotoSlotsProps) {
  const clampedSlots = Math.max(1, Math.min(totalSlots, 5));

  const photosByPosition = new Map<number, PhotoSlotItem>();
  for (const photo of photos) {
    photosByPosition.set(photo.position, photo);
  }

  const renderSlot = (position: number, large: boolean) => {
    const photo = photosByPosition.get(position);
    const slotPrompt = promptFor(prompts, position);

    const handlePress = () => {
      if (!editable) return;
      if (photo) {
        if (position !== 0 && onSetPrimary) {
          onSetPrimary(position);
          return;
        }
        if (onRemovePhoto) {
          onRemovePhoto(position);
          return;
        }
      }
      onAddPhoto(position);
    };

    return (
      <TouchableOpacity
        key={position}
        style={[styles.slotBase, large ? styles.primarySlot : styles.smallSlot]}
        onPress={handlePress}
        disabled={!editable}
        activeOpacity={0.85}
      >
        {photo ? (
          <Image source={{ uri: photo.photo_url }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.plus}>+</Text>
            <Text style={styles.prompt} numberOfLines={2}>
              {slotPrompt}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderStackSlot = (position: number) => {
    const photo = photosByPosition.get(position);
    const slotPrompt = promptFor(prompts, position);
    const subtitle = promptSubtitles?.[position];
    const isPrimary = position === 0;

    const handlePress = () => {
      if (!editable) return;
      if (photo) {
        if (position !== 0 && onSetPrimary) { onSetPrimary(position); return; }
        if (onRemovePhoto) { onRemovePhoto(position); return; }
      }
      onAddPhoto(position);
    };

    return (
      <TouchableOpacity
        key={position}
        style={[styles.stackSlot, isPrimary ? styles.stackPrimary : styles.stackSecondary]}
        onPress={handlePress}
        disabled={!editable}
        activeOpacity={0.85}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo.photo_url }} style={styles.photo} contentFit="cover" />
            {isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Primary ✓</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>Edit</Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyStackSlot}>
            <Text style={styles.stackPrompt}>{slotPrompt}</Text>
            {!!subtitle && <Text style={styles.stackSubtitle}>{subtitle}</Text>}
            <View style={styles.stackAddBtn}>
              <Text style={styles.stackAddBtnText}>+</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const secondaryPositions = Array.from({ length: Math.max(0, clampedSlots - 1) }, (_, i) => i + 1);

  // Stack layout: full-width vertical cards
  if (layout === 'stack') {
    const allPositions = Array.from({ length: clampedSlots }, (_, i) => i);
    return (
      <View style={styles.stackContainer}>
        {allPositions.map((position) => renderStackSlot(position))}
      </View>
    );
  }

  // Grid layout (original)
  return (
    <View style={styles.container}>
      {renderSlot(0, true)}
      <View style={styles.secondaryGrid}>
        {secondaryPositions.map((position) => renderSlot(position, false))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  primarySlot: {
    flex: 1,
    aspectRatio: 0.8,
  },
  secondaryGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    alignContent: 'flex-start',
  },
  smallSlot: {
    width: '47%',
    aspectRatio: 1,
  },
  slotBase: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptySlot: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    backgroundColor: colors.bgCard,
  },
  plus: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: spacing[1],
  },
  prompt: {
    fontSize: 11,
    textAlign: 'center',
    color: theme.textSecondary,
  },
  // ── Stack layout ──
  stackContainer: {
    gap: spacing[3],
  },
  stackSlot: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  stackPrimary: {
    aspectRatio: 1.1,
  },
  stackSecondary: {
    aspectRatio: 1.72,
  },
  emptyStackSlot: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[2],
    backgroundColor: colors.bgCard,
  },
  stackPrompt: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stackSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
  stackAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  stackAddBtnText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '300',
    color: theme.primary,
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBadge: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
});
