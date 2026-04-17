import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { FieldStatus } from '../types';

interface Props {
  label: string;
  status: FieldStatus;
  capturedValue?: string;
  badge?: number; // for HB count
  onPress: () => void;
  width?: number;
}

const BG: Record<FieldStatus, string> = {
  idle: '#FFFFFF',
  captured: '#2196F3',
  confirmed: '#4CAF50',
};

const TEXT_COLOR: Record<FieldStatus, string> = {
  idle: '#333',
  captured: '#fff',
  confirmed: '#fff',
};

export default function ScanButton({ label, status, capturedValue, badge, onPress, width = 72 }: Props) {
  return (
    <View style={styles.wrapper}>
      {/* Chat bubble pointing right */}
      {status === 'captured' && capturedValue ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText} numberOfLines={3}>{capturedValue}</Text>
          <View style={styles.bubbleArrow} />
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: BG[status], width }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.label, { color: TEXT_COLOR[status] }]}>{label}</Text>
        {badge !== undefined && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  bubble: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 200,
    marginRight: 8,
    position: 'relative',
  },
  bubbleText: {
    color: '#fff',
    fontSize: 12,
  },
  bubbleArrow: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#1565C0',
  },
});
