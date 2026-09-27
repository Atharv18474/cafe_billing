import { DISCOUNT_TYPE, DISCOUNT_SCOPE } from '../utils/constants';

export const initialDiscounts = [
  {
    id: 1,
    name: 'Lunch Special',
    scope: DISCOUNT_SCOPE.ORDER,
    type: DISCOUNT_TYPE.PERCENTAGE,
    value: 10,
    startTime: '12:00',
    endTime: '15:00',
    status: 'ACTIVE',
    forceApply: true,
    description: '10% off on complete bill during lunch hours'
  },
  {
    id: 2,
    name: 'Cold Coffee Delight',
    scope: DISCOUNT_SCOPE.PRODUCT,
    targetProductId: 2, // Cold Coffee
    targetProductName: 'Cold Coffee',
    type: DISCOUNT_TYPE.FIXED,
    value: 20,
    startTime: '00:00',
    endTime: '23:59',
    status: 'ACTIVE',
    forceApply: true,
    description: 'Flat ₹20 discount on Cold Coffee'
  },
  {
    id: 3,
    name: 'Burger & Cold Coffee Combo',
    scope: DISCOUNT_SCOPE.COMBO,
    comboProductIds: [11, 2], // Veg Burger (11) + Cold Coffee (2)
    comboProductNames: ['Veg Burger', 'Cold Coffee'],
    type: DISCOUNT_TYPE.FIXED,
    value: 40,
    startTime: '00:00',
    endTime: '23:59',
    status: 'ACTIVE',
    forceApply: true,
    description: 'Order Veg Burger + Cold Coffee together and save ₹40!'
  },
  {
    id: 4,
    name: 'Pizza & Coke Combo',
    scope: DISCOUNT_SCOPE.COMBO,
    comboProductIds: [9, 18], // Cheese Pizza (9) + Coke (18)
    comboProductNames: ['Cheese Pizza', 'Coke'],
    type: DISCOUNT_TYPE.FIXED,
    value: 50,
    startTime: '00:00',
    endTime: '23:59',
    status: 'ACTIVE',
    forceApply: true,
    description: 'Order Cheese Pizza + Coke combo and save ₹50!'
  },
  {
    id: 5,
    name: 'Evening Chai & Snacks',
    scope: DISCOUNT_SCOPE.COMBO,
    comboProductIds: [5, 16], // Masala Tea (5) + Garlic Bread (16)
    comboProductNames: ['Masala Tea', 'Garlic Bread'],
    type: DISCOUNT_TYPE.FIXED,
    value: 30,
    startTime: '16:00',
    endTime: '19:00',
    status: 'INACTIVE',
    forceApply: false,
    description: 'Save ₹30 on Masala Tea + Garlic Bread combo'
  }
];
