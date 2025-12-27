import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import DisplaysScreen from './screens/DisplaysScreen';
import DisplayDetailScreen from './screens/DisplayDetailScreen';
import ContentScreen from './screens/ContentScreen';
import PlaylistsScreen from './screens/PlaylistsScreen';
import CreatePlaylistScreen from './screens/CreatePlaylistScreen';
import RevenueScreen from './screens/RevenueScreen';
import SettingsScreen from './screens/SettingsScreen';
import UploadContentScreen from './screens/UploadContentScreen';
import AdSlotsScreen from './screens/AdSlotsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ setUserToken }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Displays') iconName = focused ? 'tv' : 'tv-outline';
          else if (route.name === 'Content') iconName = focused ? 'images' : 'images-outline';
          else if (route.name === 'Playlists') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Revenue') iconName = focused ? 'cash' : 'cash-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首頁' }} />
      <Tab.Screen name="Displays" component={DisplaysScreen} options={{ title: '螢幕' }} />
      <Tab.Screen name="Content" component={ContentScreen} options={{ title: '內容' }} />
      <Tab.Screen name="Playlists" component={PlaylistsScreen} options={{ title: '播放' }} />
      <Tab.Screen name="Settings" options={{ title: '設定' }}>
        {(props) => <SettingsScreen {...props} setUserToken={setUserToken} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    } catch (error) {
      console.log('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken === null ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} setUserToken={setUserToken} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {(props) => <RegisterScreen {...props} setUserToken={setUserToken} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs">
              {(props) => <MainTabs {...props} setUserToken={setUserToken} />}
            </Stack.Screen>
            <Stack.Screen 
              name="DisplayDetail" 
              component={DisplayDetailScreen}
              options={{ headerShown: true, title: '螢幕詳情' }}
            />
            <Stack.Screen
              name="CreatePlaylist"
              component={CreatePlaylistScreen}
              options={{ headerShown: true, title: '建立播放清單' }}
            />
            <Stack.Screen
              name="UploadContent"
              component={UploadContentScreen}
              options={{ headerShown: true, title: '上傳內容' }}
            />
            <Stack.Screen
              name="AdSlots"
              component={AdSlotsScreen}
              options={{ headerShown: false, title: '廣告版位' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
