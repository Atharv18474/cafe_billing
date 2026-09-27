import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Response interceptor to unwrap data
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API request failed';
    console.warn(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    return Promise.reject(new Error(message));
  }
);

export const apiService = {
  // ----------------- AUTH -----------------
  login: async (username, password) => {
    const res = await apiClient.post('/auth/login', { username, password });
    return res.data?.user;
  },
  getSetupStatus: async () => {
    const res = await apiClient.get('/auth/setup-status');
    return res.data;
  },
  setupOwner: async (ownerData) => {
    const res = await apiClient.post('/auth/setup-owner', ownerData);
    return res.data?.user;
  },

  // ----------------- USERS -----------------
  getUsers: async (params = {}) => {
    const res = await apiClient.get('/users', { params });
    return res.data?.users || [];
  },
  getUserById: async (id) => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data?.user;
  },
  createUser: async (userData) => {
    const res = await apiClient.post('/users', userData);
    return res.data?.user;
  },
  updateUser: async (id, userData) => {
    const res = await apiClient.put(`/users/${id}`, userData);
    return res.data?.user;
  },
  deleteUser: async (id) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },

  // ----------------- CATEGORIES -----------------
  getCategories: async (params = {}) => {
    const res = await apiClient.get('/categories', { params });
    return res.data?.categories || [];
  },
  getCategoryById: async (id) => {
    const res = await apiClient.get(`/categories/${id}`);
    return res.data?.category;
  },
  createCategory: async (data) => {
    const res = await apiClient.post('/categories', data);
    return res.data?.category;
  },
  updateCategory: async (id, data) => {
    const res = await apiClient.put(`/categories/${id}`, data);
    return res.data?.category;
  },
  deleteCategory: async (id) => {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },

  // ----------------- PRODUCTS -----------------
  getProducts: async (params = {}) => {
    const res = await apiClient.get('/products', { params });
    return res.data?.products || [];
  },
  getProductById: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data?.product;
  },
  createProduct: async (data) => {
    const res = await apiClient.post('/products', data);
    return res.data?.product;
  },
  updateProduct: async (id, data) => {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data?.product;
  },
  updateProductPrice: async (id, price) => {
    const res = await apiClient.put(`/products/${id}/price`, { price });
    return res.data?.product;
  },
  deleteProduct: async (id) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },

  // ----------------- TABLES -----------------
  getTables: async (params = {}) => {
    const res = await apiClient.get('/tables', { params });
    return res.data?.tables || [];
  },
  getTableById: async (id) => {
    const res = await apiClient.get(`/tables/${id}`);
    return res.data?.table;
  },
  createTable: async (data) => {
    const res = await apiClient.post('/tables', data);
    return res.data?.table;
  },
  updateTable: async (id, data) => {
    const res = await apiClient.put(`/tables/${id}`, data);
    return res.data?.table;
  },
  updateTableStatus: async (id, status) => {
    const res = await apiClient.put(`/tables/${id}/status`, { status });
    return res.data;
  },
  deleteTable: async (id) => {
    const res = await apiClient.delete(`/tables/${id}`);
    return res.data;
  },

  // ----------------- WAITERS -----------------
  getWaiters: async (params = {}) => {
    const res = await apiClient.get('/waiters', { params });
    return res.data?.waiters || [];
  },
  getWaiterById: async (id) => {
    const res = await apiClient.get(`/waiters/${id}`);
    return res.data?.waiter;
  },
  createWaiter: async (data) => {
    const res = await apiClient.post('/waiters', data);
    return res.data?.waiter;
  },
  updateWaiter: async (id, data) => {
    const res = await apiClient.put(`/waiters/${id}`, data);
    return res.data?.waiter;
  },
  toggleWaiterStatus: async (id) => {
    const res = await apiClient.put(`/waiters/${id}/toggle-status`);
    return res.data;
  },
  assignWaiterToTable: async (waiterId, tableIds) => {
    const res = await apiClient.post(`/waiters/${waiterId}/assign`, { tableIds });
    return res.data;
  },

  // ----------------- DISCOUNTS -----------------
  getDiscounts: async (params = {}) => {
    const res = await apiClient.get('/discounts', { params });
    return res.data?.discounts || [];
  },
  getDiscountById: async (id) => {
    const res = await apiClient.get(`/discounts/${id}`);
    return res.data?.discount;
  },
  createDiscount: async (data) => {
    const res = await apiClient.post('/discounts', data);
    return res.data?.discount;
  },
  updateDiscount: async (id, data) => {
    const res = await apiClient.put(`/discounts/${id}`, data);
    return res.data?.discount;
  },
  toggleDiscountStatus: async (id) => {
    const res = await apiClient.put(`/discounts/${id}/toggle-status`);
    return res.data;
  },
  deleteDiscount: async (id) => {
    const res = await apiClient.delete(`/discounts/${id}`);
    return res.data;
  },

  // ----------------- ORDERS -----------------
  getOrders: async (params = {}) => {
    const res = await apiClient.get('/orders', { params });
    return res.data?.orders || [];
  },
  getOrderById: async (id) => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data?.order;
  },
  getOrderByTable: async (tableId) => {
    const res = await apiClient.get(`/orders/by-table/${tableId}`);
    return res.data?.order;
  },
  createOrder: async (data) => {
    const res = await apiClient.post('/orders', data);
    return res.data?.order;
  },
  addOrderItem: async (orderId, itemData) => {
    const res = await apiClient.post(`/orders/${orderId}/items`, itemData);
    return res.data?.order;
  },
  updateOrderItem: async (orderId, itemId, data) => {
    const res = await apiClient.put(`/orders/${orderId}/items/${itemId}`, data);
    return res.data?.order;
  },
  deleteOrderItem: async (orderId, itemId) => {
    const res = await apiClient.delete(`/orders/${orderId}/items/${itemId}`);
    return res.data?.order;
  },
  updateOrderStatus: async (orderId, status) => {
    const res = await apiClient.put(`/orders/${orderId}/status`, { status });
    return res.data;
  },
  applyDiscount: async (orderId, data) => {
    const res = await apiClient.put(`/orders/${orderId}/discount`, data);
    return res.data?.order;
  },

  // ----------------- PAYMENTS / BILLS -----------------
  createPayment: async (paymentData) => {
    const res = await apiClient.post('/payments', paymentData);
    return res.data;
  },
  getBills: async (params = {}) => {
    const res = await apiClient.get('/bills', { params });
    return res.data?.bills || [];
  },
  getBillById: async (id) => {
    const res = await apiClient.get(`/bills/${id}`);
    return res.data?.bill;
  },

  // ----------------- SALES ANALYTICS -----------------
  getTodaySales: async (date) => {
    const res = await apiClient.get('/sales/today', { params: date ? { date } : {} });
    return res.data;
  }
};
