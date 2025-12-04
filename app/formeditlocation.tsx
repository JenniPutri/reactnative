import React, { useState, useEffect } from 'react';
import { Alert, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get, child } from "firebase/database";

const App = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [accuration, setAccuration] = useState('');
    const [category, setCategory] = useState('');

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

    // Ambil data dari Firebase saat form di-mount
    useEffect(() => {
        if (!id) return;
        const pointRef = ref(db, `points/${id}`);
        get(pointRef)
            .then(snapshot => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setName(data.name || '');
                    setLocation(data.coordinates || '');
                    setAccuration(data.accuration || '');
                    setCategory(data.category || ''); // set category dari Firebase
                } else {
                    Alert.alert("Error", "Data tidak ditemukan!");
                }
            })
            .catch((e) => {
                console.error("Error fetching document: ", e);
                Alert.alert("Error", "Gagal mengambil data dari Firebase");
            });
    }, [id]);

    const getCoordinates = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
        }
        let locationData = await Location.getCurrentPositionAsync({});
        setLocation(locationData.coords.latitude + ',' + locationData.coords.longitude);
        setAccuration(locationData.coords.accuracy + ' m');
    };

    const createOneButtonAlert = (callback) =>
        Alert.alert('Success', 'Berhasil memperbarui data', [
            { text: 'OK', onPress: callback },
        ]);

    const handleUpdate = () => {
        if (!id) {
            Alert.alert("Error", "ID lokasi tidak ditemukan.");
            return;
        }
        if (!name || !location || !category) {
            Alert.alert('Error', 'Nama, Koordinat, dan Category harus diisi!');
            return;
        }
        const pointRef = ref(db, `points/${id}`);
        update(pointRef, { name, coordinates: location, accuration, category })
            .then(() => createOneButtonAlert(() => router.back()))
            .catch((e) => {
                console.error("Error updating document: ", e);
                Alert.alert("Error", "Gagal memperbarui data");
            });
    };

    return (
        <SafeAreaProvider style={{ backgroundColor: '#FFF0F7' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    
                    <Text style={styles.inputTitle}>Nama</Text>
                    <TextInput
                        style={styles.input}
                        placeholder='Isikan nama objek'
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.inputTitle}>Category</Text>
                    <TextInput
                        style={styles.input}
                        placeholder='Isikan kategori objek'
                        value={category}
                        onChangeText={setCategory}
                    />

                    <Text style={styles.inputTitle}>Koordinat</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: -6.200000,106.816666"
                        value={location}
                        onChangeText={setLocation}
                    />

                    <Text style={styles.inputTitle}>Akurasi</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Contoh: 5 m"
                        value={accuration}
                        onChangeText={setAccuration}
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#e21998' }]}
                        onPress={getCoordinates}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Current Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#e21998' }]}
                        onPress={handleUpdate}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    input: {
        height: 50,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#e21998',
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#FFF0F7',
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    inputTitle: {
        marginLeft: 16,
        marginTop: 16,
        fontSize: 16,
        fontWeight: '700',
        color: '#e21998',
    },
    button: {
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    }
});

export default App;
