import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'https://api.briolabs.io';

export default function DisplaysScreen() {
  const navigation = useNavigation();
  const [displays, setDisplays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchDisplays = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/content/displays`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDisplays(data.displays || []);
      }
    } catch (error) {
      console.log('Failed to fetch displays');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDisplays();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDisplays();
  }, []);

  const createDisplay = async () => {
    if (!newName.trim()) {
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName, location: newLocation })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('成功', `螢幕已建立\n配對碼: ${data.display.registration_code}`);
        setModalVisible(false);
        setNewName('');
        setNewLocation('');
        fetchDisplays();
      } else {
        Alert.alert('錯誤', data.error || '建立失敗');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接伺服器');
    } finally {
      setCreating(false);
    }
  };

  const deleteDisplay = async (id: string, name: string) => {
    Alert.alert('確認刪除', `確定要刪除「${name}」嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/api/content/displays/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('成功', '螢幕已刪除');
              fetchDisplays();
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

  const stats = {
    total: displays.length,
    online: displays.filter(d => d.status === 'online').length,
    offline: displays.filter(d => d.status !== 'online').length,
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.displayCard}
      onPress={() => navigation.navigate('DisplayDetail' as never, { display: item } as never)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="tv-outline" size={24} color="#007AFF" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.displayName}>{item.name}</Text>
          <Text style={styles.displayLocation}>{item.location || '未設定位置'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteDisplay(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, item.status === 'online' ? styles.online : styles.offline]}>
          <View style={[styles.statusDot, item.status === 'online' ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusText}>{item.status === 'online' ? '在線' : '離線'}</Text>
        </View>
        <Text style={styles.codeText}>配對碼: {item.registration_code || 'N/A'}</Text>
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
        <Text style={styles.title}>螢幕管理</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>總數</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.online}</Text>
          <Text style={styles.statLabel}>在線</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{stats.offline}</Text>
          <Text style={styles.statLabel}>離線</Text>
        </View>
      </View>

      {/* Display List */}
      {displays.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="tv-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>尚無螢幕</Text>
          <Text style={styles.emptySubtext}>點擊右上角「+」新增您的第一台螢幕</Text>
        </View>
      ) : (
        <FlatList
          data={displays}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancel}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>新增螢幕</Text>
              <TouchableOpacity onPress={createDisplay} disabled={creating}>
                <Text style={[styles.modalSave, creating && { opacity: 0.5 }]}>建立</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>螢幕名稱 *</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：大廳螢幕"
              value={newName}
              onChangeText={setNewName}
            />
            
            <Text style={styles.inputLabel}>位置</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：1樓大廳"
              value={newLocation}
              onChangeText={setNewLocation}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                建立後會產生配對碼，在播放器 App 輸入配對碼即可連接播放
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20,
    borderRadius: 12, padding: 16, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e0e0e0' },
  list: { paddingHorizontal: 20 },
  displayCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  displayName: { fontSize: 16, fontWeight: '600', color: '#333' },
  displayLocation: { fontSize: 13, color: '#666', marginTop: 2 },
  deleteButton: { padding: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  online: { backgroundColor: '#E8F5E9' },
  offline: { backgroundColor: '#FFEBEE' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotOnline: { backgroundColor: '#34C759' },
  dotOffline: { backgroundColor: '#FF3B30' },
  statusText: { fontSize: 12, fontWeight: '500' },
  codeText: { fontSize: 12, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalCancel: { fontSize: 16, color: '#666' },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSave: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#E3F2FD', borderRadius: 10,
    padding: 12, marginTop: 24, alignItems: 'flex-start',
  },
  infoText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#333', lineHeight: 18 },
});
