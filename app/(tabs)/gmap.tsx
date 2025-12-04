import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import MapView, { Marker, Callout, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { router } from 'expo-router';
import * as Location from 'expo-location';

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

interface MarkerData {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    category?: string;
}

interface Review {
    id: string;
    locationId: string;
    rating: number;
}

export default function MapScreen() {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [userLocation, setUserLocation] = useState<any>(null);
    const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
    const [showRadius, setShowRadius] = useState(false);
    const [filterCategory, setFilterCategory] = useState<'all' | 'Wisata' | 'Kuliner'>('all');
    const mapRef = useRef<MapView>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;

    // Get user location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        })();
    }, []);

    // Fetch markers from Firebase
    useEffect(() => {
        const pointsRef = ref(db, 'points/');
        const unsubscribe = onValue(pointsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const parsedMarkers = Object.keys(data)
                    .map(key => {
                        const point = data[key];
                        if (typeof point.coordinates !== 'string' || point.coordinates.trim() === '') {
                            return null;
                        }
                        const [latitude, longitude] = point.coordinates.split(',').map(Number);

                        if (isNaN(latitude) || isNaN(longitude)) {
                            console.warn(`Invalid coordinates for point ${key}:`, point.coordinates);
                            return null;
                        }

                        return {
                            id: key,
                            name: point.name,
                            latitude,
                            longitude,
                            category: point.category || 'Wisata',
                        };
                    })
                    .filter(Boolean) as MarkerData[];
                setMarkers(parsedMarkers);
            } else {
                setMarkers([]);
            }
            setLoading(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch reviews from Firebase
    useEffect(() => {
        const reviewsRef = ref(db, 'reviews/');
        const unsubscribe = onValue(reviewsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const reviewsArray = Object.keys(data).map(key => ({
                    id: key,
                    locationId: data[key].locationId,
                    rating: data[key].rating,
                }));
                setReviews(reviewsArray);
            }
        });
        return () => unsubscribe();
    }, []);

    // Calculate average rating for a location
    const getAverageRating = (locationId: string) => {
        const locationReviews = reviews.filter(r => r.locationId === locationId);
        if (locationReviews.length === 0) return 0;
        const sum = locationReviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / locationReviews.length).toFixed(1);
    };

    // Calculate distance between two points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance.toFixed(2);
    };

    // Handle marker press
    const handleMarkerPress = (marker: MarkerData) => {
        setSelectedMarker(marker);
        setModalVisible(true);
        Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    // Close modal
    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setModalVisible(false);
            setSelectedMarker(null);
        });
    };

    // Zoom to user location
    const zoomToUserLocation = () => {
        if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    };

    // Zoom to all markers
    const fitToMarkers = () => {
        if (mapRef.current && markers.length > 0) {
            mapRef.current.fitToCoordinates(
                markers.map(m => ({ latitude: m.latitude, longitude: m.longitude })),
                {
                    edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                    animated: true,
                }
            );
        }
    };

    // Filter markers by category
    const filteredMarkers = filterCategory === 'all'
        ? markers
        : markers.filter(m => m.category === filterCategory);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color="#e21998" />
                    <Text style={styles.loadingText}>Memuat peta...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconCircle}>
                        <FontAwesome5 name="map-marked-alt" size={18} color="white" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Google Maps</Text>
                        <Text style={styles.headerSubtitle}>{filteredMarkers.length} Lokasi</Text>
                    </View>
                </View>
            </View>

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                mapType={mapType}
                initialRegion={{
                    latitude: -7.5707,
                    longitude: 110.8281,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={true}
            >
                {filteredMarkers.map(marker => (
                    <Marker
                        key={marker.id}
                        coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                        pinColor={marker.category?.toLowerCase() === 'kuliner' ? '#fb92cf' : '#e21998'}
                        onPress={() => handleMarkerPress(marker)}
                    >
                        <Callout tooltip>
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle}>{marker.name}</Text>
                                <View style={styles.calloutRating}>
                                    <FontAwesome5 name="star" size={12} color="#FFD700" solid />
                                    <Text style={styles.calloutRatingText}>
                                        {getAverageRating(marker.id) || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* User location circle */}
                {userLocation && showRadius && (
                    <Circle
                        center={userLocation}
                        radius={1000}
                        strokeColor="rgba(226, 25, 152, 0.5)"
                        fillColor="rgba(226, 25, 152, 0.1)"
                    />
                )}
            </MapView>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterBtn, filterCategory === 'all' && styles.filterBtnActive]}
                    onPress={() => setFilterCategory('all')}
                >
                    <FontAwesome5 name="globe" size={14} color={filterCategory === 'all' ? 'white' : '#e21998'} />
                    <Text style={[styles.filterBtnText, filterCategory === 'all' && styles.filterBtnTextActive]}>
                        Semua
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterBtn, filterCategory === 'Wisata' && styles.filterBtnActive]}
                    onPress={() => setFilterCategory('Wisata')}
                >
                    <FontAwesome5 name="map-marked-alt" size={14} color={filterCategory === 'Wisata' ? 'white' : '#e21998'} />
                    <Text style={[styles.filterBtnText, filterCategory === 'Wisata' && styles.filterBtnTextActive]}>
                        Wisata
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterBtn, filterCategory === 'Kuliner' && styles.filterBtnActive]}
                    onPress={() => setFilterCategory('Kuliner')}
                >
                    <FontAwesome5 name="utensils" size={14} color={filterCategory === 'Kuliner' ? 'white' : '#fb92cf'} />
                    <Text style={[styles.filterBtnText, filterCategory === 'Kuliner' && styles.filterBtnTextActive]}>
                        Kuliner
                    </Text>
                </TouchableOpacity>

            </View>

            {/* Control Buttons */}
            <View style={styles.controlsLeft}>
                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
                >
                    <FontAwesome5 name="layer-group" size={18} color="#e21998" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => setShowRadius(!showRadius)}
                >
                    <FontAwesome5
                        name={showRadius ? "dot-circle" : "circle"}
                        size={18}
                        color={showRadius ? "#e21998" : "#999"}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={fitToMarkers}
                >
                    <FontAwesome5 name="compress-arrows-alt" size={18} color="#e21998" />
                </TouchableOpacity>
            </View>

            {/* FAB Buttons */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fabSecondary}
                    onPress={zoomToUserLocation}
                >
                    <FontAwesome5 name="location-arrow" size={18} color="#e21998" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.fabMain}
                    onPress={() => router.push('/forminputlocation')}
                >
                    <FontAwesome5 name="plus" size={22} color="white" />
                </TouchableOpacity>
            </View>

            {/* Detail Modal */}
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={closeModal}
                    />

                    <Animated.View
                        style={[
                            styles.modalContent,
                            { transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        {selectedMarker && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalDragHandle} />
                                    <View style={styles.modalTitleContainer}>
                                        <FontAwesome5
                                            name={selectedMarker.category === 'Kuliner' ? 'utensils' : 'map-marked-alt'}
                                            size={24}
                                            color="#fb92cf"
                                        />
                                        <Text style={styles.modalTitle}>{selectedMarker.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                                        <FontAwesome5 name="times" size={20} color="#999" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalBody}>
                                    <View style={styles.categoryBadge}>
                                        <FontAwesome5
                                            name={selectedMarker.category === 'Kuliner' ? 'utensils' : 'map-marked-alt'}
                                            size={12}
                                            color="white"
                                        />
                                        <Text style={styles.categoryBadgeText}>{selectedMarker.category}</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <FontAwesome5 name="star" size={16} color="#FFD700" solid />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Rating</Text>
                                            <Text style={styles.infoValue}>
                                                {getAverageRating(selectedMarker.id) || 'Belum ada rating'} / 5.0
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIcon}>
                                            <FontAwesome5 name="map-pin" size={16} color="#e21998" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Koordinat</Text>
                                            <Text style={styles.infoValue}>
                                                {selectedMarker.latitude}, {selectedMarker.longitude}
                                            </Text>
                                        </View>
                                    </View>

                                    {userLocation && (
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoIcon}>
                                                <FontAwesome5 name="route" size={16} color="#4CAF50" />
                                            </View>
                                            <View style={styles.infoContent}>
                                                <Text style={styles.infoLabel}>Jarak dari Anda</Text>
                                                <Text style={styles.infoValue}>
                                                    {calculateDistance(
                                                        userLocation.latitude,
                                                        userLocation.longitude,
                                                        selectedMarker.latitude,
                                                        selectedMarker.longitude
                                                    )} km
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={styles.directionsBtn}
                                        onPress={() => {
                                            // Open Google Maps for directions
                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.latitude},${selectedMarker.longitude}`;
                                            console.log('Open directions:', url);
                                        }}
                                    >
                                        <FontAwesome5 name="directions" size={16} color="white" />
                                        <Text style={styles.directionsBtnText}>Petunjuk Arah</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingCard: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#e21998',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#e21998',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
    },
    map: {
        flex: 1,
    },
    calloutContainer: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        minWidth: 120,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    calloutTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    calloutRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    calloutRatingText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    filterContainer: {
        position: 'absolute',
        top: 120,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 10,
        zIndex: 5,
    },
    filterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'white',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e21998',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    filterBtnActive: {
        backgroundColor: '#e21998',
    },
    filterBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#e21998',
    },
    filterBtnTextActive: {
        color: 'white',
    },
    controlsLeft: {
        position: 'absolute',
        left: 20,
        bottom: 100,
        gap: 12,
        zIndex: 5,
    },
    controlBtn: {
        width: 48,
        height: 48,
        backgroundColor: 'white',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    fabContainer: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        alignItems: 'center',
        gap: 12,
        zIndex: 5,
    },
    fabSecondary: {
        width: 50,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e21998',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
    },
    fabMain: {
        width: 60,
        height: 60,
        backgroundColor: '#e21998',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#e21998',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    legendCard: {
        position: 'absolute',
        left: 20,
        bottom: 30,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 4,
    },
    legendTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 11,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '60%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    modalDragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    modalHeader: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    closeBtn: {
        position: 'absolute',
        top: 0,
        right: 20,
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#e21998',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 20,
    },
    categoryBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    infoIcon: {
        width: 36,
        height: 36,
        backgroundColor: '#FFF0F7',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    directionsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#e21998',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 10,
        shadowColor: '#e21998',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    directionsBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
});