import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ setUserToken }: any) {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [offlineAlerts, setOfflineAlerts] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) setUser(JSON.parse(userData));
  };

  const handleLogout = () => {
    Alert.alert(
      '登出',
      '確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '登出',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            setUserToken(null);
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#007AFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color="#ccc" />)}
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>設定</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Account Settings */}
        <SettingSection title="帳號設定">
          <SettingItem
            icon="person-outline"
            title="個人資料"
            subtitle="編輯姓名、電話等資訊"
            onPress={() => {}}
          />
          <SettingItem
            icon="business-outline"
            title="組織資料"
            subtitle="管理您的機構資訊"
            onPress={() => {}}
          />
          <SettingItem
            icon="card-outline"
            title="付款方式"
            subtitle="設定收款帳戶"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Notification Settings */}
        <SettingSection title="通知設定">
          <SettingItem
            icon="notifications-outline"
            title="推播通知"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              />
            }
          />
          <SettingItem
            icon="wifi-outline"
            title="螢幕離線提醒"
            subtitle="螢幕離線時收到通知"
            rightElement={
              <Switch
                value={offlineAlerts}
                onValueChange={setOfflineAlerts}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              />
            }
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="支援">
          <SettingItem
            icon="help-circle-outline"
            title="使用說明"
            onPress={() => Linking.openURL('https://briolabs.io/help')}
          />
          <SettingItem
            icon="chatbubble-outline"
            title="聯絡客服"
            onPress={() => Linking.openURL('mailto:support@briolabs.io')}
          />
          <SettingItem
            icon="document-text-outline"
            title="服務條款"
            onPress={() => Linking.openURL('https://briolabs.io/terms')}
          />
        </SettingSection>

        {/* App Info */}
        <SettingSection title="關於">
          <SettingItem
            icon="information-circle-outline"
            title="版本"
            subtitle="1.0.0 (Build 1)"
          />
        </SettingSection>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>brioCAST by Brio Labs</Text>
          <Text style={styles.footerText}>© 2025 TiKOUS Inc.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '600', color: '#333' },
  profileEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginLeft: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, color: '#333' },
  settingSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444', marginLeft: 8 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 12, color: '#999', marginTop: 4 },
});
