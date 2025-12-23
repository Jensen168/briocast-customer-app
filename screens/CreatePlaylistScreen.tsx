// screens/CreatePlaylistScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

export default function CreatePlaylistScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.media) setMedia(data.media);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const savePlaylist = async () => {
    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入播放清單名稱');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('錯誤', '請至少選擇一個內容');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          items: selectedIds.map((id, index) => ({
            media_id: id,
            order_index: index,
            duration: 10,
          })),
        }),
      });

      const data = await response.json();
      if (data.success || data.playlist) {
        Alert.alert('成功', '播放清單已建立', [
          { text: '確定', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('錯誤', data.error || '建立失敗');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接伺服器');
    } finally {
      setSaving(false);
    }
  };

  const renderMediaItem = ({ item }: any) => {
    const isSelected = selectedIds.includes(item.id);
    const imageUrl = item.url?.startsWith('http') ? item.url : `${API_BASE}${item.url}`;

    return (
      <TouchableOpacity
        style={[styles.mediaItem, isSelected && styles.mediaItemSelected]}
        onPress={() => toggleSelection(item.id)}
      >
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedNumber}>
              {selectedIds.indexOf(item.id) + 1}
            </Text>
          </View>
        )}
        <Text style={styles.mediaName} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.form}>
        <Text style={styles.label}>播放清單名稱</Text>
        <TextInput
          style={styles.input}
          placeholder="輸入名稱"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.mediaSection}>
        <Text style={styles.sectionTitle}>
          選擇內容 ({selectedIds.length} 已選)
        </Text>
        <FlatList
          data={media}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.mediaGrid}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.7 }]}
        onPress={savePlaylist}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? '儲存中...' : '建立播放清單'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  mediaSection: { flex: 1 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    padding: 16,
  },
  mediaGrid: { padding: 8 },
  mediaItem: {
    flex: 1/3,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  mediaItemSelected: { borderWidth: 2, borderColor: '#007AFF' },
  thumbnail: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNumber: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  mediaName: { padding: 8, fontSize: 12, color: '#333' },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
