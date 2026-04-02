import { useState, useEffect } from 'react';
import { useCalculator, type CustomerType } from './hooks/useCalculator';
import { Layout } from './components/Layout';
import { InputGroup } from './components/InputGroup';
import { OrderSection } from './components/OrderSection';
import { ResultDisplay } from './components/ResultDisplay';
import { DebugPanel } from './components/DebugPanel';

function App() {
  const { state, result, dispatch } = useCalculator();
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Update current time every minute (unless in debug mode)
  useEffect(() => {
    const timer = setInterval(() => {
      // Skip automatic updates if debug mode is active
      if (!state.isDebugMode) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        dispatch({ type: 'SET_CURRENT_TIME', payload: `${hours}:${minutes}` });
      }
    }, 60000);

    // Initial set (only if not in debug mode)
    if (!state.isDebugMode) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      dispatch({ type: 'SET_CURRENT_TIME', payload: `${hours}:${minutes}` });
    }

    return () => clearInterval(timer);
  }, [dispatch, state.isDebugMode]);

  const handleCustomerTypeChange = (type: CustomerType) => {
    dispatch({ type: 'SET_CUSTOMER_TYPE', payload: type });
  };

  const handleEntryTimeChange = (time: string) => {
    dispatch({ type: 'SET_ENTRY_TIME', payload: time });
  };

  const handleDohanToggle = () => {
    dispatch({ type: 'TOGGLE_DOHAN' });
  };

  const handleSetHalfOffToggle = () => {
    dispatch({ type: 'TOGGLE_SET_HALF_OFF' });
  };

  const handleAddOrder = (name: string, price: number, isTaxIncluded?: boolean) => {
    dispatch({ type: 'ADD_ORDER', payload: { name, price, isTaxIncluded } });
  };

  const handleUpdateOrderCount = (id: string, delta: number) => {
    dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id, delta } });
  };

  const handleRemoveOrder = (id: string) => {
    dispatch({ type: 'REMOVE_ORDER', payload: id });
  };

  const handleReset = () => {
    if (window.confirm('リセットしますか？')) {
      dispatch({ type: 'RESET' });
      // Reset time to now
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      dispatch({ type: 'SET_CURRENT_TIME', payload: `${hours}:${minutes} ` });
    }
  };

  return (
    <Layout>
      {/* Hidden Debug Trigger - Top Right Corner */}
      <div
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          zIndex: 9999,
          opacity: 0
        }}
        title="Debug Mode"
      />

      <div className="flex flex-col gap-6">
        {/* Header / Reset */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gold">お会計計算</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'linear-gradient(135deg, var(--input-bg) 0%, rgba(255,215,0,0.1) 100%)',
                color: 'var(--text-color)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              リセット
            </button>
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                background: showDebugPanel ? 'var(--accent-color)' : 'var(--input-bg)',
                color: showDebugPanel ? '#000' : 'var(--text-color)',
                cursor: 'pointer',
                display: 'none', // Hidden
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Input Group */}
        <InputGroup
          customerType={state.customerType}
          entryTime={state.entryTime}
          dohan={state.dohan}
          isSetHalfOff={state.isSetHalfOff}
          isGirlsParty={state.isGirlsParty}
          isAppreciationDay={state.isAppreciationDay}
          isFirstLady={state.isFirstLady}
          additionalNominationCount={state.additionalNominationCount}
          onCustomerTypeChange={handleCustomerTypeChange}
          onEntryTimeChange={handleEntryTimeChange}
          onDohanToggle={handleDohanToggle}
          onSetHalfOffToggle={handleSetHalfOffToggle}
          onGirlsPartyToggle={() => dispatch({ type: 'TOGGLE_GIRLS_PARTY' })}
          onAppreciationDayToggle={() => dispatch({ type: 'TOGGLE_APPRECIATION_DAY' })}
          onFirstLadyToggle={() => dispatch({ type: 'TOGGLE_FIRST_LADY' })}
          onAdditionalNominationCountChange={(count) => dispatch({ type: 'SET_ADDITIONAL_NOMINATION_COUNT', payload: count })}
        />

        {/* Order Section */}
        <OrderSection
          orders={state.orders}
          onAdd={handleAddOrder}
          onUpdateCount={handleUpdateOrderCount}
          onRemove={handleRemoveOrder}
          isGirlsParty={state.isGirlsParty}
          isAppreciationDay={state.isAppreciationDay}
          isFirstLady={state.isFirstLady}
        />

        {/* Result Display */}
        <ResultDisplay
          currentTotal={result.currentTotal}
          breakdown={result.breakdown}
          schedule={result.schedule}
          taxRate={result.taxRate}
          currentTime={state.currentTime}
        />

        {/* Debug Panel */}
        <div style={{
          position: 'fixed',
          right: showDebugPanel ? '20px' : '-300px',
          top: '50%',
          transform: 'translateY(-50%)',
          transition: 'right 0.3s ease',
          zIndex: 1000
        }}>
          <DebugPanel
            isDebugMode={state.isDebugMode}
            currentTime={state.currentTime}
            onDebugModeToggle={() => dispatch({ type: 'TOGGLE_DEBUG_MODE' })}
            onCurrentTimeChange={(time) => dispatch({ type: 'SET_CURRENT_TIME', payload: time })}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;
