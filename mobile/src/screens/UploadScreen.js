import { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';

export default function UploadScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow gallery access to pick an image');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleUpload() {
    const priceNumber = Number(price);
    if (!imageUri || !Number.isInteger(priceNumber) || priceNumber < 0) {
      Alert.alert('Missing info', 'Pick an image and enter a valid whole-number price');
      return;
    }

    // multipart/form-data body - the shape multer.single('image') on the backend expects
    const formData = new FormData();
    formData.append('image', { uri: imageUri, name: 'upload.jpg', type: 'image/jpeg' });
    formData.append('price', String(priceNumber));

    setIsSubmitting(true);
    try {
      await client.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigation.goBack(); // back to Feed, which re-fetches automatically via useFocusEffect
    } catch (err) {
      Alert.alert('Upload failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.picker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <Text style={styles.pickerText}>Tap to select an image</Text>
        )}
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder="Unlock price (coins)"
        value={price}
        onChangeText={setPrice}
        keyboardType="number-pad"
      />

      <Pressable style={styles.button} onPress={handleUpload} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Publishing...' : 'Publish'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  picker: { height: 220, borderRadius: 12, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  pickerText: { color: '#888' },
  preview: { width: '100%', height: '100%' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  button: { backgroundColor: '#111', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
