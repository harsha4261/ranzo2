import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Colors, Spacing, Radius } from '@/core/theme';
import { RanzoButton, RanzoTextField } from '@/core/widgets';
import { createBooking } from '@/core/api/bookings';

const SERVICES = [
  'Carpenter', 'Electrician', 'Plumber', 'AC Technician',
  'Painter', 'Cleaner', 'Geyser Repair', 'TV Repair', 'Appliance Repair'
];

export default function BookScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [houseFlat, setHouseFlat] = useState('');
  const [landmark, setLandmark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetectLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied.');
        return;
      }

      let locationCoords = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: locationCoords.coords.latitude,
        longitude: locationCoords.coords.longitude,
      });

      if (geocode.length > 0) {
        const place = geocode[0];
        const address = [place.city, place.region, place.country].filter(Boolean).join(', ');
        setLocation(address);
        setLatitude(locationCoords.coords.latitude);
        setLongitude(locationCoords.coords.longitude);
      } else {
        setError('Could not determine address from location.');
      }
    } catch (e: any) {
      setError('Failed to fetch location: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!latitude || !longitude || !location) {
      setError('Please detect your location');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        category,
        location: { latitude, longitude },
        address_details: {
          house_flat: houseFlat || 'Not specified',
          landmark: landmark || 'Not specified',
          city: location.split(',')[0] || 'Unknown',
          zip_code: '000000'
        },
        problem_description: `Request for ${category}`,
        urgency_level: 'NORMAL'
      };

      await createBooking(payload);
      // Go back to dashboard to see active booking
      router.replace('/customer/(tabs)');
    } catch (e: any) {
      setError('Booking failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Book a Service</Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.label}>Select Category</Text>
        <View style={styles.grid}>
          {SERVICES.map((s) => (
            <Pressable
              key={s}
              style={[styles.catItem, category === s && styles.catItemActive]}
              onPress={() => setCategory(s)}
            >
              <Text style={[styles.catText, category === s && styles.catTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: Spacing.xl }]}>Location</Text>
        <View style={styles.locationRow}>
          <View style={styles.locationInputWrap}>
            <RanzoTextField
              value={location}
              onChangeText={() => {}}
              placeholder="Detect location..."
              editable={false}
            />
          </View>
          <Pressable style={styles.detectBtn} onPress={handleDetectLocation}>
            <Ionicons name="location" size={24} color={Colors.white} />
          </Pressable>
        </View>

        <Text style={[styles.label, { marginTop: Spacing.xl }]}>Address Details</Text>
        <View style={styles.inputWrap}>
          <RanzoTextField
            value={houseFlat}
            onChangeText={setHouseFlat}
            placeholder="House/Flat No."
          />
        </View>
        <View style={[styles.inputWrap, { marginTop: Spacing.md }]}>
          <RanzoTextField
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Landmark (Optional)"
          />
        </View>

        <View style={styles.actionWrap}>
          <RanzoButton label="Find Technicians" onPress={handleBook} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surfaceWhite },
  container: { padding: Spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: Spacing.xl },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surfaceCanvas,
  },
  catItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: { fontSize: 14, color: Colors.inkBody },
  catTextActive: { color: Colors.white, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  locationInputWrap: { flex: 1 },
  detectBtn: {
    height: 56, width: 56,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: {
    backgroundColor: Colors.surfaceCanvas,
    borderRadius: Radius.md,
  },
  actionWrap: { marginTop: Spacing.xxl },
  errorText: { color: Colors.danger, marginBottom: Spacing.md },
});
