import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { PaymentMethod } from '../services/paymentService';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSelect: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export default function PaymentMethodCard({
  paymentMethod,
  onSelect,
  onDelete,
  onSetDefault,
  isSelected = false,
  showActions = false,
}: PaymentMethodCardProps) {

  const handleDelete = () => {
    Alert.alert(
      'Remover Método de Pagamento',
      'Tem certeza que deseja remover este método de pagamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const handleSetDefault = () => {
    Alert.alert(
      'Definir como Padrão',
      'Deseja definir este método como padrão para futuros pagamentos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Definir', onPress: onSetDefault },
      ]
    );
  };

  const getCardIcon = () => {
    if (paymentMethod.type === 'pix') {
      return '💳'; // PIX icon placeholder
    }
    
    switch (paymentMethod.brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const getDisplayText = () => {
    if (paymentMethod.type === 'pix') {
      return 'PIX';
    }
    return `**** **** **** ${paymentMethod.last4}`;
  };

  const getSubtext = () => {
    if (paymentMethod.type === 'pix') {
      return 'Pagamento instantâneo';
    }
    
    const expiry = paymentMethod.expiryMonth && paymentMethod.expiryYear
      ? `${paymentMethod.expiryMonth.toString().padStart(2, '0')}/${paymentMethod.expiryYear}`
      : '';
    
    return `${paymentMethod.brand?.toUpperCase() || 'CARTÃO'} ${expiry}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        paymentMethod.isDefault && styles.defaultContainer,
      ]}
      onPress={onSelect}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getCardIcon()}</Text>
        </View>
        
        <View style={styles.info}>
          <Text style={styles.displayText}>{getDisplayText()}</Text>
          <Text style={styles.subtext}>{getSubtext()}</Text>
          {paymentMethod.isDefault && (
            <Text style={styles.defaultLabel}>Padrão</Text>
          )}
        </View>

        {showActions && (
          <View style={styles.actions}>
            {!paymentMethod.isDefault && onSetDefault && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSetDefault}
              >
                <Text style={styles.actionButtonText}>Padrão</Text>
              </TouchableOpacity>
            )}
            
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                  Remover
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIcon}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderColor: '#20B2AA',
    borderWidth: 2,
  },
  defaultContainer: {
    borderColor: '#FFD700',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  displayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#fee',
  },
  deleteButtonText: {
    color: '#e74c3c',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#20B2AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});