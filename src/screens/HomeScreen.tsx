import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Modal, Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HOSPITALS } from '../constants/hospitals';
import { usePatientStore } from '../store/usePatientStore';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const [selectedHospital, setSelectedHospital] = useState(HOSPITALS[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const loadPatients = usePatientStore(s => s.loadPatients);
  const patientCount = usePatientStore(s => s.patients.length);

  useEffect(() => { loadPatients(); }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>MediScan</Text>
        <Text style={styles.subtitle}>CBC & Patient Data Collector</Text>

        <Text style={styles.label}>Hospital</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setPickerVisible(true)}>
          <Text style={styles.pickerText}>{selectedHospital}</Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            navigation.navigate('Collection', { hospital: selectedHospital });
          }}
        >
          <Text style={styles.primaryBtnText}>＋  Add New Patient</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Patients')}
        >
          <Text style={styles.secondaryBtnText}>
            Show Collected Data  ({patientCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hospital picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Select Hospital</Text>
          <FlatList
            data={HOSPITALS}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sheetItem, item === selectedHospital && styles.sheetItemActive]}
                onPress={() => { setSelectedHospital(item); setPickerVisible(false); }}
              >
                <Text style={[styles.sheetItemText, item === selectedHospital && styles.sheetItemActiveText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 28, justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: '#1A237E', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C5CAE9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerText: { fontSize: 16, color: '#222' },
  pickerArrow: { fontSize: 14, color: '#888' },
  spacer: { flex: 1 },
  primaryBtn: {
    backgroundColor: '#1A237E',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A237E',
  },
  secondaryBtnText: { color: '#1A237E', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  sheetTitle: {
    fontSize: 16, fontWeight: '700', color: '#333',
    textAlign: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  sheetItem: {
    paddingVertical: 14, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  sheetItemActive: { backgroundColor: '#E8EAF6' },
  sheetItemText: { fontSize: 16, color: '#333' },
  sheetItemActiveText: { color: '#1A237E', fontWeight: '700' },
});
