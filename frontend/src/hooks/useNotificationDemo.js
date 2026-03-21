import { CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export function useNotificationDemo() {
  const { addNotification } = useNotification();

  return {
    sendSuccessNotification: (title = 'Success!', message = 'Operation completed successfully.') => {
      addNotification({
        type: 'success',
        icon: <CheckCircle size={20} style={{ color: '#4ade80' }} />,
        title,
        message,
        duration: 5000,
      });
    },

    sendErrorNotification: (title = 'Error Occurred', message = 'Something went wrong. Please try again.') => {
      addNotification({
        type: 'error',
        icon: <AlertCircle size={20} style={{ color: '#ef4444' }} />,
        title,
        message,
        duration: 5000,
      });
    },

    sendWarningNotification: (title = 'Warning', message = 'Please pay attention to this.') => {
      addNotification({
        type: 'warning',
        icon: <AlertTriangle size={20} style={{ color: '#eab308' }} />,
        title,
        message,
        duration: 5000,
      });
    },

    sendInfoNotification: (title = 'Information', message = 'Here is some useful information.') => {
      addNotification({
        type: 'info',
        icon: <Info size={20} style={{ color: '#3b82f6' }} />,
        title,
        message,
        duration: 5000,
      });
    },

    sendMedicalNotification: (diagnosis = 'Normal', confidence = '95.2') => {
      addNotification({
        type: diagnosis === 'Normal' ? 'success' : diagnosis === 'Pneumonia' ? 'error' : 'warning',
        icon: diagnosis === 'Normal' 
          ? <CheckCircle size={20} style={{ color: '#4ade80' }} />
          : <AlertCircle size={20} style={{ color: '#ef4444' }} />,
        title: `✓ ${diagnosis} Detected`,
        message: `Radiological analysis complete with ${confidence}% confidence.`,
        duration: 8000,
        personalized: {
          diagnosis,
          confidence,
          patientId: `MSC-ABC123`,
        },
        action: {
          label: 'View Report',
          callback: () => console.log('View full report')
        }
      });
    },

    sendUrgentConsultationNotification: () => {
      addNotification({
        type: 'error',
        icon: <Zap size={20} style={{ color: '#ef4444' }} />,
        title: '🚨 Urgent: Specialist Review Requested',
        message: 'Your case has been flagged for immediate specialist consultation.',
        duration: 0, // No auto-dismiss
        personalized: {
          severity: 'HIGH',
          patientId: `MSC-XYZ789`,
          findingType: 'Potential Pneumonia',
        },
        action: {
          label: 'View Specialist Queue',
          callback: () => console.log('Opening specialist queue')
        }
      });
    },
  };
}
