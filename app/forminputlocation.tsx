import React, { useState } from 'react';
import { Alert, Text, TextInput, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";

const App = () => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [accuration, setAccuration] = useState('');
    const [category, setCategory] = useState(''); // state baru untuk category

    // Get current location
    const getCoordinates = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
        }

        let locationData = await Location.getCurrentPositionAsync({});
        const coords = locationData.coords.latitude + ',' + locationData.coords.longitude;
        setLocation(coords);

        const accuracy = locationData.coords.accuracy;
        setAccuration(accuracy + ' m');
    };

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

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    return (
        <SafeAreaProvider style={{ backgroundColor: '#FFF0F7' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <Stack.Screen options={{ title: 'Form Input Location' }} />
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

                    {/* Tombol Get Current Location */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#e21998' }]}
                        onPress={getCoordinates}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Current Location</Text>
                    </TouchableOpacity>

                    {/* Tombol Save */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#e21998' }]}
                        onPress={() => {
                            if (!name || !location || !category) {
                                Alert.alert('Error', 'Nama, Koordinat, dan Category harus diisi!');
                                return;
                            }
                            const locationsRef = ref(db, 'points/');
                            push(locationsRef, {
                                name,
                                category, // menyertakan category
                                coordinates: location,
                                accuration
                            }).then(() => {
                                Alert.alert('Sukses', 'Data berhasil disimpan!');
                                // reset semua field
                                setName('');
                                setCategory('');
                                setLocation('');
                                setAccuration('');
                            }).catch((e) => {
                                console.error("Error adding document: ", e);
                                Alert.alert("Error", "Gagal menyimpan data");
                            });
                        }}
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
