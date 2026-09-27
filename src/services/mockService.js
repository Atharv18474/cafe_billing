import { initialUsers } from '../data/mockUsers';
import { initialCategories } from '../data/mockCategories';
import { initialProducts } from '../data/mockProducts';
import { initialTables } from '../data/mockTables';
import { initialWaiters } from '../data/mockWaiters';
import { initialDiscounts } from '../data/mockDiscounts';
import { initialOrders } from '../data/mockOrders';
import { initialBills, initialSalesAggregate } from '../data/mockBills';
import { TABLE_STATUS, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, DISCOUNT_SCOPE } from '../utils/constants';
import { calculateSubtotal, calculateDiscount, calculateComprehensiveDiscounts, calculateGrandTotal } from '../utils/calculations';

const STORAGE_KEYS = {
  USERS: 'cafe_pos_users',
  CATEGORIES: 'cafe_pos_categories',
  PRODUCTS: 'cafe_pos_products',
  TABLES: 'cafe_pos_tables',
  WAITERS: 'cafe_pos_waiters',
  DISCOUNTS: 'cafe_pos_discounts',
  ORDERS: 'cafe_pos_orders',
  BILLS: 'cafe_pos_bills',
  NEXT_BILL_NUM: 'cafe_pos_next_bill_num',
  NEXT_ORDER_NUM: 'cafe_pos_next_order_num'
};

const getFromStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
};

const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err);
  }
};

