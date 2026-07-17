import { useState, useCallback } from 'react';
import { View, Text, Image, FlatList, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function FeedScreen({ navigation }) {
  const [media, setMedia] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { walletBalance, refreshWallet, logout } = useAuth();

  async function loadFeed() {
    const res = await client.get('/media/feed');
    setMedia(res.data);
  }

  // useFocusEffect (not just useEffect) so the feed re-fetches every time you come back
  // to this screen - e.g. after unlocking something on the detail screen, the lock icon updates.
  useFocusEffect(
    useCallback(() => {
      loadFeed();
      refreshWallet();
    }, [])
  );

  async function onRefresh() {
    setIsRefreshing(true);
    await loadFeed();
    setIsRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.balance}>💰 {walletBalance} coins</Text>
        <Pressable onPress={logout}><Text style={styles.logout}>Logout</Text></Pressable>
      </View>

      <FlatList
        data={media}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('MediaDetail', { item })}>
            <Image source={{ uri: `${API_BASE_URL}${item.previewUrl}` }} style={styles.thumbnail} />
            <View style={styles.cardInfo}>
              <Text style={styles.price}>{item.price} coins</Text>
              <Text style={item.isUnlocked ? styles.unlocked : styles.locked}>
                {item.isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
              </Text>
            </View>
          </Pressable>
        )}
      />

      <Pressable style={styles.uploadButton} onPress={() => navigation.navigate('Upload')}>
        <Text style={styles.uploadButtonText}>+ Upload</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  balance: { fontSize: 16, fontWeight: '600' },
  logout: { color: '#c00' },
  card: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  thumbnail: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#eee' },
  cardInfo: { marginLeft: 12, justifyContent: 'center' },
  price: { fontSize: 16, fontWeight: '600' },
  unlocked: { color: 'green', marginTop: 4 },
  locked: { color: '#888', marginTop: 4 },
  uploadButton: { backgroundColor: '#111', padding: 16, alignItems: 'center' },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
});
