import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

export default function ContentScreen() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMedia();
  }, []);

  const pickAndUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('權限不足', '請允許存取相簿');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploading(true);
      const asset = result.assets[0];
      const token = await AsyncStorage.getItem('userToken');

      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: asset.mimeType || type,
      } as any);

      const response = await fetch(`${API_BASE}/api/content/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      
      // Check for success - handle both success:true and presence of media object
      if (data.success || data.media) {
        Alert.alert('成功', '上傳成功！');
        fetchMedia();
      } else {
        Alert.alert('錯誤', data.error || '上傳失敗，請稍後再試');
      }
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert('錯誤', '上傳失敗，請稍後再試');
    } finally {
      setUploading(false);
    }
  };

  const getFilteredMedia = () => {
    if (filter === 'all') return media;
    return media.filter(m => m.type === filter);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.mediaCard}>
      <Image
        source={{ uri: `${API_BASE}${item.url}` }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.mediaInfo}>
        <Ionicons 
          name={item.type === 'video' ? 'videocam' : 'image'} 
          size={14} 
          color="#666" 
        />
        <Text style={styles.mediaSize}>{formatSize(item.size)}</Text>
      </View>
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
        <Text style={styles.title}>媒體庫</Text>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={pickAndUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>上傳</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: '全部' },
          { key: 'image', label: '圖片' },
          { key: 'video', label: '影片' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterText, filter === tab.key && styles.filterTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.countText}>共 {getFilteredMedia().length} 個項目</Text>

      {/* Media Grid */}
      {getFilteredMedia().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>尚無媒體內容</Text>
          <Text style={styles.emptySubtext}>點擊上傳按鈕新增圖片或影片</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredMedia()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
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
  uploadButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  uploadButtonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  filterContainer: {
    flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#e0e0e0', marginRight: 8,
  },
  filterTabActive: { backgroundColor: '#007AFF' },
  filterText: { color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  countText: { paddingHorizontal: 20, color: '#666', marginBottom: 12 },
  grid: { paddingHorizontal: 12 },
  mediaCard: {
    flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 12,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  thumbnail: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  mediaInfo: {
    flexDirection: 'row', alignItems: 'center', padding: 8,
  },
  mediaSize: { color: '#666', fontSize: 12, marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8 },
});
