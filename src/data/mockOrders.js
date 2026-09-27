import { ORDER_STATUS } from '../utils/constants';

export const initialOrders = [
  {
    id: 'ORD-1002',
    orderNumber: 'ORD-1002',
    tableId: 2,
    tableNumber: '2',
    customerName: 'Rahul',
    customerCount: 2,
    waiterId: 1,
    waiterName: 'Amit',
    status: ORDER_STATUS.OPEN,
    createdAt: '2026-09-10T13:15:00',
    items: [
      {
        id: 1,
        productId: 2,
        productName: 'Cold Coffee',
        unitPrice: 120,
        quantity: 2,
        addedByWaiterId: 1,
        addedByName: 'Amit',
        addedAt: '2026-09-10T13:15:20'
      },
      {
        id: 2,
        productId: 11,
        productName: 'Burger',
        unitPrice: 150,
        quantity: 1,
        addedByWaiterId: 1,
        addedByName: 'Amit',
        addedAt: '2026-09-10T13:16:05'
      },
      {
        id: 3,
        productId: 15,
        productName: 'French Fries',
        unitPrice: 120,
        quantity: 1,
        addedByWaiterId: 1,
        addedByName: 'Amit',
        addedAt: '2026-09-10T13:17:10'
      }
    ]
  },
  {
    id: 'ORD-1005',
    orderNumber: 'ORD-1005',
    tableId: 5,
    tableNumber: '5',
    customerName: 'Priya & Friends',
    customerCount: 4,
    waiterId: 1,
    waiterName: 'Amit',
    status: ORDER_STATUS.OPEN,
    createdAt: '2026-09-10T13:30:00',
    items: [
      {
        id: 1,
        productId: 8,
        productName: 'Veg Pizza',
        unitPrice: 250,
        quantity: 1,
        addedByWaiterId: 1,
        addedByName: 'Amit',
        addedAt: '2026-09-10T13:30:45'
      },
      {
        id: 2,
        productId: 1,
        productName: 'Coffee',
        unitPrice: 100,
        quantity: 2,
        addedByWaiterId: 2,
        addedByName: 'Rahul',
        addedAt: '2026-09-10T13:42:15'
      },
      {
        id: 3,
        productId: 15,
        productName: 'French Fries',
        unitPrice: 120,
        quantity: 1,
        addedByWaiterId: 1,
        addedByName: 'Amit',
        addedAt: '2026-09-10T13:50:00'
      }
    ]
  },
  {
    id: 'ORD-1006',
    orderNumber: 'ORD-1006',
    tableId: 6,
    tableNumber: '6',
    customerName: 'Vikram',
    customerCount: 3,
    waiterId: 4,
    waiterName: 'Neha',
    status: ORDER_STATUS.BILLING,
    createdAt: '2026-09-10T12:45:00',
    items: [
      {
        id: 1,
        productId: 8,
        productName: 'Pizza',
        unitPrice: 250,
        quantity: 1,
        addedByWaiterId: 4,
        addedByName: 'Neha',
        addedAt: '2026-09-10T12:45:30'
      },
      {
        id: 2,
        productId: 2,
        productName: 'Cold Coffee',
        unitPrice: 120,
        quantity: 2,
        addedByWaiterId: 4,
        addedByName: 'Neha',
        addedAt: '2026-09-10T12:46:10'
      },
      {
        id: 3,
        productId: 15,
        productName: 'French Fries',
        unitPrice: 120,
        quantity: 1,
        addedByWaiterId: 4,
        addedByName: 'Neha',
        addedAt: '2026-09-10T12:47:00'
      }
    ]
  },
  {
    id: 'ORD-1001',
    orderNumber: 'ORD-1001',
    tableId: 1,
    tableNumber: '1',
    customerName: 'Aman',
    customerCount: 2,
    waiterId: 1,
    waiterName: 'Amit',
    status: ORDER_STATUS.PAID,
    createdAt: '2026-09-10T11:00:00',
    items: [
      {
        id: 1,
        productId: 1,
        productName: 'Cappuccino',
        unitPrice: 100,
        quantity: 2,
        addedByWaiterId: 1,
        addedByName: 'Amit',
        addedAt: '2026-09-10T11:01:00'
      },
      {
        id: 2,
        productId: 16,
        productName: 'Garlic Bread',
        unitPrice: 140,
        quantity: 1,
        addedByWaiterId: 1,
        addedByName: 'Amit',
        addedAt: '2026-09-10T11:02:10'
      }
    ]
  }
];
