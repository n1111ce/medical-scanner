import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Alert, Dimensions, Modal, TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { usePatientStore } from '../store/usePatientStore';
import ScanButton from '../components/ScanButton';
import HBReadingItem from '../components/HBReadingItem';
import { parseOCRText } from '../utils/ocrParser';

// ML Kit – loaded dynamically so the app still compiles without it during dev
let TextRecognition: any = null;
try { TextRecognition = require('@react-native-ml-kit/text-recognition').default; } catch {}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Collection'>;
  route: RouteProp<RootStackParamList, 'Collection'>;
};

const { width: SCREEN_W } = Dimensions.get('window');
const BUTTON_COL_W = 82;
const CAMERA_W = SCREEN_W - BUTTON_COL_W - 16;

export default function CollectionScreen({ navigation, route }: Props) {
  const { hospital } = route.params;
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugText, setDebugText] = useState('');
  const [lastOCR, setLastOCR] = useState('');
  const [hbPanelVisible, setHbPanelVisible] = useState(false);

  const form = usePatientStore(s => s.form);
  const initForm = usePatientStore(s => s.initForm);
  const setFieldCaptured = usePatientStore(s => s.setFieldCaptured);
  const setFieldStatus = usePatientStore(s => s.setFieldStatus);
  const addHBCaptured = usePatientStore(s => s.addHBCaptured);
  const setHBStatus = usePatientStore(s => s.setHBStatus);
  const removeHBReading = usePatientStore(s => s.removeHBReading);
  const submitForm = usePatientStore(s => s.submitForm);

  useEffect(() => {
    initForm(hospital);
    requestPermission();
  }, []);

  // Scanning loop – capture frame every 1.5s and run OCR
  useEffect(() => {
    if (!scanning || !TextRecognition) return;
    const interval = setInterval(async () => {
      try {
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.4,
          skipProcessing: true,
          exif: false,
        });
        if (!photo?.uri) return;
        const result = await TextRecognition.recognize(photo.uri);
        const raw = result.text ?? '';
        setLastOCR(raw);
        applyOCR(raw);
      } catch {}
    }, 1500);
    return () => clearInterval(interval);
  }, [scanning, form]);

  const applyOCR = useCallback((raw: string) => {
    const parsed = parseOCRText(raw);

    if (form.patientId.status === 'idle' && parsed.ids.length > 0) {
      setFieldCaptured('patientId', parsed.ids[0]);
    }
    if (form.age.status === 'idle' && parsed.ages.length > 0) {
      setFieldCaptured('age', parsed.ages[0]);
    }
    if (form.lmp.status === 'idle' && parsed.lmps.length > 0) {
      setFieldCaptured('lmp', parsed.lmps[0]);
    }
    for (const hb of parsed.hbReadings) {
      addHBCaptured(hb.value, hb.date ?? '', hb.time ?? '');
    }
  }, [form]);

  const runDebugOCR = () => {
    if (!debugText.trim()) return;
    applyOCR(debugText);
    setLastOCR(debugText);
    setDebugVisible(false);
  };

  const handleFieldPress = (field: 'patientId' | 'age' | 'lmp') => {
    const cur = form[field].status;
    if (cur === 'idle') return; // nothing captured yet
    if (cur === 'captured') setFieldStatus(field, 'confirmed');
    else if (cur === 'confirmed') setFieldStatus(field, 'idle');
  };

  const handleFinish = () => {
    setScanning(false);
    navigation.navigate('Review');
  };

  const confirmedHB = form.hbReadings.filter(r => r.status === 'confirmed').length;
  const capturedHB = form.hbReadings.length;

  const hbButtonStatus = capturedHB === 0 ? 'idle' : confirmedHB === capturedHB && capturedHB > 0 ? 'confirmed' : 'captured';

  if (!permission) return <View style={styles.center}><Text>Loading camera…</Text></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera permission needed</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnTxt}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{hospital}</Text>
        <TouchableOpacity onPress={() => { setScanning(false); setDebugVisible(true); }}>
          <Text style={styles.debugBtn}>DEBUG</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Camera */}
        <View style={[styles.cameraBox, { width: CAMERA_W }]}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          {!scanning && (
            <View style={styles.pausedOverlay}>
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.scanToggle}
            onPress={() => setScanning(v => !v)}
          >
            <Text style={styles.scanToggleTxt}>{scanning ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>

        {/* Buttons column */}
        <View style={styles.buttonCol}>
          <ScanButton
            label="ID"
            status={form.patientId.status}
            capturedValue={form.patientId.value}
            onPress={() => handleFieldPress('patientId')}
            width={BUTTON_COL_W - 6}
          />
          <ScanButton
            label="Age"
            status={form.age.status}
            capturedValue={form.age.value}
            onPress={() => handleFieldPress('age')}
            width={BUTTON_COL_W - 6}
          />
          <ScanButton
            label="LMP"
            status={form.lmp.status}
            capturedValue={form.lmp.value}
            onPress={() => handleFieldPress('lmp')}
            width={BUTTON_COL_W - 6}
          />
          <ScanButton
            label={`HB #\n${capturedHB > 0 ? `(${capturedHB})` : ''}`}
            status={hbButtonStatus}
            badge={capturedHB}
            onPress={() => setHbPanelVisible(true)}
            width={BUTTON_COL_W - 6}
          />
        </View>
      </View>

      {/* HB readings panel */}
      {hbPanelVisible && (
        <View style={styles.hbPanel}>
          <View style={styles.hbPanelHeader}>
            <Text style={styles.hbPanelTitle}>CBC / HB Readings</Text>
            <TouchableOpacity onPress={() => setHbPanelVisible(false)}>
              <Text style={styles.hbClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 220 }}>
            {form.hbReadings.length === 0 && (
              <Text style={styles.emptyHB}>No readings captured yet. Point camera at HB values.</Text>
            )}
            {form.hbReadings.map(r => (
              <HBReadingItem
                key={r.id}
                reading={r}
                onConfirm={() => setHBStatus(r.id, 'confirmed')}
                onRemove={() => removeHBReading(r.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Finish button */}
      <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
        <Text style={styles.finishBtnTxt}>Finish & Review →</Text>
      </TouchableOpacity>

      {/* Debug modal */}
      <Modal visible={debugVisible} animationType="slide" transparent>
        <View style={styles.debugModal}>
          <Text style={styles.debugTitle}>Debug OCR</Text>
          <Text style={styles.debugHint}>Paste screen text below to test field extraction</Text>
          <TextInput
            style={styles.debugInput}
            multiline
            value={debugText}
            onChangeText={setDebugText}
            placeholder="Paste OCR / screen text here…"
            textAlignVertical="top"
          />
          {lastOCR ? (
            <View style={styles.lastOCRBox}>
              <Text style={styles.lastOCRLabel}>Last live OCR:</Text>
              <ScrollView style={{ maxHeight: 80 }}>
                <Text style={styles.lastOCRText}>{lastOCR}</Text>
              </ScrollView>
            </View>
          ) : null}
          <View style={styles.debugActions}>
            <TouchableOpacity style={styles.debugCancel} onPress={() => { setDebugVisible(false); setScanning(true); }}>
              <Text style={styles.debugCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.debugRun} onPress={runDebugOCR}>
              <Text style={styles.debugRunTxt}>Run Parser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permText: { fontSize: 16, color: '#333', marginBottom: 16 },
  permBtn: { backgroundColor: '#1A237E', padding: 14, borderRadius: 10 },
  permBtnTxt: { color: '#fff', fontWeight: '700' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1A237E',
  },
  back: { color: '#fff', fontSize: 18 },
  topTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  debugBtn: { color: '#FFD54F', fontSize: 12, fontWeight: '700' },
  body: { flex: 1, flexDirection: 'row', padding: 8, gap: 8 },
  cameraBox: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  pausedText: { color: '#FFD54F', fontSize: 22, fontWeight: '800' },
  scanToggle: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20, width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  scanToggleTxt: { fontSize: 18 },
  buttonCol: {
    width: BUTTON_COL_W,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  hbPanel: {
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4,
    maxHeight: 300,
  },
  hbPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hbPanelTitle: { fontWeight: '800', fontSize: 15, color: '#1A237E' },
  hbClose: { fontSize: 18, color: '#555', padding: 4 },
  emptyHB: { color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  finishBtn: {
    backgroundColor: '#4CAF50', margin: 10, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  finishBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  debugModal: {
    flex: 1, backgroundColor: '#fff', margin: 20, marginTop: 60,
    borderRadius: 16, padding: 20, elevation: 10,
  },
  debugTitle: { fontSize: 18, fontWeight: '800', color: '#1A237E', marginBottom: 4 },
  debugHint: { fontSize: 12, color: '#777', marginBottom: 12 },
  debugInput: {
    flex: 1, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 10,
    padding: 12, fontSize: 13, fontFamily: 'monospace', marginBottom: 10,
  },
  lastOCRBox: {
    backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10, marginBottom: 10,
  },
  lastOCRLabel: { fontSize: 11, fontWeight: '700', color: '#555', marginBottom: 4 },
  lastOCRText: { fontSize: 11, color: '#333', fontFamily: 'monospace' },
  debugActions: { flexDirection: 'row', gap: 10 },
  debugCancel: {
    flex: 1, backgroundColor: '#eee', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  debugCancelTxt: { color: '#555', fontWeight: '700' },
  debugRun: {
    flex: 1, backgroundColor: '#1A237E', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  debugRunTxt: { color: '#fff', fontWeight: '700' },
});
