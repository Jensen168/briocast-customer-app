import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

export default function CreatePlaylistScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMedia(data.media || []);
      }
    } catch (error) {
      console.log('Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const toggleMediaSelection = (id: string) => {
    setSelectedMedia(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const createPlaylist = async () => {
    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入播放清單名稱');
      return;
    }

    setCreating(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name, 
          items: selectedMedia.map((id, index) => ({
            media_id: id,
            order: index,
            duration: 10
          }))
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('成功', '播放清單已建立', [
          { text: '確定', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('錯誤', data.error || '建立失敗');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接伺服器');
    } finally {
      setCreating(false);
    }
  };

  const renderMediaItem = ({ item }: { item: any }) => {
    const isSelected = selectedMedia.includes(item.id);
    const selectionIndex = selectedMedia.indexOf(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.mediaItem, isSelected && styles.mediaItemSelected]}
        onPress={() => toggleMediaSelection(item.id)}
      >
        <Image 
          source={{ uri: `${API_BASE}${item.url}` }} 
          style={styles.mediaThumbnail}
        />
        {isSelected && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionNumber}>{selectionIndex + 1}</Text>
          </View>
        )}
        <View style={styles.checkmark}>
          <Ionicons 
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} 
            size={24} 
            color={isSelected ? '#34C759' : '#ccc'} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Playlist Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>播放清單名稱</Text>
          <TextInput
            style={styles.input}
            placeholder="輸入名稱"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Media Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>選擇媒體內容</Text>
          <Text style={styles.sectionSubtitle}>
            已選擇 {selectedMedia.length} 個項目（點擊選取，數字代表播放順序）
          </Text>
          
          {loading ? (
            <ActivityIndicator color="#007AFF" style={{ marginVertical: 40 }} />
          ) : media.length === 0 ? (
            <View style={styles.emptyMedia}>
              <Ionicons name="images-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>尚無媒體內容</Text>
              <Text style={styles.emptySubtext}>請先上傳圖片或影片</Text>
            </View>
          ) : (
            <FlatList
              data={media}
              renderItem={renderMediaItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.mediaGrid}
            />
          )}
        </View>

        {/* Selected Preview */}
        {selectedMedia.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>播放順序預覽</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMedia.map((id, index) => {
                const item = media.find(m => m.id === id);
                if (!item) return null;
                return (
                  <View key={id} style={styles.previewItem}>
                    <Image 
                      source={{ uri: `${API_BASE}${item.url}` }} 
                      style={styles.previewImage}
                    />
                    <Text style={styles.previewNumber}>{index + 1}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createButton, (!name.trim() || creating) && styles.createButtonDisabled]}
          onPress={createPlaylist}
          disabled={!name.trim() || creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>建立播放清單</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { backgroundColor: '#fff', marginTop: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 16,
  },
  mediaGrid: { paddingTop: 8 },
  mediaItem: {
    flex: 1/3, aspectRatio: 1, margin: 4, borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#f0f0f0', position: 'relative',
  },
  mediaItemSelected: { borderWidth: 3, borderColor: '#007AFF' },
  mediaThumbnail: { width: '100%', height: '100%' },
  selectionBadge: {
    position: 'absolute', top: 4, left: 4,
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
  },
  selectionNumber: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  checkmark: { position: 'absolute', bottom: 4, right: 4 },
  emptyMedia: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#bbb', marginTop: 4 },
  previewItem: { marginRight: 12, alignItems: 'center' },
  previewImage: { width: 60, height: 60, borderRadius: 8 },
  previewNumber: {
    fontSize: 12, color: '#007AFF', fontWeight: '600', marginTop: 4,
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  createButton: {
    backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  createButtonDisabled: { backgroundColor: '#99c9ff' },
  createButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
