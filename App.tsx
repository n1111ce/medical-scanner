import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import PatientsScreen from './src/screens/PatientsScreen';

export type RootStackParamList = {
  Home: undefined;
  Collection: { hospital: string };
  Review: undefined;
  Patients: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Collection" component={CollectionScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="Patients" component={PatientsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
