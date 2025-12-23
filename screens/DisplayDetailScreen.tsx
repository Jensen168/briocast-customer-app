// screens/DisplayDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

export default function DisplayDetailScreen({ route, navigation }: any) {
  const { display } = route.params;
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(display.playlist_id);

  useEffect(() => {
    fetchPlaylists();
  }, []);

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

  const assignPlaylist = async (playlistId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_BASE}/api/content/displays/${display.id}/playlist`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playlist_id: playlistId }),
      });
      setSelectedPlaylist(playlistId);
      Alert.alert('成功', '播放清單已指派');
    } catch (error) {
      Alert.alert('錯誤', '指派失敗');
    }
  };

  const deleteDisplay = () => {
    Alert.alert('刪除螢幕', '確定要刪除此螢幕嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await fetch(`${API_BASE}/api/content/displays/${display.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            navigation.goBack();
          } catch (error) {
            Alert.alert('錯誤', '刪除失敗');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusDot, { 
            backgroundColor: display.status === 'online' ? '#10B981' : '#EF4444' 
          }]} />
          <Text style={styles.statusText}>
            {display.status === 'online' ? '在線' : '離線'}
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>螢幕資訊</Text>
          <View style={styles.infoCard}>
            <InfoRow label="名稱" value={display.name} />
            <InfoRow label="位置" value={display.location || '未設定'} />
            <InfoRow label="ID" value={display.id} />
            <InfoRow label="配對碼" value={display.registration_code} highlight />
          </View>
        </View>

        {/* Playlist Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>播放清單</Text>
          <View style={styles.playlistList}>
            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={[
                  styles.playlistItem,
                  selectedPlaylist === playlist.id && styles.playlistItemSelected,
                ]}
                onPress={() => assignPlaylist(playlist.id)}
              >
                <Ionicons 
                  name={selectedPlaylist === playlist.id ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={selectedPlaylist === playlist.id ? "#007AFF" : "#ccc"} 
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{playlist.name}</Text>
                  <Text style={styles.playlistCount}>
                    {playlist.items?.length || 0} 個項目
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {playlists.length === 0 && (
              <Text style={styles.emptyText}>尚無播放清單</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.actionText}>重新整理螢幕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>編輯螢幕資訊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={deleteDisplay}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>刪除螢幕</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value, highlight }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && styles.infoHighlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusText: { fontSize: 16, fontWeight: '600', color: '#333' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 15, color: '#666' },
  infoValue: { fontSize: 15, color: '#333', fontWeight: '500' },
  infoHighlight: { color: '#007AFF', fontFamily: 'monospace' },
  playlistList: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12 },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playlistItemSelected: { backgroundColor: '#E3F2FD' },
  playlistInfo: { marginLeft: 12 },
  playlistName: { fontSize: 16, color: '#333', fontWeight: '500' },
  playlistCount: { fontSize: 13, color: '#666', marginTop: 2 },
  emptyText: { padding: 20, textAlign: 'center', color: '#999' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  actionText: { fontSize: 16, color: '#007AFF', marginLeft: 12 },
  deleteButton: { marginTop: 16 },
});
