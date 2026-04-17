import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HBReading, FieldStatus } from '../types';

interface Props {
  reading: HBReading;
  onConfirm: () => void;
  onRemove: () => void;
}

const BG: Record<FieldStatus, string> = {
  idle: '#eee',
  captured: '#BBDEFB',
  confirmed: '#C8E6C9',
};

export default function HBReadingItem({ reading, onConfirm, onRemove }: Props) {
  return (
    <View style={[styles.row, { backgroundColor: BG[reading.status] }]}>
      <View style={styles.info}>
        <Text style={styles.hb}>{reading.hbValue} g/dL</Text>
        {reading.date ? <Text style={styles.sub}>{reading.date}{reading.time ? `  ${reading.time}` : ''}</Text> : null}
      </View>
      <View style={styles.actions}>
        {reading.status !== 'confirmed' ? (
          <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={onConfirm}>
            <Text style={styles.btnTxt}>✓</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.btn, styles.confirmed]}>
            <Text style={styles.btnTxt}>✓</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.btn, styles.remove]} onPress={onRemove}>
          <Text style={styles.btnTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
  },
  info: { flex: 1 },
  hb: { fontSize: 14, fontWeight: '700', color: '#1A237E' },
  sub: { fontSize: 11, color: '#555', marginTop: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  btn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: { backgroundColor: '#4CAF50' },
  confirmed: { backgroundColor: '#388E3C' },
  remove: { backgroundColor: '#E53935' },
  btnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
