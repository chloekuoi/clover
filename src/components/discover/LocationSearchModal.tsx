import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants';
import {
  CLOVER_FOREST,
  CLOVER_VIOLET,
  FONT_DM_SANS_LIGHT,
  FONT_DM_SANS_MEDIUM,
} from '../../constants/clover';

export const GOOGLE_PLACES_KEY: string | undefined =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.googlePlacesApiKey;

export type SearchedPlace = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type PlacePrediction = { place_id: string; description: string };

export default function LocationSearchModal({
  visible,
  onClose,
  onSelectHere,
  onSelectPlace,
  hereLabel = 'Here (current location)',
  biasLatitude,
  biasLongitude,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectHere: () => void;
  onSelectPlace: (loc: SearchedPlace) => void;
  hereLabel?: string;
  biasLatitude?: number | null;
  biasLongitude?: number | null;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setPredictions([]);
    }
  }, [visible]);

  const search = useCallback((text: string) => {
    if (!GOOGLE_PLACES_KEY || text.trim().length < 3) {
      setPredictions([]);
      return;
    }
    let url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_KEY}`;
    // Bias results toward the user's current location so nearby places rank first
    // instead of far-away namesakes. `radius` is a soft bias (in metres), not a hard limit.
    if (typeof biasLatitude === 'number' && typeof biasLongitude === 'number') {
      url += `&location=${biasLatitude},${biasLongitude}&radius=30000`;
    }
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (json.predictions) {
          setPredictions(
            json.predictions.map((p: any) => ({ place_id: p.place_id, description: p.description }))
          );
        }
      })
      .catch((e) => console.error('Places autocomplete error:', e));
  }, [biasLatitude, biasLongitude]);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 300);
  };

  const selectPrediction = async (p: PlacePrediction) => {
    if (!GOOGLE_PLACES_KEY) return;
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_address,geometry&key=${GOOGLE_PLACES_KEY}`;
    try {
      const json = await (await fetch(url)).json();
      const loc = json.result?.geometry?.location;
      if (loc) {
        onSelectPlace({
          name: json.result.name || p.description,
          address: json.result.formatted_address || '',
          latitude: loc.lat,
          longitude: loc.lng,
        });
      }
    } catch (e) {
      console.error('Places details error:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.searchContainer} edges={['top']}>
        <View style={styles.searchHeader}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search a café or address…"
            placeholderTextColor="rgba(30,61,40,0.4)"
            value={query}
            onChangeText={onChangeText}
            autoFocus
            editable={!!GOOGLE_PLACES_KEY}
          />
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.searchCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchRow} onPress={onSelectHere} activeOpacity={0.7}>
          <Text style={styles.searchRowIcon}>◎</Text>
          <Text style={styles.searchRowText}>{hereLabel}</Text>
        </TouchableOpacity>

        {!GOOGLE_PLACES_KEY ? (
          <Text style={styles.searchUnavailable}>
            Location search unavailable. Add a Google Places API key to search venues.
          </Text>
        ) : (
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchRow}
                onPress={() => selectPrediction(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.searchRowIcon}>○</Text>
                <Text style={styles.searchRowText} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 15,
    color: CLOVER_FOREST,
  },
  searchCancel: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 14,
    color: CLOVER_VIOLET,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(30,61,40,0.08)',
  },
  searchRowIcon: {
    fontSize: 16,
    color: CLOVER_FOREST,
  },
  searchRowText: {
    flex: 1,
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 15,
    color: CLOVER_FOREST,
  },
  searchUnavailable: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    lineHeight: 19,
  },
});
