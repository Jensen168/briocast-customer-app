import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://api.briolabs.io';

export default function LoginScreen({ navigation, setUserToken }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('錯誤', '請輸入電子郵件和密碼');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Check for token (API returns message, not success)
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setUserToken(data.token);
      } else {
        Alert.alert('登入失敗', data.error || '請檢查您的帳號密碼');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接伺服器，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="tv" size={48} color="#007AFF" />
            </View>
            <Text style={styles.logoText}>brioCAST</Text>
            <Text style={styles.tagline}>數位看板管理平台</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Text style={styles.title}>登入帳號</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="電子郵件"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="密碼"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>登入</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>忘記密碼？</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>還沒有帳號？</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>立即註冊</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  tagline: { fontSize: 14, color: '#666', marginTop: 4 },
  form: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 24, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 52,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  loginButton: {
    backgroundColor: '#007AFF', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  loginButtonDisabled: { backgroundColor: '#99c9ff' },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  forgotPassword: { alignItems: 'center', marginTop: 16 },
  forgotPasswordText: { color: '#007AFF', fontSize: 14 },
  registerContainer: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingVertical: 16,
  },
  registerText: { color: '#666', fontSize: 16 },
  registerLink: { color: '#007AFF', fontSize: 16, fontWeight: '600', marginLeft: 4 },
});
