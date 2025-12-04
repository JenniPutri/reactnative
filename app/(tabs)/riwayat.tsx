import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SectionList, ActivityIndicator } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Tipe Data
interface HistoryItem {
    id: string;
    name: string;
    coordinates: string;
    visitedAt: string;
}

interface SectionFormat {
    title: string;
    data: HistoryItem[];
}

export default function RiwayatScreen() {

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

    // Load Riwayat Kunjungan
    useEffect(() => {
        const historyRef = ref(db, 'history/');

        const unsubscribe = onValue(historyRef, snapshot => {
            const data = snapshot.val();

            if (data) {
                const historyArray: HistoryItem[] = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));

                setSections([
                    {
                        title: "History Kunjungan",
                        data: historyArray.reverse() // tampilkan terbaru di atas
                    }
                ]);
            } else {
                setSections([]);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
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
                        <ThemedText style={styles.itemTitle}>{item.name}</ThemedText>
                        <ThemedText>{item.coordinates}</ThemedText>
                        <ThemedText style={styles.dateText}>
                            {new Date(item.visitedAt).toLocaleString()}
                        </ThemedText>
                    </View>
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <ThemedText style={styles.header}>{title}</ThemedText>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 22,
        width: "100%"
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    card: {
        backgroundColor: '#ffc4e7ff',
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 10
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4
    },
    dateText: {
        marginTop: 4,
        fontSize: 12,
        color: "#444"
    },
    header: {
        backgroundColor: '#e21998ff',
        padding: 16,
        color: 'white',
        fontSize: 22,
        fontWeight: "bold"
    }
});
