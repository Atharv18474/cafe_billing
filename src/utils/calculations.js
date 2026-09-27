import { DISCOUNT_TYPE, DISCOUNT_SCOPE } from './constants';

export const calculateItemTotal = (unitPrice, quantity) => {
  return Number((unitPrice * quantity).toFixed(2));
};

export const calculateSubtotal = (items = []) => {
  return items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item.unitPrice, item.quantity);
    return sum + itemTotal;
  }, 0);
};

// Check if current time qualifies or forceApply is enabled
export const isDiscountTimeValid = (discountRule) => {
  if (!discountRule || discountRule.status !== 'ACTIVE') return false;
  if (discountRule.forceApply) return true;

  if (discountRule.startTime && discountRule.endTime) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = discountRule.startTime.split(':').map(Number);
    const [endH, endM] = discountRule.endTime.split(':').map(Number);

    const startTotal = startH * 60 + (startM || 0);
    const endTotal = endH * 60 + (endM || 0);

    return currentMinutes >= startTotal && currentMinutes <= endTotal;
  }
  return true;
};

/**
 * Calculates comprehensive discounts:
 * 1. Product-specific discounts
 * 2. Combo discounts (e.g. Burger + Cold Coffee)
 * 3. Order-level discounts (e.g. Lunch Special 10%)
 */
export const calculateComprehensiveDiscounts = (items = [], allDiscounts = []) => {
  if (!items || items.length === 0 || !allDiscounts || allDiscounts.length === 0) {
    return {
      totalDiscount: 0,
      appliedDiscounts: []
    };
  }

  const activeRules = allDiscounts.filter(isDiscountTimeValid);
  const appliedDiscounts = [];
  let totalDiscount = 0;

  // Item quantity map for fast checking
  const itemQtyMap = {};
  items.forEach(item => {
    itemQtyMap[item.productId] = (itemQtyMap[item.productId] || 0) + item.quantity;
  });

  // Track quantities consumed by combo discounts to avoid double combo dipping
  const comboConsumedQty = { ...itemQtyMap };

  // 1. Process COMBO discounts first
  const comboRules = activeRules.filter(r => r.scope === DISCOUNT_SCOPE.COMBO);
  comboRules.forEach(combo => {
    const requiredProductIds = combo.comboProductIds || [];
    if (requiredProductIds.length === 0) return;

    // Check how many complete combos can be formed
    const possibleCombos = requiredProductIds.map(pId => comboConsumedQty[pId] || 0);
    const comboCount = Math.min(...possibleCombos);

    if (comboCount > 0) {
      // Calculate discount amount for this combo
      let comboDiscount = 0;
      if (combo.type === DISCOUNT_TYPE.PERCENTAGE || combo.type === 'Percentage') {
        // Find total value of the combo items in cart
        const comboItemsValue = items
          .filter(i => requiredProductIds.includes(i.productId))
          .reduce((sum, i) => sum + (i.unitPrice * comboCount), 0);
        comboDiscount = (comboItemsValue * combo.value) / 100;
      } else {
        // Fixed amount per combo bundle
        comboDiscount = combo.value * comboCount;
      }

      comboDiscount = Math.round(comboDiscount * 100) / 100;

      if (comboDiscount > 0) {
        totalDiscount += comboDiscount;
        appliedDiscounts.push({
          id: combo.id,
          name: combo.name,
          scope: DISCOUNT_SCOPE.COMBO,
          amount: comboDiscount,
          details: `${comboCount}x bundle (${(combo.comboProductNames || []).join(' + ')})`
        });

        // Deduct consumed items for subsequent combos
        requiredProductIds.forEach(pId => {
          comboConsumedQty[pId] = Math.max(0, (comboConsumedQty[pId] || 0) - comboCount);
        });
      }
    }
  });

  // 2. Process PRODUCT-SPECIFIC discounts
  const productRules = activeRules.filter(r => r.scope === DISCOUNT_SCOPE.PRODUCT);
  productRules.forEach(rule => {
    const targetItem = items.find(i => i.productId === rule.targetProductId);
    if (targetItem) {
      let productDiscount = 0;
      const lineItemTotal = targetItem.unitPrice * targetItem.quantity;

      if (rule.type === DISCOUNT_TYPE.PERCENTAGE || rule.type === 'Percentage') {
        productDiscount = (lineItemTotal * rule.value) / 100;
      } else {
        // Fixed discount per unit
        productDiscount = Math.min(lineItemTotal, rule.value * targetItem.quantity);
      }

      productDiscount = Math.round(productDiscount * 100) / 100;

      if (productDiscount > 0) {
        totalDiscount += productDiscount;
        appliedDiscounts.push({
          id: rule.id,
          name: rule.name,
          scope: DISCOUNT_SCOPE.PRODUCT,
          amount: productDiscount,
          details: `${targetItem.productName} (${targetItem.quantity}x)`
        });
      }
    }
  });

  // 3. Process ORDER-LEVEL discounts
  const orderRules = activeRules.filter(r => !r.scope || r.scope === DISCOUNT_SCOPE.ORDER);
  const subtotal = calculateSubtotal(items);
  // Apply the best active order-level discount if any exists
  if (orderRules.length > 0) {
    const orderRule = orderRules[0]; // Active main order discount
    let orderDiscount = 0;

    if (orderRule.type === DISCOUNT_TYPE.PERCENTAGE || orderRule.type === 'Percentage') {
      orderDiscount = (subtotal * orderRule.value) / 100;
    } else {
      orderDiscount = Math.min(subtotal, orderRule.value);
    }

    orderDiscount = Math.round(orderDiscount * 100) / 100;

    if (orderDiscount > 0) {
      totalDiscount += orderDiscount;
      appliedDiscounts.push({
        id: orderRule.id,
        name: orderRule.name,
        scope: DISCOUNT_SCOPE.ORDER,
        amount: orderDiscount,
        details: `${orderRule.value}${orderRule.type === DISCOUNT_TYPE.PERCENTAGE ? '%' : '₹'} on Order Total`
      });
    }
  }

  // Ensure total discount does not exceed subtotal
  totalDiscount = Math.min(subtotal, Math.round(totalDiscount * 100) / 100);

  return {
    totalDiscount,
    appliedDiscounts
  };
};

