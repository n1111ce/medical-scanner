import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  SafeAreaView, Alert, Share,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePatientStore } from '../store/usePatientStore';
import { generateCSV } from '../utils/csvExport';
import { Patient } from '../types';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Patients'> };

export default function PatientsScreen({ navigation }: Props) {
  const patients = usePatientStore(s => s.patients);
  const deletePatient = usePatientStore(s => s.deletePatient);
  const [expanded, setExpanded] = useState<string | null>(null);

  const exportCSV = async () => {
    if (patients.length === 0) {
      Alert.alert('No data', 'No patients to export.');
      return;
    }
    const csv = generateCSV(patients);
    const path = FileSystem.documentDirectory + `mediscan_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Patients CSV' });
    } else {
      Alert.alert('Saved', `CSV saved to:\n${path}`);
    }
  };

  const confirmDelete = (p: Patient) => {
    Alert.alert('Delete?', `Remove patient ${p.patientId || 'unknown'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePatient(p.uid) },
    ]);
  };

  const renderItem = ({ item: p }: { item: Patient }) => {
    const isOpen = expanded === p.uid;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isOpen ? null : p.uid)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardId}>ID: {p.patientId || '—'}</Text>
            <Text style={styles.cardSub}>{p.hospital}  ·  {p.collectionDate}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardChevron}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </View>

        {isOpen && (
          <View style={styles.cardBody}>
            <Row label="Age" value={p.age} />
            <Row label="LMP" value={p.lmp} />
            <Text style={styles.hbHeader}>CBC Readings ({p.hbReadings.length})</Text>
            {p.hbReadings.map((r, i) => (
              <View key={i} style={styles.hbRowCard}>
                <Text style={styles.hbValCard}>#{i + 1}  {r.hbValue} g/dL</Text>
                <Text style={styles.hbDateCard}>{r.date}{r.time ? `  ${r.time}` : ''}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(p)}>
              <Text style={styles.deleteBtnTxt}>Delete Patient</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Patients  ({patients.length})</Text>
        <TouchableOpacity onPress={exportCSV}>
          <Text style={styles.exportBtn}>CSV ↑</Text>
        </TouchableOpacity>
      </View>

      {patients.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No patients collected yet.</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={p => p.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoVal}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1A237E',
  },
  back: { color: '#fff', fontSize: 18 },
  topTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  exportBtn: { color: '#FFD54F', fontSize: 14, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#999', fontSize: 16 },
  list: { padding: 14, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardId: { fontSize: 16, fontWeight: '800', color: '#1A237E' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardChevron: { color: '#888', fontSize: 14 },
  cardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { width: 60, fontSize: 13, fontWeight: '600', color: '#888' },
  infoVal: { flex: 1, fontSize: 14, color: '#333' },
  hbHeader: { fontSize: 12, fontWeight: '700', color: '#555', marginTop: 8, marginBottom: 6, textTransform: 'uppercase' },
  hbRowCard: {
    backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 6, marginBottom: 4,
  },
  hbValCard: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  hbDateCard: { fontSize: 11, color: '#555', marginTop: 1 },
  deleteBtn: {
    marginTop: 12, backgroundColor: '#FFEBEE', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  deleteBtnTxt: { color: '#C62828', fontWeight: '700', fontSize: 14 },
});
