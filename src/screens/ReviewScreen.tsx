import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePatientStore } from '../store/usePatientStore';
import { RootStackParamList } from '../../App';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Review'> };

export default function ReviewScreen({ navigation }: Props) {
  const form = usePatientStore(s => s.form);
  const setFieldCaptured = usePatientStore(s => s.setFieldCaptured);
  const setFieldStatus = usePatientStore(s => s.setFieldStatus);
  const submitForm = usePatientStore(s => s.submitForm);
  const removeHBReading = usePatientStore(s => s.removeHBReading);
  const setHBStatus = usePatientStore(s => s.setHBStatus);

  const [editId, setEditId] = useState(form.patientId.value);
  const [editAge, setEditAge] = useState(form.age.value);
  const [editLmp, setEditLmp] = useState(form.lmp.value);

  const confirmedHBs = form.hbReadings.filter(r => r.status === 'confirmed');

  const handleSave = () => {
    if (!editId.trim() && !editAge.trim()) {
      Alert.alert('Missing data', 'Please capture at least Patient ID or Age before saving.');
      return;
    }
    // push edits back into store
    if (editId !== form.patientId.value) {
      setFieldCaptured('patientId', editId);
      setFieldStatus('patientId', 'confirmed');
    }
    if (editAge !== form.age.value) {
      setFieldCaptured('age', editAge);
      setFieldStatus('age', 'confirmed');
    }
    if (editLmp !== form.lmp.value) {
      setFieldCaptured('lmp', editLmp);
      setFieldStatus('lmp', 'confirmed');
    }
    const patient = submitForm();
    if (patient) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };

  const fieldRow = (label: string, value: string, onEdit: (v: string) => void, status: string) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, status === 'confirmed' && styles.fieldConfirmed]}
        value={value}
        onChangeText={onEdit}
      />
      <View style={[styles.dot, { backgroundColor: status === 'confirmed' ? '#4CAF50' : status === 'captured' ? '#2196F3' : '#ccc' }]} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Review Patient</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.section}>Basic Info</Text>
        {fieldRow('Patient ID', editId, setEditId, form.patientId.status)}
        {fieldRow('Age', editAge, setEditAge, form.age.status)}
        {fieldRow('LMP', editLmp, setEditLmp, form.lmp.status)}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hospital</Text>
          <Text style={styles.infoVal}>{form.hospital}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Collection Date</Text>
          <Text style={styles.infoVal}>{form.collectionDate}</Text>
        </View>

        <Text style={[styles.section, { marginTop: 24 }]}>
          CBC / HB Readings  ({confirmedHBs.length})
        </Text>

        {confirmedHBs.length === 0 && (
          <Text style={styles.emptyNote}>No HB readings confirmed. Go back to add some.</Text>
        )}

        {confirmedHBs.map((r, i) => (
          <View key={r.id} style={styles.hbRow}>
            <Text style={styles.hbIndex}>#{i + 1}</Text>
            <View style={styles.hbData}>
              <Text style={styles.hbVal}>{r.hbValue} g/dL</Text>
              <Text style={styles.hbSub}>{r.date}{r.time ? `  ${r.time}` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => removeHBReading(r.id)}>
              <Text style={styles.removeHB}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelTxt}>← Edit More</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveTxt}>Save Patient</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  scroll: { flex: 1 },
  content: { padding: 20 },
  section: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  fieldLabel: { width: 80, fontSize: 13, fontWeight: '600', color: '#444' },
  fieldInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1.5,
    borderColor: '#C5CAE9', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
  },
  fieldConfirmed: { borderColor: '#4CAF50' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoLabel: { width: 120, fontSize: 13, fontWeight: '600', color: '#666' },
  infoVal: { flex: 1, fontSize: 14, color: '#333' },
  emptyNote: { color: '#999', fontSize: 13, fontStyle: 'italic', marginBottom: 12 },
  hbRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    marginBottom: 8, elevation: 1, gap: 10,
  },
  hbIndex: { fontSize: 13, fontWeight: '700', color: '#888', width: 24 },
  hbData: { flex: 1 },
  hbVal: { fontSize: 16, fontWeight: '700', color: '#1A237E' },
  hbSub: { fontSize: 12, color: '#666', marginTop: 2 },
  removeHB: { color: '#E53935', fontSize: 18, padding: 4 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  cancelBtn: {
    flex: 1, backgroundColor: '#eee', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  cancelTxt: { fontWeight: '700', color: '#555' },
  saveBtn: {
    flex: 2, backgroundColor: '#1A237E', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  saveTxt: { fontWeight: '800', color: '#fff', fontSize: 16 },
});
