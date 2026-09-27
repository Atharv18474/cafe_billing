import { USER_ROLES } from '../utils/constants';

export const initialUsers = [
  {
    id: 100,
    username: 'owner',
    password: 'owner123',
    name: 'Vikram Singhania (Owner)',
    role: USER_ROLES.OWNER,
    phone: '+91 99999 88888'
  },
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Cafe Manager',
    role: USER_ROLES.ADMIN,
    phone: '+91 98765 43210'
  },
  {
    id: 2,
    username: 'amit',
    password: 'amit123',
    name: 'Amit Kumar',
    role: USER_ROLES.WAITER,
    waiterId: 1,
    phone: '+91 98111 22334'
  },
  {
    id: 3,
    username: 'rahul',
    password: 'rahul123',
    name: 'Rahul Sharma',
    role: USER_ROLES.WAITER,
    waiterId: 2,
    phone: '+91 98222 33445'
  },
  {
    id: 4,
    username: 'sagar',
    password: 'sagar123',
    name: 'Sagar Verma',
    role: USER_ROLES.WAITER,
    waiterId: 3,
    phone: '+91 98333 44556'
  },
  {
    id: 5,
    username: 'neha',
    password: 'neha123',
    name: 'Neha Patel',
    role: USER_ROLES.WAITER,
    waiterId: 4,
    phone: '+91 98444 55667'
  }
];
