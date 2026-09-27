import { TABLE_STATUS } from '../utils/constants';

export const initialTables = [
  { id: 1, tableNumber: '1', capacity: 4, status: TABLE_STATUS.AVAILABLE, activeOrderId: null },
  { id: 2, tableNumber: '2', capacity: 2, status: TABLE_STATUS.OCCUPIED, activeOrderId: 'ORD-1002', currentCustomer: 'Rahul', currentAmount: 510 },
  { id: 3, tableNumber: '3', capacity: 4, status: TABLE_STATUS.AVAILABLE, activeOrderId: null },
  { id: 4, tableNumber: '4', capacity: 6, status: TABLE_STATUS.AVAILABLE, activeOrderId: null },
  { id: 5, tableNumber: '5', capacity: 6, status: TABLE_STATUS.OCCUPIED, activeOrderId: 'ORD-1005', currentCustomer: 'Priya & Friends', currentAmount: 500 },
  { id: 6, tableNumber: '6', capacity: 4, status: TABLE_STATUS.BILLING, activeOrderId: 'ORD-1006', currentCustomer: 'Vikram', currentAmount: 610 },
  { id: 7, tableNumber: '7', capacity: 2, status: TABLE_STATUS.AVAILABLE, activeOrderId: null },
  { id: 8, tableNumber: '8', capacity: 4, status: TABLE_STATUS.AVAILABLE, activeOrderId: null },
  { id: 9, tableNumber: '9', capacity: 6, status: TABLE_STATUS.AVAILABLE, activeOrderId: null },
  { id: 10, tableNumber: '10', capacity: 8, status: TABLE_STATUS.AVAILABLE, activeOrderId: null }
];
