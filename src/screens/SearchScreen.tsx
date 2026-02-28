// src/screens/SearchScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { searchSongs, getBestImageUrl, getSongArtists } from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { Song } from '../types';
import { COLORS, SPACING, RADIUS, FONTS } from '../themes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FILTER_TABS = ['Songs', 'Artists', 'Albums', 'Folders'];
const RECENT_KEY = 'recent_searches';

export const SearchScreen = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Songs');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);
  const { playSong } = usePlayerStore();

  // Load recent searches from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((val) => {
      if (val) setRecentSearches(JSON.parse(val));
    });
    // Auto-focus the search input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const saveRecent = async (text: string) => {
    const updated = [text, ...recentSearches.filter((r) => r !== text)].slice(0, 10);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const removeRecent = async (text: string) => {
    const updated = recentSearches.filter((r) => r !== text);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  const doSearch = async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setHasSearched(false);
      setNotFound(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setNotFound(false);
    try {
      const result = await searchSongs(text, 1, 20);
      const songs = result?.results || [];
      setResults(songs);
      setNotFound(songs.length === 0);
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Debounce — wait 400ms after user stops typing before searching
  const handleChangeText = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) {
      setResults([]);
      setHasSearched(false);
      setNotFound(false);
      return;
    }
    searchTimeout.current = setTimeout(() => doSearch(text), 400);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      saveRecent(query.trim());
      doSearch(query);
    }
  };

  const handleRecentTap = (text: string) => {
    setQuery(text);
    saveRecent(text);
    doSearch(text);
  };

  const handlePlay = (song: Song) => playSong(song, results);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Search bar */}
      <View style={styles.searchBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View
          style={[
            styles.inputWrap,
            hasSearched && styles.inputWrapActive,
          ]}
        >
          <Text style={styles.searchMagnifier}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search songs, artists..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
                setNotFound(false);
              }}
            >
              <Text style={styles.clearX}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent searches — shown before any search */}
      {!hasSearched && !loading && (
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearAllRecent}>
                <Text style={styles.clearAll}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentSearches.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.recentRow}
              onPress={() => handleRecentTap(item)}
            >
              <Text style={styles.recentText}>{item}</Text>
              <TouchableOpacity
                onPress={() => removeRecent(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.recentX}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {recentSearches.length === 0 && (
            <Text style={styles.noRecent}>No recent searches</Text>
          )}
        </View>
      )}

      {loading && (
        <ActivityIndicator
          color={COLORS.primary}
          size="large"
          style={{ marginTop: 60 }}
        />
      )}

      {/* Filter pills + results — shown after search */}
      {hasSearched && !loading && (
        <>
          <View style={styles.filterRow}>
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterPill,
                  activeFilter === tab && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === tab && styles.filterTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Not found state */}
          {notFound ? (
            <View style={styles.notFound}>
              <Text style={styles.notFoundEmoji}>😞</Text>
              <Text style={styles.notFoundTitle}>Not Found</Text>
              <Text style={styles.notFoundSub}>
                Sorry, the keyword you entered cannot be found.
                Please check again or try another keyword.
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultRow}
                  onPress={() => handlePlay(item)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: getBestImageUrl(item, '150x150') }}
                    style={styles.resultThumb}
                  />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.resultArtist} numberOfLines={1}>
                      {getSongArtists(item)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.resultPlayCircle}
                    onPress={() => handlePlay(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.resultPlayIcon}>▶</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 4 }}
                  >
                    <Text style={styles.menuDots}>⋮</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: COLORS.textPrimary },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapActive: { borderColor: COLORS.primary, backgroundColor: '#FFF8F5' },
  searchMagnifier: { fontSize: 16, color: COLORS.primary },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 10,
  },
  clearX: { fontSize: 14, color: COLORS.textSecondary, padding: 4 },
  recentContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  clearAll: {
    fontSize: 14,
    fontWeight: FONTS.semiBold,
    color: COLORS.primary,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  recentText: { fontSize: 15, color: COLORS.textPrimary },
  recentX: { fontSize: 14, color: COLORS.textSecondary },
  noRecent: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  filterPillActive: { backgroundColor: COLORS.primary },
  filterText: {
    fontSize: 13,
    fontWeight: FONTS.semiBold,
    color: COLORS.primary,
  },
  filterTextActive: { color: COLORS.white },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  notFoundEmoji: { fontSize: 64 },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  notFoundSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  resultThumb: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  resultInfo: { flex: 1, gap: 3 },
  resultName: {
    fontSize: 15,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  resultArtist: { fontSize: 13, color: COLORS.textSecondary },
  resultPlayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPlayIcon: { color: COLORS.white, fontSize: 13, marginLeft: 2 },
  menuDots: { fontSize: 20, color: COLORS.textSecondary },
});