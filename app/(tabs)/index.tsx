import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const { width } = Dimensions.get('window');

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAIDdnbV7oD7h2tHkr8emdsospyQPa9hEU",
  authDomain: "reactnative-2025-9bf81.firebaseapp.com",
  databaseURL: "https://reactnative-2025-9bf81-default-rtdb.firebaseio.com",
  projectId: "reactnative-2025-9bf81",
  storageBucket: "reactnative-2025-9bf81.firebasestorage.app",
  messagingSenderId: "757796835284",
  appId: "1:757796835284:web:7d6354ec7d8dc775da5041",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

interface Review {
  id: string;
  locationId: string;
  locationName: string;
  reviewerName: string;
  reviewText: string;
  rating: number;
  category?: string;
  timestamp: number;
}

interface LocationStats {
  totalReviews: number;
  avgRating: number;
}

// Component untuk Card dengan Animasi
const AnimatedReviewCard = ({ item, index, stats }: { item: Review; index: number; stats: LocationStats }) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isLongComment = item.reviewText.length > 80;

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;

    Animated.parallel([
      Animated.spring(animatedHeight, {
        toValue,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: expanded ? 1 : 0.98,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    setExpanded(!expanded);
  };

  const shortenComment = (text: string) => {
    if (text.length > 80) {
      return text.substring(0, 80) + "...";
    }
    return text;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 0: return ['#FFD700', '#FFA500'];
      case 1: return ['#C0C0C0', '#A8A8A8'];
      case 2: return ['#CD7F32', '#B8860B'];
      default: return ['#e21998', '#fb92cf'];
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0: return 'crown';
      case 1: return 'medal';
      case 2: return 'award';
      default: return 'star';
    }
  };

  return (
    <Animated.View style={[styles.recCard, { transform: [{ scale: scaleAnim }] }]}>
      {/* Rank Badge */}
      <View style={[styles.rankBadge, {
        backgroundColor: getRankColor(index)[0],
      }]}>
        <FontAwesome5 name={getRankIcon(index)} size={14} color="white" solid />
        <ThemedText style={styles.rankNumber}>#{index + 1}</ThemedText>
      </View>

      {/* Category Badge */}
      <View style={styles.categoryBadgeTop}>
        <FontAwesome5
          name={item.category === 'Kuliner' ? 'utensils' : 'map-marked-alt'}
          size={10}
          color="#e21998"
        />
        <ThemedText style={styles.categoryTextTop}>{item.category || 'Wisata'}</ThemedText>
      </View>

      {/* Location Name */}
      <View style={styles.recHeader}>
        <ThemedText style={styles.recTitle} numberOfLines={2}>
          {item.locationName}
        </ThemedText>
      </View>

      {/* Rating & Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.ratingRow}>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome5
                key={star}
                name="star"
                size={14}
                color={star <= item.rating ? "#FFD700" : "#E0E0E0"}
                solid={star <= item.rating}
              />
            ))}
          </View>
          <ThemedText style={styles.ratingNumber}>
            {item.rating}.0
          </ThemedText>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome5 name="comment-dots" size={10} color="#999" />
            <ThemedText style={styles.statText}>{stats.totalReviews} review</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome5 name="chart-line" size={10} color="#999" />
            <ThemedText style={styles.statText}>Avg {stats.avgRating.toFixed(1)}</ThemedText>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Review Text */}
      <View style={styles.reviewTextContainer}>
        <FontAwesome5 name="quote-left" size={12} color="#e21998" style={styles.quoteIcon} />
        <ThemedText style={styles.recComment}>
          {expanded ? item.reviewText : shortenComment(item.reviewText)}
        </ThemedText>
      </View>

      {/* Expand Button */}
      {isLongComment && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.expandButtonText}>
            {expanded ? "Lebih sedikit" : "Baca selengkapnya"}
          </ThemedText>
          <FontAwesome5
            name={expanded ? "chevron-up" : "chevron-down"}
            size={10}
            color="#e21998"
          />
        </TouchableOpacity>
      )}

      {/* Author */}
      <View style={styles.authorContainer}>
        <View style={styles.authorAvatar}>
          <FontAwesome5 name="user" size={10} color="white" />
        </View>
        <ThemedText style={styles.recAuthor}>
          {item.reviewerName}
        </ThemedText>
        <View style={styles.verifiedBadge}>
          <FontAwesome5 name="check-circle" size={10} color="#4CAF50" solid />
        </View>
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [top3, setTop3] = useState<Review[]>([]);
  const [locationStats, setLocationStats] = useState<Map<string, LocationStats>>(new Map());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const reviewsRef = ref(db, "reviews/");
    onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setReviews([]);

      const arr: Review[] = Object.keys(data).map((id) => ({
        id,
        ...data[id],
      }));

      setReviews(arr);

      // Calculate stats per location
      const stats = new Map<string, LocationStats>();
      arr.forEach(review => {
        const existing = stats.get(review.locationId) || { totalReviews: 0, avgRating: 0 };
        stats.set(review.locationId, {
          totalReviews: existing.totalReviews + 1,
          avgRating: ((existing.avgRating * existing.totalReviews) + review.rating) / (existing.totalReviews + 1)
        });
      });
      setLocationStats(stats);

      // Sort berdasarkan rating tertinggi
      const best = [...arr].sort((a, b) => b.rating - a.rating).slice(0, 3);
      setTop3(best);

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const totalLocations = locationStats.size;
  const totalReviews = reviews.length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* HERO HEADER */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/sala.jpg")}
          style={styles.heroImage}
        />
        <View style={styles.gradientOverlay}>
          <View style={styles.overlay}>
            <View style={styles.headerBadge}>
            </View>
            <ThemedText type="title" style={styles.headerText}>
              MAMPIR
            </ThemedText>
            <ThemedText style={styles.headerSub}>
              Jelajahi Destinasi Terbaik di Kota Surakarta
            </ThemedText>

            {/* Stats Preview */}
            <View style={styles.statsPreview}>
              <View style={styles.statPreviewItem}>
                <ThemedText style={styles.statPreviewNumber}>{totalLocations}</ThemedText>
                <ThemedText style={styles.statPreviewLabel}>Lokasi</ThemedText>
              </View>
              <View style={styles.statPreviewDivider} />
              <View style={styles.statPreviewItem}>
                <ThemedText style={styles.statPreviewNumber}>{totalReviews}</ThemedText>
                <ThemedText style={styles.statPreviewLabel}>Review</ThemedText>
              </View>
              <View style={styles.statPreviewDivider} />
              <View style={styles.statPreviewItem}>
                <View style={styles.statPreviewRating}>
                  <FontAwesome5 name="star" size={12} color="#FFD700" solid />
                  <ThemedText style={styles.statPreviewNumber}>{avgRating}</ThemedText>
                </View>
                <ThemedText style={styles.statPreviewLabel}>Rating</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tentang Aplikasi */}
      <Animated.View style={[styles.cardWhite, { opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="info-circle" size={20} color="#e21998" />
          </View>
          <View style={styles.cardHeaderText}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              MAMPIR
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Mangan lan Plesir
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.description}>
          MAMPIR adalah aplikasi untuk menemukan wisata dan kuliner terbaik di
          Kota Solo. Pengguna dapat melihat lokasi, membaca review, memberi
          rating, serta mendapatkan rekomendasi berdasarkan pengalaman
          pengunjung lain.
        </ThemedText>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <FontAwesome5 name="check-circle" size={14} color="#4CAF50" solid />
            <ThemedText style={styles.featureText}>Review & Rating Autentik</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome5 name="check-circle" size={14} color="#4CAF50" solid />
            <ThemedText style={styles.featureText}>Rekomendasi Terpersonalisasi</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome5 name="check-circle" size={14} color="#4CAF50" solid />
            <ThemedText style={styles.featureText}>Navigasi ke Lokasi</ThemedText>
          </View>
        </View>
      </Animated.View>

      {/* Rekomendasi Terbaik */}
      <Animated.View style={[styles.cardPink, { opacity: fadeAnim }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
            <FontAwesome5 name="fire" size={20} color="#FF6B00" />
          </View>
          <View style={styles.cardHeaderText}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Top 3 Pilihan Terbaik
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Berdasarkan rating tertinggi
            </ThemedText>
          </View>
        </View>

        {/* Horizontal Scroll dengan Animasi */}
        {top3.length > 0 ? (
          <FlatList
            data={top3}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <AnimatedReviewCard
                item={item}
                index={index}
                stats={locationStats.get(item.locationId) || { totalReviews: 0, avgRating: 0 }}
              />
            )}
            contentContainerStyle={styles.flatListContent}
            snapToInterval={width * 0.75 + 16}
            decelerationRate="fast"
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <FontAwesome5 name="search" size={40} color="#e21998" />
            </View>
            <ThemedText style={styles.emptyTitle}>Belum Ada Review</ThemedText>
            <ThemedText style={styles.emptyText}>
              Jadilah yang pertama memberikan review!
            </ThemedText>
          </View>
        )}
      </Animated.View>

      {/* CTA Section */}
      <View style={styles.ctaContainer}>
        <View style={styles.ctaCard}>
          <FontAwesome5 name="map-marked-alt" size={32} color="#e21998" />
          <ThemedText style={styles.ctaTitle}>Jelajahi Lebih Banyak</ThemedText>
          <ThemedText style={styles.ctaText}>
            Temukan destinasi wisata dan kuliner menarik lainnya di sekitar Solo
          </ThemedText>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffc4e7ff',
  },

  // HERO HEADER
  header: {
    position: "relative",
    height: 300,
    marginBottom: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '0%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
 headerText: {
  color: "#e21998ff",
  fontWeight: "bold",
  fontSize: 50,
  marginBottom: 10,
  textAlign: "center",
  textShadowColor: 'rgba(0,0,0,0.7)',  
  textShadowOffset: { width: 2, height: 2 }, 
  textShadowRadius: 4, 
},
headerSub: {
  color: "#f7d7e8ff",
  fontSize: 15,
  fontWeight: "bold",
  marginBottom: 30,
  textAlign: "center",
  textShadowColor: 'rgba(0,0,0,0.5)',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 3,
  },
  statsPreview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statPreviewItem: {
    alignItems: 'center',
  },
  statPreviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e21998',
  },
  statPreviewLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  statPreviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statPreviewDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },

  // CARDS
  cardWhite: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPink: {
    backgroundColor: "#FFE4F2",
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#e21998',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#222",
    fontSize: 18,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  description: {
    color: "#555",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  featureList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: '#444',
    fontSize: 13,
  },

  // RECOMMENDATION CARDS
  flatListContent: {
    paddingRight: 16,
  },
  recCard: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 20,
    width: width * 0.75,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  rankNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryTextTop: {
    color: '#e21998',
    fontSize: 11,
    fontWeight: '600',
  },
  recHeader: {
    marginBottom: 12,
  },
  recTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    lineHeight: 24,
  },
  statsContainer: {
    gap: 10,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  starContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#999',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#e0e0e0',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 14,
  },
  reviewTextContainer: {
    position: 'relative',
    paddingLeft: 8,
  },
  quoteIcon: {
    position: 'absolute',
    top: -4,
    left: -4,
  },
  recComment: {
    color: "#555",
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 12,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF0F7',
    borderRadius: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FFE4F2',
  },
  expandButtonText: {
    color: '#e21998',
    fontWeight: '600',
    fontSize: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e21998',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recAuthor: {
    color: "#333",
    fontWeight: "600",
    fontSize: 13,
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 'auto',
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  ctaCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 12,
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});