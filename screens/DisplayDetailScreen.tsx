import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

export default function DisplayDetailScreen({ route, navigation }: any) {
  const { display } = route.params;
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedPlaylist, setAssignedPlaylist] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

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
    }
  };

  const assignPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/displays/${display.id}/assign-playlist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playlistId })
      });
      const data = await response.json();
      if (data.success) {
        setAssignedPlaylist(playlistId);
        Alert.alert('成功', `已指派「${playlistName}」到此螢幕`);
      } else {
        Alert.alert('錯誤', data.error || '指派失敗');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接伺服器');
    }
  };

  const deleteDisplay = () => {
    Alert.alert('確認刪除', `確定要刪除「${display.name}」嗎？此操作無法復原。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/api/content/displays/${display.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('成功', '螢幕已刪除');
              navigation.goBack();
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Display Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="tv" size={32} color="#007AFF" />
            </View>
            <View style={[styles.statusBadge, display.status === 'online' ? styles.online : styles.offline]}>
              <View style={[styles.statusDot, display.status === 'online' ? styles.dotOnline : styles.dotOffline]} />
              <Text style={styles.statusText}>{display.status === 'online' ? '在線' : '離線'}</Text>
            </View>
          </View>
          
          <Text style={styles.displayName}>{display.name}</Text>
          <Text style={styles.displayLocation}>
            <Ionicons name="location-outline" size={14} color="#666" /> {display.location || '未設定位置'}
          </Text>
        </View>

        {/* Pairing Code */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>配對碼</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{display.registration_code || 'N/A'}</Text>
          </View>
          <Text style={styles.codeHint}>在播放器 App 輸入此配對碼以連接螢幕</Text>
        </View>

        {/* Device Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>設備資訊</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>設備 ID</Text>
            <Text style={styles.infoValue}>{display.id.substring(0, 8)}...</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>建立時間</Text>
            <Text style={styles.infoValue}>{new Date(display.created_at).toLocaleDateString('zh-TW')}</Text>
          </View>
        </View>

        {/* Assign Playlist */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>指派播放清單</Text>
          {loading ? (
            <ActivityIndicator color="#007AFF" style={{ marginVertical: 20 }} />
          ) : playlists.length === 0 ? (
            <View style={styles.emptyPlaylists}>
              <Text style={styles.emptyText}>尚無播放清單</Text>
              <TouchableOpacity 
                style={styles.createPlaylistButton}
                onPress={() => navigation.navigate('CreatePlaylist')}
              >
                <Ionicons name="add" size={18} color="#007AFF" />
                <Text style={styles.createPlaylistText}>建立播放清單</Text>
              </TouchableOpacity>
            </View>
          ) : (
            playlists.map(playlist => (
              <TouchableOpacity
                key={playlist.id}
                style={[
                  styles.playlistItem,
                  assignedPlaylist === playlist.id && styles.playlistItemActive
                ]}
                onPress={() => assignPlaylist(playlist.id, playlist.name)}
              >
                <Ionicons 
                  name={assignedPlaylist === playlist.id ? 'checkmark-circle' : 'play-circle-outline'} 
                  size={24} 
                  color={assignedPlaylist === playlist.id ? '#34C759' : '#007AFF'} 
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{playlist.name}</Text>
                  <Text style={styles.playlistMeta}>{playlist.item_count || 0} 個項目</Text>
                </View>
                {assignedPlaylist === playlist.id && (
                  <Text style={styles.assignedBadge}>已指派</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={deleteDisplay}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteText}>刪除此螢幕</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16,
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconContainer: {
    width: 60, height: 60, borderRadius: 15, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 12,
  },
  online: { backgroundColor: '#E8F5E9' },
  offline: { backgroundColor: '#FFEBEE' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotOnline: { backgroundColor: '#34C759' },
  dotOffline: { backgroundColor: '#FF3B30' },
  statusText: { fontSize: 13, fontWeight: '500' },
  displayName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 16 },
  displayLocation: { fontSize: 14, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  codeContainer: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 16, alignItems: 'center',
  },
  codeText: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', letterSpacing: 4 },
  codeHint: { fontSize: 12, color: '#999', marginTop: 8, textAlign: 'center' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, color: '#333' },
  emptyPlaylists: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: '#999', marginBottom: 12 },
  createPlaylistButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  createPlaylistText: { color: '#007AFF', fontWeight: '600', marginLeft: 4 },
  playlistItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 8,
  },
  playlistItemActive: { backgroundColor: '#E8F5E9' },
  playlistInfo: { flex: 1, marginLeft: 12 },
  playlistName: { fontSize: 15, fontWeight: '500', color: '#333' },
  playlistMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  assignedBadge: {
    fontSize: 12, color: '#34C759', fontWeight: '500',
    backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 24, padding: 16,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#FF3B30',
  },
  deleteText: { color: '#FF3B30', fontSize: 16, fontWeight: '500', marginLeft: 8 },
});
