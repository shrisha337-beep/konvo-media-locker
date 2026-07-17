import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import FeedScreen from '../screens/FeedScreen';
import UploadScreen from '../screens/UploadScreen';
import MediaDetailScreen from '../screens/MediaDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null; // brief splash-less pause while we check SecureStore on launch

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {token ? (
          // Logged in: these three screens, Feed is the entry point
          <>
            <Stack.Screen name="Feed" component={FeedScreen} />
            <Stack.Screen name="Upload" component={UploadScreen} />
            <Stack.Screen name="MediaDetail" component={MediaDetailScreen} options={{ title: 'Media' }} />
          </>
        ) : (
          // Logged out: only Login is reachable
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
