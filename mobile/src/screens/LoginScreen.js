import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [isRegisterMode, setIsRegisterMode] = useState(false); // toggles which endpoint we call below
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';
      const res = await client.post(endpoint, { email, password });
      await login(res.data.token, res.data.walletBalance); // saves token + flips AppNavigator into the logged-in stack
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Media Locker</Text>

      <TextInput
  style={styles.input}
  placeholder="Email"
  placeholderTextColor="#888"
  value={email}
  onChangeText={setEmail}
  autoCapitalize="none"
  keyboardType="email-address"
/>
<TextInput
  style={styles.input}
  placeholder="Password"
  placeholderTextColor="#888"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
/>

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isRegisterMode ? 'Register' : 'Login'}</Text>
      </Pressable>

      <Pressable onPress={() => setIsRegisterMode(!isRegisterMode)}>
        <Text style={styles.toggleText}>
          {isRegisterMode ? 'Already have an account? Login' : "Don't have an account? Register"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, color: '#000' },
  button: { backgroundColor: '#111', padding: 14, borderRadius: 8, marginTop: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  toggleText: { textAlign: 'center', marginTop: 16, color: '#555' },
});
