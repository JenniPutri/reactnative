import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, SectionList, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, remove, push } from 'firebase/database';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';

// Tambahkan interface
interface LocationItem {
    id: string;
    name: string;
    coordinates: string;
    accuration?: string;
}

interface SectionFormat {
    title: string;
    data: LocationItem[];
}

export default function LokasiScreen() {

    // Firebase Config
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

    const [sections, setSections] = useState<SectionFormat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();

    // Simpan ke riwayat kunjungan
    const saveHistory = (item: LocationItem) => {
        const historyRef = ref(db, 'history/');
        push(historyRef, {
            name: item.name,
            coordinates: item.coordinates,
            visitedAt: new Date().toISOString()
        });
    };

    // Klik → buka Maps + simpan
    const handlePress = (item: LocationItem) => {
        const [lat, lng] = item.coordinates.split(',').map(v => v.trim());
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

        Linking.openURL(url);
        saveHistory(item);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Hapus Lokasi",
            "Apakah Anda yakin ingin menghapus lokasi ini?",
            [
                { text: "Batal", style: "cancel" },
                { 
                    text: "Hapus", 
                    onPress: () => remove(ref(db, `points/${id}`)),
                    style: "destructive"
                }
            ]
        );
    };

    const handleEdit = (item: LocationItem) => {
        router.push({
            pathname: "/formeditlocation",
            params: {
                id: item.id,
                name: item.name,
                coordinates: item.coordinates,
                accuration: item.accuration ?? ''
            }
        });
    };

    // Load data lokasi dari Firebase
    useEffect(() => {
        const pointsRef = ref(db, 'points/');

        const unsubscribe = onValue(pointsRef, snapshot => {
            const data = snapshot.val();

            if (data) {
                const pointsArray: LocationItem[] =
                    Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));

                setSections([{ title: 'Lokasi Tersimpan', data: pointsArray }]);
            } else {
                setSections([]);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <TouchableOpacity 
                            style={styles.cardLeft}
                            onPress={() => handlePress(item)}
                        >
                            <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                            <ThemedText>{item.coordinates}</ThemedText>
                        </TouchableOpacity>

                        <View style={styles.cardRight}>
                            <TouchableOpacity onPress={() => handleEdit(item)}>
                                <FontAwesome5 name="pencil-alt" size={22} color="orange" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <FontAwesome5 name="trash" size={22} color="red" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                renderSectionHeader={({ section }) => (
                    <ThemedText style={styles.header}>{section.title}</ThemedText>
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 22, width: '100%' },
    card: { flexDirection: 'row', backgroundColor: '#ffc4e7ff', margin: 10, padding: 20, borderRadius: 8 },
    cardLeft: { flex: 1 },
    cardRight: { flexDirection: 'row', gap: 20 },
    itemName: { fontSize: 18, fontWeight: 'bold' },
    header: { backgroundColor: '#e21998ff', padding: 16, color: 'white', fontSize: 24, fontWeight: 'bold' }
});
