

// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, FlatList,
    TouchableOpacity, Image, StatusBar,
    ActivityIndicator, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    searchSongs, getBestImageUrl,
    getSongArtists, getSongDuration,
} from '../services/api';
import { usePlayerStore } from '../store/playerStore';
import { Song, RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS, FONTS } from '../themes';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

// ── Category config 
const CATEGORIES = ['Suggested', 'Songs', 'Artists', 'Albums'];
const QUERIES: Record<string, string> = {
    Suggested: 'trending hindi 2024',
    Songs: 'top songs 2024',
    Artists: 'arijit singh',
    Albums: 'bollywood albums 2024',
};

// ── Format seconds to m:ss 
const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;


// SUB-COMPONENTS
// Each one is a small focused piece of UI
// Breaking them out keeps the main component readable

// Orange circular play button used throughout the app
const PlayBtn = ({
    onPress,
    size = 36,
}: {
    onPress: () => void;
    size?: number;
}) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.playCircle,
            { width: size, height: size, borderRadius: size / 2 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
        <Text style={{ color: COLORS.white, fontSize: size * 0.38, marginLeft: 2 }}>
            ▶
        </Text>
    </TouchableOpacity>
);

// Row used in Songs tab: thumbnail + name + artist/duration + play + menu
const SongRow = React.memo(({
    song,
    onPress,
    onMenu,
}: {
    song: Song;
    onPress: () => void;
    onMenu: () => void;
}) => {
    const currentSong = usePlayerStore((s) => s.currentSong);
    const isPlaying = usePlayerStore((s) => s.isPlaying);
    const active = currentSong?.id === song.id;
    const dur = fmt(getSongDuration(song));

    return (
        <TouchableOpacity
            style={styles.songRow}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: getBestImageUrl(song, '150x150') }}
                style={styles.songThumb}
            />
            <View style={styles.songInfo}>
                <Text
                    style={[styles.songName, active && { color: COLORS.primary }]}
                    numberOfLines={1}
                >
                    {song.name}
                </Text>
                <Text style={styles.songMeta} numberOfLines={1}>
                    {getSongArtists(song)}  ·  {dur} mins
                </Text>
            </View>
            {active && isPlaying ? (
                <View
                    style={[styles.playCircle, { width: 36, height: 36, borderRadius: 18 }]}
                >
                    <Text style={{ color: COLORS.white, fontSize: 13 }}>II</Text>
                </View>
            ) : (
                <PlayBtn onPress={onPress} />
            )}
            <TouchableOpacity
                onPress={onMenu}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ padding: 4 }}
            >
                <Text style={styles.menuDots}>⋮</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

// Row used in Artists tab: circle image + name + album/song count + menu
const ArtistRow = React.memo(({
    song,
    onPress,
    onMenu,
}: {
    song: Song;
    onPress: () => void;
    onMenu: () => void;
}) => {
    const artistName = getSongArtists(song).split(',')[0].trim();
    return (
        <TouchableOpacity
            style={styles.artistRow}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: getBestImageUrl(song, '150x150') }}
                style={styles.artistCircle}
            />
            <View style={styles.artistInfo}>
                <Text style={styles.artistName} numberOfLines={1}>
                    {artistName}
                </Text>
                <Text style={styles.artistMeta}>1 Album  |  1 Song</Text>
            </View>
            <TouchableOpacity
                onPress={onMenu}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ padding: 4 }}
            >
                <Text style={styles.menuDots}>⋮</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

// Card used in Albums tab and Suggested grid
const AlbumCard = React.memo(({
    song,
    onPress,
    onMenu,
}: {
    song: Song;
    onPress: () => void;
    onMenu: () => void;
}) => {
    const albumName = song.album?.name || song.name;
    const artist = getSongArtists(song).split(',')[0].trim();
    return (
        <View style={styles.albumCard}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                <Image
                    source={{ uri: getBestImageUrl(song, '500x500') }}
                    style={styles.albumImage}
                />
            </TouchableOpacity>
            <View style={styles.albumInfo}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.albumName} numberOfLines={1}>
                        {albumName}
                    </Text>
                    <Text style={styles.albumMeta} numberOfLines={1}>
                        {artist}  ·  {song.year || '2024'}
                    </Text>
                    <Text style={styles.albumSongs}>1 song</Text>
                </View>
                <TouchableOpacity
                    onPress={onMenu}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.menuDots}>⋮</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

// Section header with title and "See All" used in Suggested tab
const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
    </View>
);

