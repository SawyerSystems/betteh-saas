import { useBookingFlow } from '@/contexts/BookingFlowContext';

export function BookingFlowDebugger() {
  const { state, getCurrentStepName } = useBookingFlow();
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🐛 Booking Flow Debug</h4>
      <div><strong>Flow Type:</strong> {state.flowType}</div>
      <div><strong>Current Step:</strong> {state.currentStep}</div>
      <div><strong>Step Name:</strong> {getCurrentStepName()}</div>
      <div><strong>Parent ID:</strong> {state.parentId || 'none'}</div>
      <div><strong>Selected Parent:</strong> {state.selectedParent ? 'yes' : 'no'}</div>
      <div><strong>Parent Info:</strong> {state.parentInfo ? state.parentInfo.email : 'none'}</div>
      <div><strong>Athletes:</strong> {state.selectedAthletes.length}</div>
      <div><strong>Lesson Type:</strong> {state.lessonType || 'none'}</div>
    </div>
  );
}
