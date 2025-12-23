// screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

interface DashboardStats {
  displays: { total: number; online: number; offline: number };
  content: { total: number; images: number; videos: number };
  playlists: { total: number; active: number };
  revenue: { thisMonth: number; lastMonth: number; pending: number };
}

export default function HomeScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    displays: { total: 0, online: 0, offline: 0 },
    content: { total: 0, images: 0, videos: 0 },
    playlists: { total: 0, active: 0 },
    revenue: { thisMonth: 0, lastMonth: 0, pending: 0 },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    fetchDashboardStats();
  }, []);

  const loadUserData = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) setUser(JSON.parse(userData));
  };

  const fetchDashboardStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [displaysRes, contentRes, playlistsRes, revenueRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/content/displays`, { headers }),
        fetch(`${API_BASE}/api/content/media`, { headers }),
        fetch(`${API_BASE}/api/content/playlists`, { headers }),
        fetch(`${API_BASE}/api/ads/revenue?period=month`, { headers }),
      ]);

      const displays = displaysRes.status === 'fulfilled' ? await displaysRes.value.json() : { displays: [] };
      const content = contentRes.status === 'fulfilled' ? await contentRes.value.json() : { media: [] };
      const playlists = playlistsRes.status === 'fulfilled' ? await playlistsRes.value.json() : { playlists: [] };
      const revenue = revenueRes.status === 'fulfilled' ? await revenueRes.value.json() : { summary: {} };

      const displayList = displays.displays || [];
      const mediaList = content.media || [];
      const playlistList = playlists.playlists || [];

      setStats({
        displays: {
          total: displayList.length,
          online: displayList.filter((d: any) => d.status === 'online').length,
          offline: displayList.filter((d: any) => d.status !== 'online').length,
        },
        content: {
          total: mediaList.length,
          images: mediaList.filter((m: any) => m.type?.startsWith('image')).length,
          videos: mediaList.filter((m: any) => m.type?.startsWith('video')).length,
        },
        playlists: {
          total: playlistList.length,
          active: playlistList.filter((p: any) => p.assigned_displays?.length > 0).length,
        },
        revenue: {
          thisMonth: revenue.summary?.netRevenue || 0,
          lastMonth: revenue.summary?.lastMonthRevenue || 0,
          pending: revenue.summary?.pendingPayout || 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  }, []);

  const formatCurrency = (amount: number) => `NT$${amount.toLocaleString()}`;

  const StatCard = ({ title, value, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const QuickAction = ({ title, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>歡迎回來 👋</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Revenue Highlight */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueLabel}>本月廣告收益</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Revenue')}>
              <Text style={styles.revenueLink}>查看詳情 →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.revenueAmount}>{formatCurrency(stats.revenue.thisMonth)}</Text>
          <View style={styles.revenueDetails}>
            <View style={styles.revenueDetail}>
              <Text style={styles.revenueDetailLabel}>待結算</Text>
              <Text style={styles.revenueDetailValue}>{formatCurrency(stats.revenue.pending)}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueDetail}>
              <Text style={styles.revenueDetailLabel}>上月收益</Text>
              <Text style={styles.revenueDetailValue}>{formatCurrency(stats.revenue.lastMonth)}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>總覽</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="螢幕總數"
            value={stats.displays.total}
            subtitle={`${stats.displays.online} 在線`}
            icon="tv"
            color="#007AFF"
            onPress={() => navigation.navigate('Displays')}
          />
          <StatCard
            title="媒體內容"
            value={stats.content.total}
            subtitle={`${stats.content.images} 圖 / ${stats.content.videos} 影片`}
            icon="images"
            color="#8B5CF6"
            onPress={() => navigation.navigate('Content')}
          />
          <StatCard
            title="播放清單"
            value={stats.playlists.total}
            subtitle={`${stats.playlists.active} 使用中`}
            icon="list"
            color="#10B981"
            onPress={() => navigation.navigate('Playlists')}
          />
          <StatCard
            title="在線率"
            value={stats.displays.total > 0 
              ? `${Math.round(stats.displays.online / stats.displays.total * 100)}%` 
              : '0%'}
            subtitle={`${stats.displays.offline} 離線`}
            icon="wifi"
            color="#F59E0B"
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>快速操作</Text>
        <View style={styles.quickActions}>
          <QuickAction
            title="新增螢幕"
            icon="add-circle"
            color="#007AFF"
            onPress={() => navigation.navigate('Displays')}
          />
          <QuickAction
            title="上傳內容"
            icon="cloud-upload"
            color="#8B5CF6"
            onPress={() => navigation.navigate('UploadContent')}
          />
          <QuickAction
            title="建立清單"
            icon="create"
            color="#10B981"
            onPress={() => navigation.navigate('CreatePlaylist')}
          />
          <QuickAction
            title="緊急廣播"
            icon="megaphone"
            color="#EF4444"
            onPress={() => Alert.alert('緊急廣播', '此功能即將推出')}
          />
        </View>

        {/* Display Status */}
        {stats.displays.offline > 0 && (
          <View style={styles.alertCard}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>螢幕離線提醒</Text>
              <Text style={styles.alertText}>
                目前有 {stats.displays.offline} 台螢幕處於離線狀態
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Displays')}>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  revenueLink: {
    fontSize: 13,
    color: '#fff',
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 12,
  },
  revenueDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  revenueDetail: {
    flex: 1,
    alignItems: 'center',
  },
  revenueDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  revenueDetailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  revenueDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statCardInner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  alertText: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },
});