// Suggested tab — combines horizontal Recently Played,
// horizontal Artists, and a 2-col Most Played grid
const SuggestedView = ({
    songs,
    onPlay,
}: {
    songs: Song[];
    onPlay: (s: Song) => void;
}) => {
    const recent = songs.slice(0, 6);
    const artists = songs.slice(6, 12);
    const mostPlayed = songs.slice(12, 20);

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
        >
            <SectionHeader title="Recently Played" />
            <FlatList
                horizontal
                data={recent}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.recentCard}
                        onPress={() => onPlay(item)}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: getBestImageUrl(item, '150x150') }}
                            style={styles.recentImg}
                        />
                        <Text style={styles.recentName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.recentArtist} numberOfLines={1}>
                            {getSongArtists(item)}
                        </Text>
                    </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: SPACING.lg,
                    gap: SPACING.md,
                }}
            />
            <SectionHeader title="Artists" />
            <FlatList
                horizontal
                data={artists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.artistCardH}
                        onPress={() => onPlay(item)}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={{ uri: getBestImageUrl(item, '150x150') }}
                            style={styles.artistCardImg}
                        />
                        <Text style={styles.artistCardName} numberOfLines={1}>
                            {getSongArtists(item).split(',')[0].trim()}
                        </Text>
                    </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: SPACING.lg,
                    gap: SPACING.md,
                }}
            />
            <SectionHeader title="Most Played" />
            <View style={styles.gridContainer}>
                {mostPlayed.map((song) => (
                    <AlbumCard
                        key={song.id}
                        song={song}
                        onPress={() => onPlay(song)}
                        onMenu={() => { }}
                    />
                ))}
            </View>
        </ScrollView>
    );
};


// Magnifying glass icon — two Views: bordered circle (lens) + rotated rect (handle)
const SearchIcon = () => (
    <View style={{ width: 20, height: 20 }}>
        <View style={{
            position: 'absolute', top: 0, left: 0,
            width: 13, height: 13,
            borderRadius: 6.5, borderWidth: 2,
            borderColor: COLORS.textPrimary,
        }} />
        <View style={{
            position: 'absolute', top: 10, left: 10,
            width: 2.5, height: 8,
            borderRadius: 1.25,
            backgroundColor: COLORS.textPrimary,
            transform: [{ rotate: '45deg' }],
        }} />
    </View>
);

// Loading spinner shown at bottom of list during pagination
const ListFooter = ({ loading }: { loading: boolean }) =>
    loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ padding: SPACING.xl }} />
    ) : null;


// MAIN HOMESCREEN COMPONENT

