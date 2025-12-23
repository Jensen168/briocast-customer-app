// screens/DisplaysScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

interface Display {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  registration_code: string;
  last_seen?: string;
  playlist_name?: string;
}

export default function DisplaysScreen({ navigation }: any) {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDisplay, setNewDisplay] = useState({ name: '', location: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDisplays();
  }, []);

  const fetchDisplays = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/displays`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success || data.displays) {
        setDisplays(data.displays || []);
      }
    } catch (error) {
      console.error('Failed to fetch displays:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDisplays();
    setRefreshing(false);
  }, []);

  const createDisplay = async () => {
    if (!newDisplay.name.trim()) {
      Alert.alert('錯誤', '請輸入螢幕名稱');
      return;
    }

    setCreating(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/displays`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDisplay.name,
          location: newDisplay.location || '未設定',
        }),
      });

      const data = await response.json();
      if (data.success || data.display) {
        setShowAddModal(false);
        setNewDisplay({ name: '', location: '' });
        fetchDisplays();
        Alert.alert('成功', `螢幕已建立\n配對碼: ${data.display.registration_code}`);
      } else {
        Alert.alert('錯誤', data.error || '建立失敗');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接伺服器');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? '#10B981' : '#EF4444';
  };

  const getTimeSince = (dateString?: string) => {
    if (!dateString) return '從未連線';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return '剛剛';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
    return `${Math.floor(diff / 86400)} 天前`;
  };

  const renderDisplay = ({ item }: { item: Display }) => (
    <TouchableOpacity
      style={styles.displayCard}
      onPress={() => navigation.navigate('DisplayDetail', { display: item })}
    >
      <View style={styles.displayHeader}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <View style={styles.displayInfo}>
          <Text style={styles.displayName}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.displayLocation}>{item.location || '未設定'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>

      <View style={styles.displayDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="tv-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.status === 'online' ? '在線' : '離線'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{getTimeSince(item.last_seen)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="list-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.playlist_name || '無播放清單'}</Text>
        </View>
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>配對碼</Text>
        <Text style={styles.codeValue}>{item.registration_code}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="tv-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>尚無螢幕</Text>
      <Text style={styles.emptyText}>點擊右上角「+」新增您的第一台螢幕</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>螢幕管理</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{displays.length}</Text>
          <Text style={styles.statLabel}>總數</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {displays.filter(d => d.status === 'online').length}
          </Text>
          <Text style={styles.statLabel}>在線</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {displays.filter(d => d.status !== 'online').length}
          </Text>
          <Text style={styles.statLabel}>離線</Text>
        </View>
      </View>

      {/* Display List */}
      <FlatList
        data={displays}
        renderItem={renderDisplay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmpty : null}
      />

      {/* Add Display Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>新增螢幕</Text>
            <TouchableOpacity onPress={createDisplay} disabled={creating}>
              <Text style={[styles.modalSave, creating && { opacity: 0.5 }]}>
                {creating ? '建立中...' : '建立'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>螢幕名稱 *</Text>
            <TextInput
              style={styles.input}
              placeholder="例：大廳螢幕"
              value={newDisplay.name}
              onChangeText={(text) => setNewDisplay({ ...newDisplay, name: text })}
            />

            <Text style={styles.inputLabel}>位置</Text>
            <TextInput
              style={styles.input}
              placeholder="例：台北市信義區"
              value={newDisplay.location}
              onChangeText={(text) => setNewDisplay({ ...newDisplay, location: text })}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                建立螢幕後，您將獲得一組配對碼。在播放器設備上輸入此配對碼即可完成連線。
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  list: {
    padding: 16,
  },
  displayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  displayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  displayInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  displayLocation: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  displayDetails: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  codeLabel: {
    fontSize: 13,
    color: '#666',
  },
  codeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 12,
    lineHeight: 20,
  },
});
