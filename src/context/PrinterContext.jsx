/**
 * PrinterContext.jsx
 *
 * Global printer context — wraps the printerService singleton in React state
 * so any component can read printer status and trigger actions.
 *
 * Wrap the app in <PrinterProvider> (done in main.jsx).
 * Consume with usePrinter() anywhere.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { printerService } from '../services/printer/printerService.js';

const PrinterContext = createContext(null);

export const PrinterProvider = ({ children }) => {
  const [printerState, setPrinterState] = useState(() => printerService.state);

  useEffect(() => {
    // Subscribe to printerService state changes
    const unsub = printerService.subscribe((state) => setPrinterState({ ...state }));
    return unsub;
  }, []);

  const scan = useCallback(() => printerService.scan(), []);
  const connect = useCallback((device) => printerService.connect(device), []);
  const disconnect = useCallback(() => printerService.disconnect(), []);
  const testPrint = useCallback(() => printerService.testPrint(), []);
  const printBill = useCallback((bill) => printerService.printBill(bill), []);

  return (
    <PrinterContext.Provider
      value={{
        ...printerState,
        scan,
        connect,
        disconnect,
        testPrint,
        printBill,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error('usePrinter must be used within a PrinterProvider');
  return ctx;
};