export const mockService = {
  // Reset demo data helper
  resetToDefaults: () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.TABLES);
    localStorage.removeItem(STORAGE_KEYS.WAITERS);
    localStorage.removeItem(STORAGE_KEYS.DISCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.BILLS);
    localStorage.removeItem(STORAGE_KEYS.NEXT_BILL_NUM);
    localStorage.removeItem(STORAGE_KEYS.NEXT_ORDER_NUM);
  },

  // ----------------- USERS / AUTH -----------------
  getUsers: () => {
    const users = getFromStorage(STORAGE_KEYS.USERS, initialUsers);
    const hasOwner = users.some(u => u.role === 'OWNER' || u.username === 'owner');
    if (!hasOwner && initialUsers.some(u => u.username === 'owner')) {
      const ownerUser = initialUsers.find(u => u.username === 'owner');
      const updated = [...users, ownerUser];
      setToStorage(STORAGE_KEYS.USERS, updated);
      return updated;
    }
    return users;
  },

  authenticate: (username, password) => {
    const users = mockService.getUsers();
    const cleanUname = (username || '').trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === cleanUname && u.password === password);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      waiterId: user.waiterId || null
    };
  },

  addUser: (userData) => {
    const users = mockService.getUsers();
    const newUser = {
      id: Date.now(),
      username: userData.username.trim().toLowerCase(),
      password: userData.password.trim(),
      name: userData.name.trim(),
      role: userData.role, // 'OWNER' | 'ADMIN'
      phone: userData.phone ? userData.phone.trim() : ''
    };
    const updated = [...users, newUser];
    setToStorage(STORAGE_KEYS.USERS, updated);
    return newUser;
  },

  updateUser: (id, userData) => {
    const users = mockService.getUsers();
    const updated = users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          ...userData,
          username: userData.username ? userData.username.trim().toLowerCase() : u.username,
          name: userData.name ? userData.name.trim() : u.name,
          phone: userData.phone !== undefined ? userData.phone.trim() : u.phone,
          ...(userData.password ? { password: userData.password.trim() } : {})
        };
      }
      return u;
    });
    setToStorage(STORAGE_KEYS.USERS, updated);
    return updated.find(u => u.id === id);
  },

  deleteUser: (id) => {
    const users = mockService.getUsers();
    const filtered = users.filter(u => u.id !== id);
    setToStorage(STORAGE_KEYS.USERS, filtered);
    return true;
  },

  // ----------------- CATEGORIES -----------------
  getCategories: () => {
    return getFromStorage(STORAGE_KEYS.CATEGORIES, initialCategories);
  },

  addCategory: (categoryData) => {
    const categories = mockService.getCategories();
    const newCategory = {
      id: Date.now(),
      name: categoryData.name.trim(),
      status: categoryData.status || 'ACTIVE',
      icon: categoryData.icon || 'Layers'
    };
    const updated = [...categories, newCategory];
    setToStorage(STORAGE_KEYS.CATEGORIES, updated);
    return newCategory;
  },

  updateCategory: (id, categoryData) => {
    const categories = mockService.getCategories();
    const updated = categories.map(cat => (cat.id === id ? { ...cat, ...categoryData } : cat));
    setToStorage(STORAGE_KEYS.CATEGORIES, updated);
    return updated.find(c => c.id === id);
  },

  toggleCategoryStatus: (id) => {
    const categories = mockService.getCategories();
    const updated = categories.map(c => 
      c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c
    );
    setToStorage(STORAGE_KEYS.CATEGORIES, updated);
    return updated.find(c => c.id === id);
  },

  // ----------------- PRODUCTS -----------------
  getProducts: () => {
    return getFromStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
  },

  addProduct: (productData) => {
    const products = mockService.getProducts();
    const categories = mockService.getCategories();
    const category = categories.find(c => c.id === Number(productData.categoryId));
    
    const newProduct = {
      id: Date.now(),
      name: productData.name.trim(),
      categoryId: Number(productData.categoryId),
      categoryName: category ? category.name : 'Other',
      price: Number(productData.price),
      status: productData.status || 'ACTIVE',
      description: (productData.description || '').trim()
    };
    const updated = [...products, newProduct];
    setToStorage(STORAGE_KEYS.PRODUCTS, updated);
    return newProduct;
  },

  updateProduct: (id, productData) => {
    const products = mockService.getProducts();
    const categories = mockService.getCategories();
    const updated = products.map(prod => {
      if (prod.id === id) {
        const catId = productData.categoryId ? Number(productData.categoryId) : prod.categoryId;
        const category = categories.find(c => c.id === catId);
        return {
          ...prod,
          name: productData.name !== undefined ? productData.name.trim() : prod.name,
          categoryId: catId,
          categoryName: category ? category.name : prod.categoryName,
          price: productData.price !== undefined ? Number(productData.price) : prod.price,
          status: productData.status !== undefined ? productData.status : prod.status,
          description: productData.description !== undefined ? productData.description.trim() : prod.description
        };
      }
      return prod;
    });
    setToStorage(STORAGE_KEYS.PRODUCTS, updated);
    return updated.find(p => p.id === id);
  },

  toggleProductStatus: (id) => {
    const products = mockService.getProducts();
    const updated = products.map(p => 
      p.id === id ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : p
    );
    setToStorage(STORAGE_KEYS.PRODUCTS, updated);
    return updated.find(p => p.id === id);
  },

  // ----------------- TABLES -----------------
  getTables: () => {
    return getFromStorage(STORAGE_KEYS.TABLES, initialTables);
  },

  getTableById: (id) => {
    const tables = mockService.getTables();
    return tables.find(t => t.id === Number(id)) || null;
  },

  addTable: (tableData) => {
    const tables = mockService.getTables();
    const newTable = {
      id: Date.now(),
      tableNumber: String(tableData.tableNumber).trim(),
      capacity: Number(tableData.capacity),
      status: TABLE_STATUS.AVAILABLE,
      activeOrderId: null
    };
    const updated = [...tables, newTable];
    setToStorage(STORAGE_KEYS.TABLES, updated);
    return newTable;
  },

  updateTable: (id, tableData) => {
    const tables = mockService.getTables();
    const updated = tables.map(t => {
      if (t.id === id) {
        return {
          ...t,
          tableNumber: tableData.tableNumber !== undefined ? String(tableData.tableNumber).trim() : t.tableNumber,
          capacity: tableData.capacity !== undefined ? Number(tableData.capacity) : t.capacity,
          status: tableData.status !== undefined ? tableData.status : t.status,
          activeOrderId: tableData.activeOrderId !== undefined ? tableData.activeOrderId : t.activeOrderId,
          currentCustomer: tableData.currentCustomer !== undefined ? tableData.currentCustomer : t.currentCustomer,
          currentAmount: tableData.currentAmount !== undefined ? tableData.currentAmount : t.currentAmount
        };
      }
      return t;
    });
    setToStorage(STORAGE_KEYS.TABLES, updated);
    return updated.find(t => t.id === id);
  },

  updateTableStatus: (tableId, status, extra = {}) => {
    return mockService.updateTable(Number(tableId), { status, ...extra });
  },

  // ----------------- WAITERS -----------------
  getWaiters: () => {
    return getFromStorage(STORAGE_KEYS.WAITERS, initialWaiters);
  },

  addWaiter: (waiterData) => {
    const waiters = mockService.getWaiters();
    const users = mockService.getUsers();
    
    // Check duplicate username
    const usernameClean = waiterData.username.trim().toLowerCase();
    if (waiters.some(w => w.username.toLowerCase() === usernameClean) || users.some(u => u.username.toLowerCase() === usernameClean)) {
      throw new Error(`Username "${waiterData.username}" is already taken.`);
    }

    const newWaiterId = Date.now();
    const newWaiter = {
      id: newWaiterId,
      name: waiterData.name.trim(),
      username: usernameClean,
      waiterCode: usernameClean + '01',
      phone: waiterData.phone.trim(),
      status: waiterData.status || 'ACTIVE',
      assignedTables: waiterData.assignedTables || []
    };

    const updatedWaiters = [...waiters, newWaiter];
    setToStorage(STORAGE_KEYS.WAITERS, updatedWaiters);

    // Also register user so waiter can log in
    const updatedUsers = [
      ...users,
      {
        id: Date.now() + 1,
        username: usernameClean,
        password: waiterData.password || 'waiter123',
        name: waiterData.name.trim(),
        role: 'WAITER',
        waiterId: newWaiterId,
        phone: waiterData.phone.trim()
      }
    ];
    setToStorage(STORAGE_KEYS.USERS, updatedUsers);

    return newWaiter;
  },

  updateWaiter: (id, waiterData) => {
    const waiters = mockService.getWaiters();
    const updated = waiters.map(w => (w.id === id ? { ...w, ...waiterData } : w));
    setToStorage(STORAGE_KEYS.WAITERS, updated);
    return updated.find(w => w.id === id);
  },

  toggleWaiterStatus: (id) => {
    const waiters = mockService.getWaiters();
    const updated = waiters.map(w => 
      w.id === id ? { ...w, status: w.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : w
    );
    setToStorage(STORAGE_KEYS.WAITERS, updated);
    return updated.find(w => w.id === id);
  },

  assignWaiterToTable: (waiterId, tableIds) => {
    const waiters = mockService.getWaiters();
    const updated = waiters.map(w => {
      if (w.id === waiterId) {
        return { ...w, assignedTables: tableIds.map(Number) };
      }
      return w;
    });
    setToStorage(STORAGE_KEYS.WAITERS, updated);
    return updated.find(w => w.id === waiterId);
  },

  // ----------------- DISCOUNTS -----------------
  getDiscounts: () => {
    const discounts = getFromStorage(STORAGE_KEYS.DISCOUNTS, initialDiscounts);
    const hasCombo = discounts.some(d => d.scope === DISCOUNT_SCOPE.COMBO);
    if (!hasCombo && initialDiscounts.some(d => d.scope === DISCOUNT_SCOPE.COMBO)) {
      const merged = [...discounts];
      initialDiscounts.forEach(initD => {
        if (!merged.some(m => m.id === initD.id || m.name === initD.name)) {
          merged.push(initD);
        }
      });
      setToStorage(STORAGE_KEYS.DISCOUNTS, merged);
      return merged;
    }
    return discounts;
  },

  addDiscount: (discountData) => {
    const discounts = mockService.getDiscounts();
    const products = mockService.getProducts();

    let targetProductName = null;
    if (discountData.targetProductId) {
      const prod = products.find(p => p.id === Number(discountData.targetProductId));
      targetProductName = prod ? prod.name : null;
    }

    let comboProductNames = [];
    if (discountData.comboProductIds && discountData.comboProductIds.length > 0) {
      comboProductNames = discountData.comboProductIds.map(pId => {
        const prod = products.find(p => p.id === Number(pId));
        return prod ? prod.name : `Item #${pId}`;
      });
    }

    const newDiscount = {
      id: Date.now(),
      name: discountData.name.trim(),
      scope: discountData.scope || DISCOUNT_SCOPE.ORDER,
      targetProductId: discountData.targetProductId ? Number(discountData.targetProductId) : null,
      targetProductName,
      comboProductIds: discountData.comboProductIds ? discountData.comboProductIds.map(Number) : [],
      comboProductNames,
      type: discountData.type,
      value: Number(discountData.value),
      startTime: discountData.startTime || '00:00',
      endTime: discountData.endTime || '23:59',
      status: discountData.status || 'ACTIVE',
      forceApply: discountData.forceApply !== undefined ? discountData.forceApply : true,
      description: discountData.description || ''
    };
    const updated = [...discounts, newDiscount];
    setToStorage(STORAGE_KEYS.DISCOUNTS, updated);
    return newDiscount;
  },

  updateDiscount: (id, discountData) => {
    const discounts = mockService.getDiscounts();
    const products = mockService.getProducts();

    const updated = discounts.map(d => {
      if (d.id === id) {
        let targetProductName = d.targetProductName;
        if (discountData.targetProductId !== undefined) {
          const prod = products.find(p => p.id === Number(discountData.targetProductId));
          targetProductName = prod ? prod.name : null;
        }

        let comboProductNames = d.comboProductNames;
        if (discountData.comboProductIds !== undefined) {
          comboProductNames = discountData.comboProductIds.map(pId => {
            const prod = products.find(p => p.id === Number(pId));
            return prod ? prod.name : `Item #${pId}`;
          });
        }

        return {
          ...d,
          ...discountData,
          scope: discountData.scope || d.scope || DISCOUNT_SCOPE.ORDER,
          targetProductId: discountData.targetProductId ? Number(discountData.targetProductId) : (discountData.targetProductId === null ? null : d.targetProductId),
          targetProductName,
          comboProductIds: discountData.comboProductIds ? discountData.comboProductIds.map(Number) : (discountData.comboProductIds === null ? [] : d.comboProductIds),
          comboProductNames,
          value: discountData.value !== undefined ? Number(discountData.value) : d.value
        };
      }
      return d;
    });
    setToStorage(STORAGE_KEYS.DISCOUNTS, updated);
    return updated.find(d => d.id === id);
  },

  toggleDiscountStatus: (id) => {
    const discounts = mockService.getDiscounts();
    const updated = discounts.map(d => 
      d.id === id ? { ...d, status: d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : d
    );
    setToStorage(STORAGE_KEYS.DISCOUNTS, updated);
    return updated.find(d => d.id === id);
  },

  getActiveDiscount: () => {
    const discounts = mockService.getDiscounts();
    return discounts.find(d => d.status === 'ACTIVE') || null;
  },

  // ----------------- ORDERS -----------------
  getOrders: () => {
    return getFromStorage(STORAGE_KEYS.ORDERS, initialOrders);
  },

  getOrderById: (orderId) => {
    const orders = mockService.getOrders();
    return orders.find(o => o.id === orderId || o.orderNumber === orderId) || null;
  },

  getOrderByTable: (tableId) => {
    const orders = mockService.getOrders();
    // Return active/open order for this table
    return orders.find(o => o.tableId === Number(tableId) && 
      (o.status === ORDER_STATUS.OPEN || o.status === ORDER_STATUS.BILLING || o.status === ORDER_STATUS.PAYMENT_PENDING)
    ) || null;
  },

  generateNextOrderNumber: () => {
    let nextNum = getFromStorage(STORAGE_KEYS.NEXT_ORDER_NUM, 1007);
    const orderNum = `ORD-${nextNum}`;
    setToStorage(STORAGE_KEYS.NEXT_ORDER_NUM, nextNum + 1);
    return orderNum;
  },

  createOrder: ({ tableId, customerName, customerCount, waiterId, waiterName }) => {
    const orders = mockService.getOrders();
    const tables = mockService.getTables();
    const table = tables.find(t => t.id === Number(tableId));
    const orderNumber = mockService.generateNextOrderNumber();

    const newOrder = {
      id: orderNumber,
      orderNumber,
      tableId: Number(tableId),
      tableNumber: table ? table.tableNumber : String(tableId),
      customerName: (customerName || 'Guest').trim(),
      customerCount: Number(customerCount) || 1,
      waiterId: Number(waiterId),
      waiterName: waiterName || 'Waiter',
      status: ORDER_STATUS.OPEN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: []
    };

    const updatedOrders = [newOrder, ...orders];
    setToStorage(STORAGE_KEYS.ORDERS, updatedOrders);

    // Update table status to OCCUPIED
    mockService.updateTable(Number(tableId), {
      status: TABLE_STATUS.OCCUPIED,
      activeOrderId: orderNumber,
      currentCustomer: newOrder.customerName,
      currentAmount: 0
    });

    return newOrder;
  },

  updateOrder: (orderId, updates) => {
    const orders = mockService.getOrders();
    const updated = orders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        return {
          ...o,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    setToStorage(STORAGE_KEYS.ORDERS, updated);
    return updated.find(o => o.id === orderId || o.orderNumber === orderId);
  },

  // Multi-waiter item logging and price preservation:
  // Item must store unitPrice at addition time!
  addOrderItem: (orderId, { product, quantity = 1, waiterId, waiterName }) => {
    const orders = mockService.getOrders();
    let updatedOrder = null;

    const updated = orders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        const existingItemIndex = o.items.findIndex(i => i.productId === product.id);
        let newItems;
        if (existingItemIndex >= 0) {
          newItems = o.items.map((item, idx) => {
            if (idx === existingItemIndex) {
              return {
                ...item,
                quantity: item.quantity + quantity,
                addedByWaiterId: waiterId,
                addedByName: waiterName,
                addedAt: new Date().toISOString()
              };
            }
            return item;
          });
        } else {
          newItems = [
            ...o.items,
            {
              id: Date.now() + Math.random(),
              productId: product.id,
              productName: product.name,
              unitPrice: Number(product.price), // FIXED AT ORDER TIME
              quantity: Number(quantity),
              addedByWaiterId: waiterId,
              addedByName: waiterName,
              addedAt: new Date().toISOString()
            }
          ];
        }

        const subtotal = calculateSubtotal(newItems);
        updatedOrder = {
          ...o,
          items: newItems,
          updatedAt: new Date().toISOString()
        };

        // Update table current amount
        mockService.updateTable(o.tableId, { currentAmount: subtotal });

        return updatedOrder;
      }
      return o;
    });

    setToStorage(STORAGE_KEYS.ORDERS, updated);
    return updatedOrder;
  },

  updateOrderItemQuantity: (orderId, productId, newQty) => {
    const orders = mockService.getOrders();
    let updatedOrder = null;

    const updated = orders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        let newItems;
        if (newQty <= 0) {
          newItems = o.items.filter(i => i.productId !== productId);
        } else {
          newItems = o.items.map(i => i.productId === productId ? { ...i, quantity: newQty } : i);
        }

        const subtotal = calculateSubtotal(newItems);
        mockService.updateTable(o.tableId, { currentAmount: subtotal });

        updatedOrder = {
          ...o,
          items: newItems,
          updatedAt: new Date().toISOString()
        };
        return updatedOrder;
      }
      return o;
    });

    setToStorage(STORAGE_KEYS.ORDERS, updated);
    return updatedOrder;
  },

  removeOrderItem: (orderId, productId) => {
    return mockService.updateOrderItemQuantity(orderId, productId, 0);
  },

  // ----------------- BILLS -----------------
  getBills: () => {
    return getFromStorage(STORAGE_KEYS.BILLS, initialBills);
  },

  getBillById: (billId) => {
    const bills = mockService.getBills();
    return bills.find(b => b.id === billId || b.billNumber === billId) || null;
  },

  generateNextBillNumber: () => {
    let nextNum = getFromStorage(STORAGE_KEYS.NEXT_BILL_NUM, 1026);
    const billNum = `BIL-${nextNum}`;
    setToStorage(STORAGE_KEYS.NEXT_BILL_NUM, nextNum + 1);
    return billNum;
  },

  createBill: ({ order, paymentMethod, cashReceived, upiRef }) => {
    const bills = mockService.getBills();
    const billNumber = mockService.generateNextBillNumber();
    const allDiscounts = mockService.getDiscounts();

    const subtotal = calculateSubtotal(order.items);
    const { totalDiscount, appliedDiscounts } = calculateComprehensiveDiscounts(order.items, allDiscounts);
    const finalTotal = calculateGrandTotal(subtotal, totalDiscount);
    
    let changeReturned = 0;
    if (paymentMethod === PAYMENT_METHOD.CASH && cashReceived) {
      changeReturned = Math.max(0, cashReceived - finalTotal);
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    const dateStr = now.toISOString().split('T')[0];

    const discountSummaryName = appliedDiscounts.length > 0
      ? appliedDiscounts.map(d => d.name).join(' + ')
      : null;

    const newBill = {
      id: billNumber,
      billNumber,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      waiterName: order.waiterName,
      date: dateStr,
      time: timeStr,
      dateTime: now.toISOString(),
      subtotal,
      discountAmount: totalDiscount,
      discountName: discountSummaryName,
      appliedDiscounts,
      finalTotal,
      paymentMethod,
      cashReceived: paymentMethod === PAYMENT_METHOD.CASH ? Number(cashReceived) : null,
      changeReturned: paymentMethod === PAYMENT_METHOD.CASH ? changeReturned : null,
      upiRef: paymentMethod === PAYMENT_METHOD.ONLINE ? (upiRef || `UPI-TXN-${Date.now().toString().slice(-6)}`) : null,
      paymentStatus: PAYMENT_STATUS.PAID,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
        addedByName: item.addedByName,
        addedByWaiterId: item.addedByWaiterId
      }))
    };

    const updatedBills = [newBill, ...bills];
    setToStorage(STORAGE_KEYS.BILLS, updatedBills);

    // Update order status to CLOSED / PAID
    mockService.updateOrder(order.id, {
      status: ORDER_STATUS.PAID,
      billId: billNumber
    });

    // Reset table status to AVAILABLE
    mockService.updateTable(order.tableId, {
      status: TABLE_STATUS.AVAILABLE,
      activeOrderId: null,
      currentCustomer: null,
      currentAmount: 0
    });

    return newBill;
  },

  // ----------------- SALES & DASHBOARD AGGREGATES -----------------
  getSales: () => {
    const bills = mockService.getBills();
    const tables = mockService.getTables();
    
    // Dynamic calculation from bills
    const dynamicBillsCount = bills.length;
    let dynamicGross = 0;
    let dynamicDiscount = 0;
    let dynamicNet = 0;
    let dynamicCash = 0;
    let dynamicOnline = 0;

    bills.forEach(b => {
      dynamicGross += (b.subtotal || 0);
      dynamicDiscount += (b.discountAmount || 0);
      dynamicNet += (b.finalTotal || 0);
      if (b.paymentMethod === PAYMENT_METHOD.CASH) {
        dynamicCash += (b.finalTotal || 0);
      } else if (b.paymentMethod === PAYMENT_METHOD.ONLINE) {
        dynamicOnline += (b.finalTotal || 0);
      }
    });

    const occupiedTables = tables.filter(t => t.status === TABLE_STATUS.OCCUPIED).length;
    const availableTables = tables.filter(t => t.status === TABLE_STATUS.AVAILABLE).length;
    const billingTables = tables.filter(t => t.status === TABLE_STATUS.BILLING).length;
    const paymentPendingTables = tables.filter(t => t.status === TABLE_STATUS.PAYMENT_PENDING).length;

    // Combine with base aggregate to match PDF exact targets seamlessly
    return {
      todaySales: initialSalesAggregate.baseNetSales + dynamicNet,
      totalBills: initialSalesAggregate.baseTotalBills + dynamicBillsCount,
      cashSales: initialSalesAggregate.baseCashSales + dynamicCash,
      onlineSales: initialSalesAggregate.baseOnlineSales + dynamicOnline,
      discountGiven: initialSalesAggregate.baseDiscounts + dynamicDiscount,
      grossSales: initialSalesAggregate.baseGrossSales + dynamicGross,
      netSales: initialSalesAggregate.baseNetSales + dynamicNet,
      occupiedTables,
      availableTables,
      billingTables,
      paymentPendingTables,
      totalTables: tables.length,
      recentBills: bills.slice(0, 10)
    };
  },

  // ----------------- SALES BY DATE RANGE -----------------
  // fromDate and toDate are 'YYYY-MM-DD' strings (inclusive)
  getSalesByDateRange: (fromDate, toDate) => {
    const allBills = mockService.getBills();

    const from = fromDate ? new Date(fromDate + 'T00:00:00') : null;
    const to = toDate ? new Date(toDate + 'T23:59:59') : null;

    const filtered = allBills.filter(b => {
      if (!b.date) return false;
      const billDate = new Date(b.date + 'T00:00:00');
      if (from && billDate < from) return false;
      if (to && billDate > to) return false;
      return true;
    });

    let gross = 0, discount = 0, net = 0, cash = 0, online = 0;
    filtered.forEach(b => {
      gross += (b.subtotal || 0);
      discount += (b.discountAmount || 0);
      net += (b.finalTotal || 0);
      if (b.paymentMethod === PAYMENT_METHOD.CASH) cash += (b.finalTotal || 0);
      else if (b.paymentMethod === PAYMENT_METHOD.ONLINE) online += (b.finalTotal || 0);
    });

    return {
      totalBills: filtered.length,
      grossSales: gross,
      discountGiven: discount,
      netSales: net,
      cashSales: cash,
      onlineSales: online,
      bills: filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
    };
  }
};
