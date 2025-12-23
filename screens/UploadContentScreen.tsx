// screens/UploadContentScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const API_BASE = 'https://api.briolabs.io';

export default function UploadContentScreen({ navigation }: any) {
  const [selectedAssets, setSelectedAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('權限不足', '請允許存取相簿');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      setSelectedAssets(result.assets);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('權限不足', '請允許使用相機');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedAssets([...selectedAssets, ...result.assets]);
    }
  };

  const removeAsset = (index: number) => {
    setSelectedAssets(selectedAssets.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (selectedAssets.length === 0) {
      Alert.alert('提示', '請先選擇要上傳的內容');
      return;
    }

    setUploading(true);
    const token = await AsyncStorage.getItem('userToken');
    let successCount = 0;

    for (let i = 0; i < selectedAssets.length; i++) {
      try {
        const asset = selectedAssets[i];
        const formData = new FormData();
        
        const filename = asset.uri.split('/').pop() || 'upload';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `${asset.type}/${match[1]}` : asset.type;

        formData.append('file', {
          uri: asset.uri,
          name: filename,
          type: type,
        } as any);

        await fetch(`${API_BASE}/api/content/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        successCount++;
        setUploadProgress(Math.round((i + 1) / selectedAssets.length * 100));
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setUploading(false);
    setUploadProgress(0);

    if (successCount === selectedAssets.length) {
      Alert.alert('成功', `已上傳 ${successCount} 個檔案`, [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('部分成功', `已上傳 ${successCount} / ${selectedAssets.length} 個檔案`);
    }

    setSelectedAssets([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        {/* Upload Options */}
        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.optionCard} onPress={pickImages}>
            <View style={[styles.optionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="images" size={32} color="#007AFF" />
            </View>
            <Text style={styles.optionTitle}>從相簿選擇</Text>
            <Text style={styles.optionSubtitle}>最多選擇 10 個檔案</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={takePhoto}>
            <View style={[styles.optionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="camera" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.optionTitle}>拍攝照片</Text>
            <Text style={styles.optionSubtitle}>使用相機拍攝</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Assets Preview */}
        {selectedAssets.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>
              已選擇 {selectedAssets.length} 個檔案
            </Text>
            <View style={styles.previewGrid}>
              {selectedAssets.map((asset, index) => (
                <View key={index} style={styles.previewItem}>
                  <Image source={{ uri: asset.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeAsset(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                  {asset.type === 'video' && (
                    <View style={styles.videoBadge}>
                      <Ionicons name="videocam" size={12} color="#fff" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            支援 JPG、PNG、GIF 圖片及 MP4 影片。{'\n'}
            建議圖片尺寸：1920 x 1080 (16:9)
          </Text>
        </View>
      </ScrollView>

      {/* Upload Button */}
      {selectedAssets.length > 0 && (
        <View style={styles.uploadBar}>
          {uploading ? (
            <View style={styles.progressContainer}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.progressText}>上傳中 {uploadProgress}%</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={uploadAll}>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>
                上傳 {selectedAssets.length} 個檔案
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  optionsRow: {
    flexDirection: 'row',
    padding: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  optionSubtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  previewSection: { padding: 16 },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  previewItem: {
    width: '25%',
    aspectRatio: 1,
    padding: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: { position: 'absolute', top: 0, right: 0 },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1565C0', marginLeft: 12, lineHeight: 18 },
  uploadBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  progressText: { marginLeft: 12, fontSize: 16, color: '#007AFF' },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', marginLeft: 8 },
});
