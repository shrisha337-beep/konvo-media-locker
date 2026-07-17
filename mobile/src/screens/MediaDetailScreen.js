import { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { getToken } from '../utils/authStorage';

export default function MediaDetailScreen({ route }) {
  const { item } = route.params;
  const [isUnlocked, setIsUnlocked] = useState(item.isUnlocked);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [authHeader, setAuthHeader] = useState(null); // Image needs the raw header value, not just the token
  const { walletBalance, refreshWallet } = useAuth();

  // The original-image endpoint is authenticated, so <Image> needs the JWT attached
  // as a request header - React Native's Image component supports this via source.headers.
  useEffect(() => {
    (async () => {
      const token = await getToken();
      setAuthHeader({ Authorization: `Bearer ${token}` });
    })();
  }, []);

  async function handleUnlock() {
    setIsUnlocking(true);
    try {
      await client.post(`/media/${item.id}/unlock`);
      setIsUnlocked(true);
      await refreshWallet();
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong';
      Alert.alert('Unlock failed', message);
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <View style={styles.container}>
      {isUnlocked && authHeader ? (
        <Image
          source={{ uri: `${API_BASE_URL}/api/media/${item.id}/original`, headers: authHeader }}
          style={styles.image}
        />
      ) : (
        <Image source={{ uri: `${API_BASE_URL}${item.previewUrl}` }} style={styles.image} />
      )}

      <Text style={styles.price}>{item.price} coins</Text>

      {!isUnlocked && (
        <Pressable style={styles.button} onPress={handleUnlock} disabled={isUnlocking || walletBalance < item.price}>
          {isUnlocking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {walletBalance < item.price ? 'Not enough coins' : `Unlock for ${item.price} coins`}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  image: { width: '100%', height: 400, borderRadius: 12, backgroundColor: '#eee' },
  price: { fontSize: 20, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  button: { backgroundColor: '#111', padding: 14, borderRadius: 8, marginTop: 16 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
