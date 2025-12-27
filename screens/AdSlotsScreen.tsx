// screens/AdSlotsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const API_BASE = 'https://api.briolabs.io';

interface AdSlot {
  id: string;
  display_id: string;
  slot_name: string;
  slot_type: string;
  position: string;
  base_cpm_ntd: number;
  max_duration_seconds: number;
  is_active: number;
  monthly_impressions?: number;
  monthly_revenue?: number;
  created_at: string;
}

interface Display {
  id: string;
  name: string;
  location: string;
}

export default function AdSlotsScreen({ navigation }: any) {
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [selectedDisplay, setSelectedDisplay] = useState('');
  const [slotName, setSlotName] = useState('');
  const [slotType, setSlotType] = useState('banner');
  const [position, setPosition] = useState('bottom');
  const [baseCpm, setBaseCpm] = useState('50');
  const [maxDuration, setMaxDuration] = useState('15');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [slotsRes, displaysRes] = await Promise.all([
        fetch(`${API_BASE}/api/ads/slots`, { headers }),
        fetch(`${API_BASE}/api/content/displays`, { headers }),
      ]);

      const slotsData = await slotsRes.json();
      const displaysData = await displaysRes.json();

      if (slotsData.success) setSlots(slotsData.slots || []);
      if (displaysData.success) setDisplays(displaysData.displays || []);
    } catch (error) {
      console.log('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const createSlot = async () => {
    if (!selectedDisplay) {
      Alert.alert('錯誤', '請選擇螢幕');
      return;
    }
    if (!slotName.trim()) {
      Alert.alert('錯誤', '請輸入版位名稱');
      return;
    }

    setCreating(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/ads/slots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayId: selectedDisplay,
          name: slotName,
          slotType,
          position,
          baseCpm: parseFloat(baseCpm) || 50,
          maxDuration: parseInt(maxDuration) || 15,
        })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('成功', '廣告版位已建立');
        setModalVisible(false);
        resetForm();
        fetchData();
      } else {
        Alert.alert('錯誤', data.error || '建立失敗');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接伺服器');
    } finally {
      setCreating(false);
    }
  };

  const toggleSlotActive = async (slot: AdSlot) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_BASE}/api/ads/slots/${slot.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: slot.is_active ? 0 : 1 })
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      Alert.alert('錯誤', '更新失敗');
    }
  };

  const deleteSlot = async (slot: AdSlot) => {
    Alert.alert('確認刪除', `確定要刪除「${slot.slot_name}」嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE}/api/ads/slots/${slot.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
              Alert.alert('成功', '版位已刪除');
              fetchData();
            }
          } catch (error) {
            Alert.alert('錯誤', '刪除失敗');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setSelectedDisplay('');
    setSlotName('');
    setSlotType('banner');
    setPosition('bottom');
    setBaseCpm('50');
    setMaxDuration('15');
  };

  const getDisplayName = (displayId: string) => {
    const display = displays.find(d => d.id === displayId);
    return display ? `${display.name} (${display.location || '無位置'})` : '未知螢幕';
  };

  const getSlotTypeLabel = (type: string) => {
    switch (type) {
      case 'banner': return '橫幅廣告';
      case 'interstitial': return '插頁廣告';
      case 'overlay': return '覆蓋廣告';
      default: return type;
    }
  };

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'top': return '頂部';
      case 'bottom': return '底部';
      case 'left': return '左側';
      case 'right': return '右側';
      case 'fullscreen': return '全螢幕';
      default: return pos;
    }
  };

  const formatCurrency = (amount: number) => `NT$${(amount || 0).toFixed(2)}`;

  const renderSlot = ({ item }: { item: AdSlot }) => (
    <View style={styles.slotCard}>
      <View style={styles.slotHeader}>
        <View style={styles.slotIcon}>
          <Ionicons 
            name={item.slot_type === 'banner' ? 'tablet-landscape' : 'phone-portrait'} 
            size={24} 
            color="#007AFF" 
          />
        </View>
        <View style={styles.slotInfo}>
          <Text style={styles.slotName}>{item.slot_name}</Text>
          <Text style={styles.slotDisplay}>{getDisplayName(item.display_id)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, item.is_active ? styles.toggleActive : styles.toggleInactive]}
          onPress={() => toggleSlotActive(item)}
        >
          <Text style={styles.toggleText}>{item.is_active ? '啟用' : '停用'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slotDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>類型</Text>
          <Text style={styles.detailValue}>{getSlotTypeLabel(item.slot_type)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>位置</Text>
          <Text style={styles.detailValue}>{getPositionLabel(item.position)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>CPM</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.base_cpm_ntd)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>時長</Text>
          <Text style={styles.detailValue}>{item.max_duration_seconds}秒</Text>
        </View>
      </View>

      <View style={styles.slotStats}>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.monthly_impressions || 0} 次曝光/月</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="cash-outline" size={16} color="#10B981" />
          <Text style={[styles.statText, { color: '#10B981' }]}>
            {formatCurrency(item.monthly_revenue || 0)}/月
          </Text>
        </View>
      </View>

      <View style={styles.slotActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => deleteSlot(item)}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>刪除</Text>
        </TouchableOpacity>
      </View>
    </View>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>廣告版位管理</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          廣告版位定義螢幕上可播放廣告的區域。設定 CPM 價格來控制您的廣告收益。
        </Text>
      </View>

      {/* Slots List */}
      {slots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="grid-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>尚無廣告版位</Text>
          <Text style={styles.emptySubtext}>建立版位開始賺取廣告收益</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.emptyButtonText}>建立第一個版位</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={slots}
          renderItem={renderSlot}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCancel}>取消</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>新增廣告版位</Text>
                  <TouchableOpacity onPress={createSlot} disabled={creating}>
                    <Text style={[styles.modalSave, creating && { opacity: 0.5 }]}>建立</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>選擇螢幕 *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedDisplay}
                    onValueChange={setSelectedDisplay}
                    style={styles.picker}
                  >
                    <Picker.Item label="請選擇螢幕..." value="" />
                    {displays.map((display) => (
                      <Picker.Item
                        key={display.id}
                        label={`${display.name} (${display.location || '無位置'})`}
                        value={display.id}
                      />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.inputLabel}>版位名稱 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="例如：底部橫幅廣告"
                  value={slotName}
                  onChangeText={setSlotName}
                />

                <Text style={styles.inputLabel}>廣告類型</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={slotType}
                    onValueChange={setSlotType}
                    style={styles.picker}
                  >
                    <Picker.Item label="橫幅廣告 Banner" value="banner" />
                    <Picker.Item label="插頁廣告 Interstitial" value="interstitial" />
                    <Picker.Item label="覆蓋廣告 Overlay" value="overlay" />
                  </Picker>
                </View>

                <Text style={styles.inputLabel}>顯示位置</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={position}
                    onValueChange={setPosition}
                    style={styles.picker}
                  >
                    <Picker.Item label="底部" value="bottom" />
                    <Picker.Item label="頂部" value="top" />
                    <Picker.Item label="左側" value="left" />
                    <Picker.Item label="右側" value="right" />
                    <Picker.Item label="全螢幕" value="fullscreen" />
                  </Picker>
                </View>

                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>CPM 價格 (NT$)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="50"
                      value={baseCpm}
                      onChangeText={setBaseCpm}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>最長時間 (秒)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="15"
                      value={maxDuration}
                      onChangeText={setMaxDuration}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="bulb" size={20} color="#F59E0B" />
                  <Text style={styles.infoBoxText}>
                    CPM = 每千次曝光價格。建議設定 NT$30-100 以獲得最佳廣告填充率。
                  </Text>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backButton: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#333', marginLeft: 12 },
  addButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row', backgroundColor: '#E3F2FD', marginHorizontal: 16,
    borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center',
  },
  infoText: { flex: 1, marginLeft: 10, fontSize: 13, color: '#1565C0', lineHeight: 18 },
  list: { paddingHorizontal: 16 },
  slotCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  slotHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  slotIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center',
  },
  slotInfo: { flex: 1, marginLeft: 12 },
  slotName: { fontSize: 16, fontWeight: '600', color: '#333' },
  slotDisplay: { fontSize: 13, color: '#666', marginTop: 2 },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  toggleActive: { backgroundColor: '#10B98120' },
  toggleInactive: { backgroundColor: '#EF444420' },
  toggleText: { fontSize: 12, fontWeight: '600' },
  slotDetails: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  detailItem: { width: '50%', marginBottom: 8 },
  detailLabel: { fontSize: 12, color: '#999' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#333' },
  slotStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  statText: { fontSize: 13, color: '#666', marginLeft: 6 },
  slotActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  actionText: { fontSize: 13, marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' },
  emptyButton: {
    backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 8, marginTop: 20,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 60 },
  keyboardAvoid: { paddingHorizontal: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalCancel: { fontSize: 16, color: '#666' },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSave: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 16 },
  pickerContainer: { backgroundColor: '#f5f5f5', borderRadius: 10, overflow: 'hidden' },
  picker: { height: 50 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#FEF3C7', borderRadius: 10,
    padding: 12, marginTop: 20, marginBottom: 20, alignItems: 'flex-start',
  },
  infoBoxText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#92400E', lineHeight: 18 },
});
