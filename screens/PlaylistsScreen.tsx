import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'https://api.briolabs.io';

export default function PlaylistsScreen() {
  const navigation = useNavigation();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlaylists = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/playlists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPlaylists(data.playlists || []);
      }
    } catch (error) {
      console.log('Failed to fetch playlists');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPlaylists();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlaylists();
  }, []);

  const deletePlaylist = async (id: string, name: string) => {
    Alert.alert('確認刪除', `確定要刪除「${name}」嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/api/content/playlists/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('成功', '播放清單已刪除');
              fetchPlaylists();
            } else {
              Alert.alert('錯誤', data.error || '刪除失敗');
            }
          } catch (error) {
            Alert.alert('錯誤', '無法連接伺服器');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.playlistCard}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="list" size={24} color="#007AFF" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.playlistName}>{item.name}</Text>
          <Text style={styles.playlistMeta}>
            {item.item_count || 0} 個項目 • {item.duration || '0:00'}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deletePlaylist(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>播放清單</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('CreatePlaylist' as never)}
        >
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.countText}>共 {playlists.length} 個清單</Text>

      {/* Playlist List */}
      {playlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>尚無播放清單</Text>
          <Text style={styles.emptySubtext}>建立播放清單來組織您的媒體內容</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('CreatePlaylist' as never)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>建立播放清單</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  addButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
  },
  countText: { paddingHorizontal: 20, color: '#666', marginBottom: 12 },
  list: { paddingHorizontal: 20 },
  playlistCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { marginLeft: 12, flex: 1 },
  playlistName: { fontSize: 16, fontWeight: '600', color: '#333' },
  playlistMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  deleteButton: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' },
  createButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, marginTop: 24,
  },
  createButtonText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
});
