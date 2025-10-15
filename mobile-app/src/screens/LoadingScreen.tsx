import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen: React.FC = () => {
  return (
    <LinearGradient
      colors={['#007AFF', '#0056CC']}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.text}>Loading SalesSync...</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
});

export default LoadingScreen;