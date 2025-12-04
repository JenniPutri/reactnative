import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SectionList, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, remove } from 'firebase/database';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Fonts } from '@/constants/theme';

// Type definitions
interface Location {
  id: string;
  name: string;
  coordinates: string;
  accuration?: string;
  category?: string;
}

interface Review {
  id: string;
  locationId: string;
  locationName: string;
  reviewerName: string;
  reviewText: string;
  rating: number;
  category: string;
  timestamp: number;
}

interface Section {
  title: string;
  locationId: string;
  category: string;
  avgRating: string;
  data: Review[];
  location: Location;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIDdnbV7oD7h2tHkr8emdsospyQPa9hEU",
  authDomain: "reactnative-2025-9bf81.firebaseapp.com",
  databaseURL: "https://reactnative-2025-9bf81-default-rtdb.firebaseio.com",
  projectId: "reactnative-2025-9bf81",
  storageBucket: "reactnative-2025-9bf81.firebasestorage.app",
  messagingSenderId: "757796835284",
  appId: "1:757796835284:web:7d6354ec7d8dc775da5041"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function ReviewScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [category, setCategory] = useState('Pariwisata');

  // Load locations from Firebase
  useEffect(() => {
    const pointsRef = ref(db, 'points/');
    const unsubscribe = onValue(pointsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const locationsArray: Location[] = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name || '',
          coordinates: data[key].coordinates || '',
          accuration: data[key].accuration,
          category: data[key].category
        }));
        setLocations(locationsArray);
      } else {
        setLocations([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load reviews from Firebase
  useEffect(() => {
    const reviewsRef = ref(db, 'reviews/');
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reviewsArray: Review[] = Object.keys(data).map(key => ({
          id: key,
          locationId: data[key].locationId || '',
          locationName: data[key].locationName || '',
          reviewerName: data[key].reviewerName || '',
          reviewText: data[key].reviewText || '',
          rating: data[key].rating || 0,
          category: data[key].category || '',
          timestamp: data[key].timestamp || 0
        }));
        setReviews(reviewsArray);
      } else {
        setReviews([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Group reviews by location
  const getReviewsByLocation = (locationId: string): Review[] => {
    return reviews.filter(review => review.locationId === locationId);
  };

  // Calculate average rating
  const getAverageRating = (locationId: string): string => {
    const locationReviews = getReviewsByLocation(locationId);
    if (locationReviews.length === 0) return '0';
    const sum = locationReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / locationReviews.length).toFixed(1);
  };

  // Handle add review
  const handleAddReview = () => {
    if (!selectedLocation || !reviewText.trim() || !reviewerName.trim()) {
      Alert.alert('Error', 'Mohon isi semua field');
      return;
    }

    const reviewsRef = ref(db, 'reviews/');
    push(reviewsRef, {
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      reviewerName: reviewerName.trim(),
      reviewText: reviewText.trim(),
      rating: rating,
      category: category,
      timestamp: Date.now()
    }).then(() => {
      Alert.alert('Sukses', 'Review berhasil ditambahkan');
      setModalVisible(false);
      setReviewText('');
      setReviewerName('');
      setRating(5);
      setCategory('Pariwisata');
    }).catch((error) => {
      Alert.alert('Error', 'Gagal menambahkan review');
      console.error(error);
    });
  };

  // Handle delete review
  const handleDeleteReview = (reviewId: string) => {
    Alert.alert(
      "Hapus Review",
      "Apakah Anda yakin ingin menghapus review ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          onPress: () => {
            const reviewRef = ref(db, `reviews/${reviewId}`);
            remove(reviewRef);
          },
          style: "destructive"
        }
      ]
    );
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome5
          key={i}
          name="star"
          size={16}
          color={i <= rating ? "#FFD700" : "#CCCCCC"}
          solid={i <= rating}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  // Prepare sections for SectionList
  const sections: Section[] = locations.map(location => ({
    title: location.name,
    locationId: location.id,
    category: location.category || 'Pariwisata',
    avgRating: getAverageRating(location.id),
    data: getReviewsByLocation(location.id),
    location: location
  }));

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e21998ff" />
        <ThemedText style={styles.loadingText}>Memuat data...</ThemedText>
      </ThemedView>
    );
  }

  if (locations.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <FontAwesome5 name="map-marked-alt" size={64} color="#cccccc" />
        <ThemedText style={styles.emptyTitle}>Belum Ada Lokasi</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          Tambahkan lokasi terlebih dahulu di tab Map
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <FontAwesome5 name="comment-dots" size={28} color="white" style={styles.headerIcon} />
        <View style={styles.headerTextContainer}>
          <ThemedText type="title" style={styles.headerTitle}>
            Review Wisata
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Pariwisata & Kuliner
          </ThemedText>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <View style={styles.avatarCircle}>
                  <FontAwesome5 name="user" size={16} color="white" />
                </View>
                <View>
                  <ThemedText style={styles.reviewerName}>{item.reviewerName}</ThemedText>
                  <ThemedText style={styles.reviewDate}>
                    {new Date(item.timestamp).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => handleDeleteReview(item.id)}
                style={styles.deleteButton}
              >
                <FontAwesome5 name="trash-alt" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ratingRow}>
              {renderStars(item.rating)}
              <View style={styles.categoryBadge}>
                <FontAwesome5 
                  name={item.category === 'Kuliner' ? 'utensils' : 'map-marked-alt'} 
                  size={10} 
                  color="white" 
                />
                <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.reviewText}>{item.reviewText}</ThemedText>
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <View style={styles.locationInfo}>
                <FontAwesome5 name="map-marker-alt" size={20} color="#e21998ff" />
                <View style={styles.locationTextContainer}>
                  <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                  <View style={styles.ratingInfo}>
                    <FontAwesome5 name="star" size={14} color="#FFD700" solid />
                    <ThemedText style={styles.avgRating}>
                      {section.avgRating === '0' ? 'Belum ada rating' : `${section.avgRating} / 5.0`}
                    </ThemedText>
                    <ThemedText style={styles.reviewCount}>
                      ({section.data.length} review)
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => {
                  setSelectedLocation(section.location);
                  setModalVisible(true);
                }}
              >
                <FontAwesome5 name="plus" size={12} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        renderSectionFooter={({ section }) => (
          section.data.length === 0 ? (
            <View style={styles.noReviewsContainer}>
              <FontAwesome5 name="comment-slash" size={32} color="#e0e0e0" />
              <ThemedText style={styles.noReviews}>
                Belum ada review untuk lokasi ini
              </ThemedText>
              <ThemedText style={styles.noReviewsSubtext}>
                Jadilah yang pertama memberi review!
              </ThemedText>
            </View>
          ) : null
        )}
        stickySectionHeadersEnabled={false}
      />

      {/* Modal Add Review */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <FontAwesome5 name="edit" size={24} color="#e21998ff" />
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    Tulis Review
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <FontAwesome5 name="times" size={24} color="#999" />
                </TouchableOpacity>
              </View>

              {selectedLocation && (
                <View style={styles.selectedLocationCard}>
                  <FontAwesome5 name="map-marker-alt" size={16} color="#e21998ff" />
                  <ThemedText style={styles.locationName}>
                    {selectedLocation.name}
                  </ThemedText>
                </View>
              )}

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.inputLabel}>
                  <FontAwesome5 name="user" size={12} color="#666" /> Nama Anda
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Budi Santoso"
                  placeholderTextColor="#999"
                  value={reviewerName}
                  onChangeText={setReviewerName}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.inputLabel}>
                  <FontAwesome5 name="list" size={12} color="#666" /> Kategori
                </ThemedText>
                <View style={styles.categoryButtons}>
                  <TouchableOpacity
                    style={[styles.categoryBtn, category === 'Pariwisata' && styles.categoryBtnActive]}
                    onPress={() => setCategory('Pariwisata')}
                  >
                    <FontAwesome5 
                      name="map-marked-alt" 
                      size={16} 
                      color={category === 'Pariwisata' ? 'white' : '#e21998ff'} 
                    />
                    <ThemedText style={[styles.categoryBtnText, category === 'Pariwisata' && styles.categoryBtnTextActive]}>
                      Pariwisata
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.categoryBtn, category === 'Kuliner' && styles.categoryBtnActive]}
                    onPress={() => setCategory('Kuliner')}
                  >
                    <FontAwesome5 
                      name="utensils" 
                      size={16} 
                      color={category === 'Kuliner' ? 'white' : '#e21998ff'} 
                    />
                    <ThemedText style={[styles.categoryBtnText, category === 'Kuliner' && styles.categoryBtnTextActive]}>
                      Kuliner
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.inputLabel}>
                  <FontAwesome5 name="star" size={12} color="#666" /> Rating
                </ThemedText>
                <View style={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity 
                      key={star} 
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <FontAwesome5
                        name="star"
                        size={36}
                        color={star <= rating ? "#FFD700" : "#E0E0E0"}
                        solid={star <= rating}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <ThemedText style={styles.ratingLabel}>
                  {rating === 1 ? 'Sangat Buruk' : 
                   rating === 2 ? 'Buruk' : 
                   rating === 3 ? 'Cukup' : 
                   rating === 4 ? 'Baik' : 'Sangat Baik'}
                </ThemedText>
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.inputLabel}>
                  <FontAwesome5 name="comment" size={12} color="#666" /> Review Anda
                </ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ceritakan pengalaman Anda di sini..."
                  placeholderTextColor="#999"
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddReview}>
                <FontAwesome5 name="paper-plane" size={16} color="white" />
                <ThemedText style={styles.submitButtonText}>Kirim Review</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffc4e7ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#999',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#e21998ff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  headerSubtitle: {
    color: '#FFE6F3',
    fontSize: 14,
    marginTop: 2,
  },
  listContainer: {
    paddingVertical: 10,
  },
  sectionHeader: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avgRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
  },
  addReviewButton: {
    backgroundColor: '#e21998ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e21998ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e21998ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: {
    fontWeight: '700',
    fontSize: 15,
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fb92cfff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  categoryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginHorizontal: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
  },
  noReviews: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  noReviewsSubtext: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  selectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  locationName: {
    fontSize: 16,
    color: '#e21998ff',
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e21998ff',
    backgroundColor: 'white',
  },
  categoryBtnActive: {
    backgroundColor: '#e21998ff',
  },
  categoryBtnText: {
    color: '#e21998ff',
    fontWeight: '700',
    fontSize: 14,
  },
  categoryBtnTextActive: {
    color: 'white',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#e21998ff',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#e21998ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    gap: 10,
    shadowColor: '#e21998ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});