export const HomeScreen = () => {
    const navigation = useNavigation<Nav>();
    const [activeCategory, setActiveCategory] = useState('Suggested');
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [menuSong, setMenuSong] = useState<Song | null>(null);
    const { playSong, addToQueue } = usePlayerStore();

    // Load songs whenever category changes, reset pagination
    useEffect(() => {
        setSongs([]);
        setPage(1);
        setHasMore(true);
        loadSongs(QUERIES[activeCategory], 1, true);
    }, [activeCategory]);

    const loadSongs = async (
        query: string,
        pageNum: number,
        reset: boolean = false
    ) => {
        if (loading) return;
        setLoading(true);
        try {
            const result = await searchSongs(query, pageNum, 20);
            const newSongs = result?.results || [];
            setSongs((prev) => (reset ? newSongs : [...prev, ...newSongs]));
            // if fewer than 20 results came back, there are no more pages
            setHasMore(newSongs.length === 20);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Called when user scrolls to bottom of list — load next page
    const loadMore = () => {
        if (!hasMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadSongs(QUERIES[activeCategory], nextPage);
    };

    const handlePlay = (song: Song) => playSong(song, songs);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* ── Top bar: logo + search icon ── */}
            <View style={styles.topBar}>
                <View style={styles.logo}>
                    <Text style={styles.logoIcon}>𝄞</Text>
                    <Text style={styles.logoText}>Mume</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('SearchScreen')}
                    style={{ padding: 4 }}
                >
                    <SearchIcon />
                </TouchableOpacity>
            </View>

            {/* ── Horizontal category tabs ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabScroll}
            >
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={styles.catTab}
                        onPress={() => setActiveCategory(cat)}
                    >
                        <Text
                            style={[
                                styles.catText,
                                activeCategory === cat && styles.catTextActive,
                            ]}
                        >
                            {cat}
                        </Text>
                        {activeCategory === cat && <View style={styles.catUnderline} />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.divider} />

            {/* ── Count + sort row for non-Suggested tabs ── */}
            {activeCategory !== 'Suggested' && (
                <View style={styles.countRow}>
                    <Text style={styles.countText}>
                        {songs.length} {activeCategory.toLowerCase()}
                    </Text>
                    <TouchableOpacity style={styles.sortBtn}>
                        <Text style={styles.sortText}>Ascending  ↕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Content area — switches based on active category ── */}

            {activeCategory === 'Suggested' && (
                <SuggestedView songs={songs} onPlay={handlePlay} />
            )}

            {activeCategory === 'Songs' && (
                <FlatList
                    data={songs}
                    keyExtractor={(item, i) => `${item.id}-${i}`}
                    renderItem={({ item }) => (
                        <SongRow
                            song={item}
                            onPress={() => handlePlay(item)}
                            onMenu={() => setMenuSong(item)}
                        />
                    )}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={<ListFooter loading={loading} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            {activeCategory === 'Artists' && (
                <FlatList
                    data={songs}
                    keyExtractor={(item, i) => `${item.id}-${i}`}
                    renderItem={({ item }) => (
                        <ArtistRow
                            song={item}
                            onPress={() => handlePlay(item)}
                            onMenu={() => setMenuSong(item)}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={<ListFooter loading={loading} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            {activeCategory === 'Albums' && (
                <FlatList
                    data={songs}
                    keyExtractor={(item, i) => `${item.id}-${i}`}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <AlbumCard
                            song={item}
                            onPress={() => handlePlay(item)}
                            onMenu={() => setMenuSong(item)}
                        />
                    )}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={<ListFooter loading={loading} />}
                    contentContainerStyle={{
                        paddingHorizontal: SPACING.lg,
                        paddingBottom: 100,
                        gap: SPACING.md,
                    }}
                    columnWrapperStyle={{ gap: SPACING.md }}
                />
            )}

            {/* ── Song context menu bottom sheet ── */}
            <Modal
                visible={!!menuSong}
                transparent
                animationType="slide"
                onRequestClose={() => setMenuSong(null)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    onPress={() => setMenuSong(null)}
                    activeOpacity={1}
                >
                    <View style={styles.menuSheet}>
                        {menuSong && (
                            <>
                                <View style={styles.menuSongHeader}>
                                    <Image
                                        source={{ uri: getBestImageUrl(menuSong, '150x150') }}
                                        style={styles.menuThumb}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.menuSongName} numberOfLines={1}>
                                            {menuSong.name}
                                        </Text>
                                        <Text style={styles.menuSongArtist} numberOfLines={1}>
                                            {getSongArtists(menuSong)}  ·  {fmt(getSongDuration(menuSong))} mins
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.menuDivider} />
                                {[
                                    {
                                        icon: '▶',
                                        label: 'Play',
                                        action: () => {
                                            handlePlay(menuSong);
                                            setMenuSong(null);
                                        },
                                    },
                                    {
                                        icon: '⊕',
                                        label: 'Add to Playing Queue',
                                        action: () => {
                                            addToQueue(menuSong);
                                            setMenuSong(null);
                                        },
                                    },
                                    {
                                        icon: '⊕',
                                        label: 'Play Next',
                                        action: () => setMenuSong(null),
                                    },
                                    {
                                        icon: '⊗',
                                        label: 'Share',
                                        action: () => setMenuSong(null),
                                    },
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.label}
                                        style={styles.menuItem}
                                        onPress={item.action}
                                    >
                                        <Text style={styles.menuItemIcon}>{item.icon}</Text>
                                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Top bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    logo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoIcon: { fontSize: 26, color: COLORS.primary },
    logoText: {
        fontSize: 22,
        fontWeight: FONTS.bold,
        color: COLORS.textPrimary,
    },


    // Category tabs
    tabScroll: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.xl,
        paddingBottom: 0,
    },
    catTab: { paddingBottom: SPACING.sm, alignItems: 'center' },
    catText: {
        fontSize: 14,
        fontWeight: FONTS.medium,
        color: COLORS.textSecondary,
    },
    catTextActive: { color: COLORS.primary, fontWeight: FONTS.bold },
    catUnderline: {
        height: 2.5,
        width: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        marginTop: 5,
    },
    divider: { height: 1, backgroundColor: COLORS.separator },

    // Count + sort row
    countRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    countText: {
        fontSize: 14,
        fontWeight: FONTS.bold,
        color: COLORS.textPrimary,
    },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sortText: {
        fontSize: 13,
        fontWeight: FONTS.semiBold,
        color: COLORS.primary,
    },

    // Song row
    songRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 10,
        gap: SPACING.md,
    },
    songThumb: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.surface,
    },
    songInfo: { flex: 1, gap: 3 },
    songName: {
        fontSize: 14,
        fontWeight: FONTS.semiBold,
        color: COLORS.textPrimary,
    },
    songMeta: { fontSize: 12, color: COLORS.textSecondary },
    playCircle: {
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuDots: {
        fontSize: 20,
        color: COLORS.textSecondary,
        paddingHorizontal: 4,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.separator,
        marginHorizontal: SPACING.lg,
    },

    // Artist row
    artistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 12,
        gap: SPACING.md,
    },
    artistCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.surface,
    },
    artistInfo: { flex: 1, gap: 3 },
    artistName: {
        fontSize: 15,
        fontWeight: FONTS.bold,
        color: COLORS.textPrimary,
    },
    artistMeta: { fontSize: 12, color: COLORS.textSecondary },

    // Album grid
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACING.lg,
        gap: SPACING.md,
    },
    albumCard: { width: CARD_WIDTH },
    albumImage: {
        width: CARD_WIDTH,
        height: CARD_WIDTH,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.surface,
    },
    albumInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingTop: SPACING.sm,
        gap: 4,
    },
    albumName: {
        fontSize: 13,
        fontWeight: FONTS.bold,
        color: COLORS.textPrimary,
    },
    albumMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
    albumSongs: { fontSize: 11, color: COLORS.textSecondary },

    // Suggested sections
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: FONTS.bold,
        color: COLORS.textPrimary,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: FONTS.semiBold,
        color: COLORS.primary,
    },
    recentCard: { width: 136 },
    recentImg: {
        width: 136,
        height: 136,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.sm,
    },
    recentName: {
        fontSize: 13,
        fontWeight: FONTS.semiBold,
        color: COLORS.textPrimary,
        lineHeight: 18,
    },
    recentArtist: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    artistCardH: { alignItems: 'center', width: 80 },
    artistCardImg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.sm,
    },
    artistCardName: {
        fontSize: 12,
        fontWeight: FONTS.medium,
        color: COLORS.textPrimary,
        textAlign: 'center',
    },

    // Context menu
    menuOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    menuSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 32,
    },
    menuSongHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    menuThumb: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.surface,
    },
    menuSongName: {
        fontSize: 14,
        fontWeight: FONTS.bold,
        color: COLORS.textPrimary,
    },
    menuSongArtist: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: COLORS.separator },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: 14,
        gap: SPACING.lg,
    },
    menuItemIcon: { fontSize: 20, width: 28, color: COLORS.textSecondary },
    menuItemLabel: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: FONTS.medium,
    },
});