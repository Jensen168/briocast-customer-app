// screens/RevenueScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, ActivityIndicator
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
  period: string;
  impressions: number;
  gross: number;
  fee: number;
  net: number;
  status: string;
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
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch revenue summary
      const revenueRes = await fetch(`${API_BASE}/api/ads/revenue?period=${period}`, { headers });
      const revenueData = await revenueRes.json();
      
      if (revenueData.success) {
        setSummary({
          totalEarnings: revenueData.summary?.netRevenue || 0,
          thisMonth: revenueData.summary?.netRevenue || 0,
          lastMonth: 0,
          pending: revenueData.summary?.netRevenue || 0,
          totalImpressions: revenueData.summary?.impressions || 0,
          avgCPM: revenueData.summary?.impressions > 0 
            ? (revenueData.summary?.grossRevenue / revenueData.summary?.impressions * 1000) 
            : 0,
        });
        setDailyData(revenueData.daily || []);
      }

      // Fetch payout history
      const payoutsRes = await fetch(`${API_BASE}/api/ads/revenue/payouts`, { headers });
      const payoutsData = await payoutsRes.json();
      
      if (payoutsData.success) {
        setPayouts(payoutsData.payouts || []);
      }
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRevenueData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    if (amount < 1) return `NT$${amount.toFixed(3)}`;
    return `NT$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'eligible': return '#10B981';
      case 'paid': return '#10B981';
      case 'processing': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'eligible': return '可提領';
      case 'paid': return '已付款';
      case 'processing': return '處理中';
      case 'below_threshold': return '未達門檻';
      default: return '待處理';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
{/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
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
          <Text style={styles.mainLabel}>本期淨收益 (70%)</Text>
          <Text style={styles.mainAmount}>{formatCurrency(summary.thisMonth)}</Text>
          
          <View style={styles.mainStats}>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>{formatNumber(summary.totalImpressions)}</Text>
              <Text style={styles.mainStatLabel}>曝光次數</Text>
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
          {(['day', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'day' ? '今日' : p === 'week' ? '本週' : '本月'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Breakdown */}
        {dailyData.length > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>每日明細</Text>
            {dailyData.slice(0, 7).map((day, index) => (
              <View key={index} style={styles.dailyRow}>
                <Text style={styles.dailyDate}>{day.date}</Text>
                <View style={styles.dailyStats}>
                  <Text style={styles.dailyImpressions}>{day.impressions} 次曝光</Text>
                  <Text style={styles.dailyRevenue}>{formatCurrency(day.revenue)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Revenue Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>收益分潤說明</Text>
            <Text style={styles.infoText}>
              廣告收益按 70/30 分潤：您獲得 70%，平台收取 30% 服務費。{'\n'}
              最低提領金額：NT$500
            </Text>
          </View>
        </View>

        {/* Payout History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>月度結算紀錄</Text>
          </View>
          {payouts.length > 0 ? (
            payouts.slice(0, 6).map((payout, index) => (
              <View key={index} style={styles.payoutItem}>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutPeriod}>{payout.period}</Text>
                  <View style={[styles.payoutStatus, { backgroundColor: getStatusColor(payout.status) + '20' }]}>
                    <Text style={[styles.payoutStatusText, { color: getStatusColor(payout.status) }]}>
                      {getStatusText(payout.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.payoutDetails}>
                  <Text style={styles.payoutImpressions}>{payout.impressions} 次</Text>
                  <Text style={styles.payoutAmount}>{formatCurrency(payout.net)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyPayouts}>
              <Ionicons name="receipt-outline" size={40} color="#ccc" />
              <Text style={styles.emptyPayoutsText}>尚無結算紀錄</Text>
              <Text style={styles.emptyPayoutsSubtext}>開始播放廣告後，收益將顯示於此</Text>
            </View>
          )}
        </View>

        {/* Request Payout Button */}
        {summary.pending >= 500 && (
          <TouchableOpacity style={styles.payoutButton}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.payoutButtonText}>申請提領 {formatCurrency(summary.pending)}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>最低提領金額：NT$500</Text>
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
    fontSize: 36,
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
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dailyDate: {
    fontSize: 14,
    color: '#666',
  },
  dailyStats: {
    alignItems: 'flex-end',
  },
  dailyImpressions: {
    fontSize: 12,
    color: '#999',
  },
  dailyRevenue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
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
  payoutDetails: {
    alignItems: 'flex-end',
  },
  payoutImpressions: {
    fontSize: 12,
    color: '#999',
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
  emptyPayoutsSubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
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