/**
 * Backward compatible discount calculation
 */
export const calculateDiscount = (subtotal, discountRule, items = []) => {
  if (Array.isArray(discountRule)) {
    return calculateComprehensiveDiscounts(items, discountRule).totalDiscount;
  }
  if (!discountRule || !discountRule.status || discountRule.status !== 'ACTIVE') {
    return 0;
  }
  if (!isDiscountTimeValid(discountRule)) {
    return 0;
  }

  // If it is a product specific discount
  if (discountRule.scope === DISCOUNT_SCOPE.PRODUCT && items.length > 0) {
    const targetItem = items.find(i => i.productId === discountRule.targetProductId);
    if (!targetItem) return 0;
    if (discountRule.type === DISCOUNT_TYPE.PERCENTAGE || discountRule.type === 'Percentage') {
      return Math.round(((targetItem.unitPrice * targetItem.quantity * discountRule.value) / 100) * 100) / 100;
    }
    return Math.min(targetItem.unitPrice * targetItem.quantity, discountRule.value * targetItem.quantity);
  }

  // If order-level discount
  let discountAmount = 0;
  if (discountRule.type === DISCOUNT_TYPE.PERCENTAGE || discountRule.type === 'Percentage') {
    discountAmount = (subtotal * discountRule.value) / 100;
  } else if (discountRule.type === DISCOUNT_TYPE.FIXED || discountRule.type === 'Fixed Amount') {
    discountAmount = Math.min(subtotal, discountRule.value);
  }

  return Math.round(discountAmount * 100) / 100;
};

export const calculateGrandTotal = (subtotal, discount = 0) => {
  const total = subtotal - discount;
  return Math.max(0, Math.round(total * 100) / 100);
};

export const calculateChange = (cashReceived, grandTotal) => {
  if (cashReceived < grandTotal) return 0;
  return Math.round((cashReceived - grandTotal) * 100) / 100;
};

export const formatCurrency = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

export const formatDateOnly = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatTimeOnly = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};
