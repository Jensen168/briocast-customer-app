// screens/RevenueScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';
const { width } = Dimensions.get('window');

interface RevenueSummary {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pending: number;
  totalImpressions: number;
  avgCPM: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed';
  period: string;
  paid_at?: string;
}

export default function RevenueScreen({ navigation }: any) {
  const [summary, setSummary] = useState<RevenueSummary>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    totalImpressions: 0,
    avgCPM: 0,
  });
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [revenueRes, payoutsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/ads/revenue?period=${period}`, { headers }),
        fetch(`${API_BASE}/api/ads/payouts`, { headers }),
      ]);

      if (revenueRes.status === 'fulfilled') {
        const data = await revenueRes.value.json();
        if (data.success || data.summary) {
          setSummary({
            totalEarnings: data.summary?.totalEarnings || 0,
            thisMonth: data.summary?.netRevenue || data.summary?.thisMonth || 0,
            lastMonth: data.summary?.lastMonthRevenue || 0,
            pending: data.summary?.pendingPayout || 0,
            totalImpressions: data.summary?.impressions || 0,
            avgCPM: data.summary?.avgCPM || 0,
          });
        }
      }

      if (payoutsRes.status === 'fulfilled') {
        const data = await payoutsRes.value.json();
        if (data.payouts) {
          setPayouts(data.payouts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRevenueData();
    setRefreshing(false);
  }, [period]);

  const formatCurrency = (amount: number) => `NT$${amount.toLocaleString()}`;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'processing': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已付款';
      case 'processing': return '處理中';
      default: return '待處理';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>廣告收益</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => navigation.navigate('AdSlots')}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Main Revenue Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>累積總收益</Text>
          <Text style={styles.mainAmount}>{formatCurrency(summary.totalEarnings)}</Text>
          
          <View style={styles.mainStats}>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>{formatNumber(summary.totalImpressions)}</Text>
              <Text style={styles.mainStatLabel}>總曝光次數</Text>
            </View>
            <View style={styles.mainStatDivider} />
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>{formatCurrency(summary.avgCPM)}</Text>
              <Text style={styles.mainStatLabel}>平均 CPM</Text>
            </View>
          </View>
        </View>

        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          {(['week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'week' ? '本週' : p === 'month' ? '本月' : '今年'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="trending-up" size={20} color="#10B981" />
              </View>
              <Text style={styles.breakdownLabel}>本月收益</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(summary.thisMonth)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: '#6B728020' }]}>
                <Ionicons name="time" size={20} color="#6B7280" />
              </View>
              <Text style={styles.breakdownLabel}>上月收益</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(summary.lastMonth)}</Text>
            </View>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="wallet" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.breakdownLabel}>待結算</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(summary.pending)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="eye" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.breakdownLabel}>本月曝光</Text>
              <Text style={styles.breakdownValue}>{formatNumber(summary.totalImpressions)}</Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>收益計算方式</Text>
            <Text style={styles.infoText}>
              您的螢幕每顯示一次廣告即產生收益。收益按 CPM（每千次曝光成本）計算，您可獲得廣告收益的 60%。
            </Text>
          </View>
        </View>

        {/* Payout History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>付款紀錄</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>查看全部</Text>
            </TouchableOpacity>
          </View>

          {payouts.length > 0 ? (
            payouts.slice(0, 5).map((payout) => (
              <View key={payout.id} style={styles.payoutItem}>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutPeriod}>{payout.period}</Text>
                  <View style={[styles.payoutStatus, { backgroundColor: getStatusColor(payout.status) + '20' }]}>
                    <Text style={[styles.payoutStatusText, { color: getStatusColor(payout.status) }]}>
                      {getStatusText(payout.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.payoutAmount}>{formatCurrency(payout.amount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyPayouts}>
              <Ionicons name="receipt-outline" size={40} color="#ccc" />
              <Text style={styles.emptyPayoutsText}>尚無付款紀錄</Text>
            </View>
          )}
        </View>

        {/* Request Payout Button */}
        {summary.pending >= 1000 && (
          <TouchableOpacity style={styles.payoutButton}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.payoutButtonText}>申請提領</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>最低提領金額：NT$1,000</Text>
          <Text style={styles.footerText}>結算週期：每月 15 日</Text>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  helpButton: {
    padding: 4,
  },
  mainCard: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  mainLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  mainAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  mainStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    marginTop: 16,
  },
  mainStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  mainStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mainStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  mainStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  periodTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  periodTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  periodTabActive: {
    backgroundColor: '#333',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
  },
  periodTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  breakdownItem: {
    flex: 1,
    padding: 12,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  payoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutPeriod: {
    fontSize: 15,
    color: '#333',
    marginRight: 12,
  },
  payoutStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payoutStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyPayouts: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyPayoutsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  payoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
