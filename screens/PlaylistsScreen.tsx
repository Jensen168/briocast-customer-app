// screens/PlaylistsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

export default function PlaylistsScreen({ navigation }: any) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchPlaylists(); }, []);

  const fetchPlaylists = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.playlists) setPlaylists(data.playlists);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlaylists();
    setRefreshing(false);
  }, []);

  const renderPlaylist = ({ item }: any) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="list" size={24} color="#007AFF" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            {item.items?.length || 0} 項目 · {item.assigned_displays?.length || 0} 台螢幕
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={playlists}
        renderItem={renderPlaylist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="list-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>尚無播放清單</Text>
          </View>
        }
      />
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePlaylist')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, color: '#999', marginTop: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
