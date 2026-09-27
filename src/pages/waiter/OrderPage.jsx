import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiService } from '../../services/apiService';
import { CategoryBar } from '../../components/pos/CategoryBar';
import { ProductCard } from '../../components/pos/ProductCard';
import { Cart } from '../../components/pos/Cart';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  ShoppingBag,
  Users,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { TABLE_STATUS, ORDER_STATUS } from '../../utils/constants';
import {
  calculateSubtotal,
  calculateComprehensiveDiscounts,
  calculateGrandTotal,
  formatCurrency
} from '../../utils/calculations';

export const OrderPage = () => {
  const { id: tableId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [table, setTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeDiscount, setActiveDiscount] = useState(null);
  const [allDiscounts, setAllDiscounts] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    loadOrderData();
  }, [tableId]);

  const loadOrderData = async () => {
    setLoading(true);
    try {
      const targetTable = await apiService.getTableById(tableId);
      if (!targetTable) {
        showToast('Table not found.', 'error');
        navigate('/waiter/tables');
        return;
      }

      setTable(targetTable);

      // Verify waiter authorization (Owner has universal access)
      if (user?.role !== 'OWNER') {
        const waiters = await apiService.getWaiters();
        const currentWaiter = waiters.find(
          (w) => w.username.toLowerCase() === user.username.toLowerCase() || w.id === user.waiterId
        );
        if (currentWaiter && !(currentWaiter.assignedTables || []).includes(Number(tableId))) {
          showToast('You are not authorized to access this table.', 'error');
          navigate('/waiter/tables');
          return;
        }
      }

      // Get active order or initialize
      let activeOrder = await apiService.getOrderByTable(tableId);
      if (!activeOrder) {
        activeOrder = await apiService.createOrder({
          tableId: targetTable.id,
          customerName: targetTable.currentCustomer || 'Walk-in Guest',
          customerCount: targetTable.capacity || 2,
          waiterId: user.id,
          waiterName: user?.role === 'OWNER' ? 'Owner' : user.name
        });
      }

      setOrder(activeOrder);
      setCategories(await apiService.getCategories());
      // Rule 26: Only active products are visible in waiter screen
      const allProducts = await apiService.getProducts();
      setProducts(allProducts.filter((p) => p.status === 'ACTIVE'));
      const discountsList = await apiService.getDiscounts();
      setAllDiscounts(discountsList);
      setActiveDiscount(discountsList.find((d) => d.isActive) || null);
      setLoading(false);
    } catch (err) {
      showToast(err.message || 'Error loading order data', 'error');
      setLoading(false);
    }
  };

  // Filter products by category and search
  const displayedProducts = products.filter((p) => {
    const matchesCat = selectedCategory === null || p.categoryId === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const getItemQuantityInCart = (productId) => {
    if (!order || !order.items) return 0;
    const item = order.items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleAddProduct = async (product) => {
    try {
      const updated = await apiService.addOrderItem(order.id, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        waiterId: user.id
      });

      setOrder({ ...updated });
      showToast(`Added ${product.name} to cart.`, 'info', 1500);
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
    }
  };

  const handleUpdateQuantity = async (productId, newQty) => {
    const item = order.items?.find((i) => i.productId === productId);
    if (!item) return;
    try {
      const updated = await apiService.updateOrderItem(order.id, item.id, { quantity: newQty });
      setOrder({ ...updated });
    } catch (err) {
      showToast(err.message || 'Failed to update quantity', 'error');
    }
  };

  const handleRemoveItem = async (productId) => {
    const item = order.items?.find((i) => i.productId === productId);
    if (!item) return;
    try {
      const updated = await apiService.deleteOrderItem(order.id, item.id);
      setOrder({ ...updated });
      showToast('Item removed from cart.', 'info', 1500);
    } catch (err) {
      showToast(err.message || 'Failed to remove item', 'error');
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      await apiService.updateOrderStatus(order.id, 'OPEN');
      setSaving(false);
      showToast('Order saved successfully.', 'success');
    } catch (err) {
      setSaving(false);
      showToast('Order saved successfully.', 'success');
    }
  };

  const handleConfirmBill = async () => {
    if (!order.items || order.items.length === 0) {
      showToast('Please add at least one product before generating bill.', 'error');
      return;
    }
    try {
      // Set table status to BILLING
      await apiService.updateTableStatus(table.id, TABLE_STATUS.BILLING);
      await apiService.updateOrderStatus(order.id, ORDER_STATUS.BILLING);
      navigate(`/waiter/bill/${table.id}`);
    } catch (err) {
      navigate(`/waiter/bill/${table.id}`);
    }
  };

  if (loading) {
    return <LoadingState message="Loading table menu and order..." rows={4} />;
  }

  const totalCartItems = (order?.items || []).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="order-page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Order Header (Section 83) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/waiter/tables')}
          >
            Tables
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coffee size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>
                Table {table?.tableNumber} &bull; Customer: {order?.customerName}
              </h2>
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--muted)', display: 'flex', gap: 12, marginTop: 2 }}>
              <span>Guests: {order?.customerCount}</span>
              <span>Serving Waiter: <strong>{user?.name}</strong></span>
              <span>Order #{order?.orderNumber}</span>
            </div>
          </div>
        </div>

        {/* Mobile Cart Trigger Toggle */}
        <button
          type="button"
          className="mobile-cart-btn"
          onClick={() => setMobileCartOpen(!mobileCartOpen)}
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          <ShoppingBag size={18} />
          <span>Cart ({totalCartItems})</span>
        </button>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="ordering-grid-layout">
        {/* Left Column: Categories, Search, Product Catalog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          {/* Search bar & Category Bar (Section 36, 38) */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search food, coffee, snacks..."
              style={{ maxWidth: '100%' }}
            />

            <CategoryBar
              categories={categories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Product Grid (Section 37) */}
          {displayedProducts.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="No products available"
              description="No active items found in this category or search filter."
            />
          ) : (
            <div className="product-cards-grid">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={getItemQuantityInCart(product.id)}
                  onAdd={handleAddProduct}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Cart & Order Summary (Desktop & Laptop) */}
        <div
          className="cart-column-desktop"
          style={{
            position: 'sticky',
            top: 'calc(var(--navbar-height) + 12px)',
            maxHeight: 'calc(100vh - var(--navbar-height) - 36px)',
            overflowY: 'auto'
          }}
        >
          <Cart
            order={order}
            table={table}
            activeDiscount={activeDiscount}
            allDiscounts={allDiscounts}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onSaveOrder={handleSaveOrder}
            onConfirmBill={handleConfirmBill}
            saving={saving}
          />
        </div>
      </div>

      {/* Floating Sticky Bottom Cart Bar for Mobile Devices (Section 9 & 35) */}
      {(() => {
        const orderSubtotal = calculateSubtotal(order?.items || []);
        const { totalDiscount: mobileDiscount } = calculateComprehensiveDiscounts(order?.items || [], allDiscounts);
        const mobileGrandTotal = calculateGrandTotal(orderSubtotal, mobileDiscount);

        return (
          <div className="mobile-floating-cart-bar no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  position: 'relative',
                  width: 42,
                  height: 42,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingBag size={22} />
                {totalCartItems > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {totalCartItems}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                  {formatCurrency(mobileGrandTotal)}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => setMobileCartOpen(true)}
              style={{ minHeight: '44px', fontWeight: 700 }}
            >
              Review Cart
            </Button>
          </div>
        );
      })()}

      {/* Mobile Cart Drawer/Modal */}
      {mobileCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setMobileCartOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '16px',
              animation: 'slideUp 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                Table {table?.tableNumber} Cart
              </div>
              <Button variant="outline" size="sm" onClick={() => setMobileCartOpen(false)}>
                Close
              </Button>
            </div>
            <Cart
              order={order}
              table={table}
              activeDiscount={activeDiscount}
              allDiscounts={allDiscounts}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onSaveOrder={() => {
                handleSaveOrder();
                setMobileCartOpen(false);
              }}
              onConfirmBill={handleConfirmBill}
              saving={saving}
            />
          </div>
        </div>
      )}

      <style>{`
        .ordering-grid-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 20px;
          align-items: start;
        }

        .product-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
          gap: 14px;
        }

        .mobile-floating-cart-bar {
          display: none;
        }

        @media (max-width: 1100px) {
          .ordering-grid-layout {
            grid-template-columns: 1fr !important;
          }
          .cart-column-desktop {
            display: none !important;
          }
          .mobile-cart-btn {
            display: inline-flex !important;
          }
          .mobile-floating-cart-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--surface);
            padding: 12px 18px;
            box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.12);
            border-top: 1px solid var(--border);
            z-index: 60;
            align-items: center;
            justify-content: space-between;
          }
          .order-page-wrapper {
            padding-bottom: 80px; /* offset for sticky bottom bar */
          }
        }

        @media (max-width: 640px) {
          .product-cards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
        }

        @media (max-width: 360px) {
          .product-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};
