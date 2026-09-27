import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Edit2,
  Power,
  Percent,
  Clock,
  Tag,
  Gift,
  Layers,
  Search,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { DISCOUNT_TYPE, DISCOUNT_SCOPE } from '../../utils/constants';

export const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ORDER' | 'PRODUCT' | 'COMBO'
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    scope: DISCOUNT_SCOPE.ORDER,
    targetProductId: '',
    comboProductIds: [],
    type: DISCOUNT_TYPE.PERCENTAGE,
    value: '',
    startTime: '00:00',
    endTime: '23:59',
    status: 'ACTIVE',
    forceApply: true,
    description: ''
  });

  const [comboSearch, setComboSearch] = useState('');
  const [formError, setFormError] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [discs, prods] = await Promise.all([
        apiService.getDiscounts(),
        apiService.getProducts()
      ]);
      setDiscounts(discs);
      setProducts(prods);
    } catch (err) {
      showToast(err.message || 'Failed to load discounts data.', 'error');
    }
  };

  const handleOpenAdd = (defaultScope = DISCOUNT_SCOPE.ORDER) => {
    setFormData({
      name: '',
      scope: defaultScope,
      targetProductId: products[0]?.id ? String(products[0].id) : '',
      comboProductIds: [],
      type: defaultScope === DISCOUNT_SCOPE.ORDER ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.FIXED,
      value: '',
      startTime: '00:00',
      endTime: '23:59',
      status: 'ACTIVE',
      forceApply: true,
      description: ''
    });
    setComboSearch('');
    setFormError('');
    setAddModalOpen(true);
  };

  const handleOpenEdit = (discount) => {
    setSelectedDiscount(discount);
    setFormData({
      name: discount.name,
      scope: discount.scope || DISCOUNT_SCOPE.ORDER,
      targetProductId: discount.targetProductId ? String(discount.targetProductId) : '',
      comboProductIds: discount.comboProductIds ? [...discount.comboProductIds] : [],
      type: discount.type,
      value: String(discount.value),
      startTime: discount.startTime || '00:00',
      endTime: discount.endTime || '23:59',
      status: discount.status,
      forceApply: discount.forceApply !== undefined ? discount.forceApply : true,
      description: discount.description || ''
    });
    setComboSearch('');
    setFormError('');
    setEditModalOpen(true);
  };

  const handleToggleComboProduct = (productId) => {
    const id = Number(productId);
    setFormData((prev) => {
      const exists = prev.comboProductIds.includes(id);
      const updated = exists
        ? prev.comboProductIds.filter((pId) => pId !== id)
        : [...prev.comboProductIds, id];
      return { ...prev, comboProductIds: updated };
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Discount or combo title is required.');
      return false;
    }
    const val = Number(formData.value);
    if (!val || val <= 0) {
      setFormError('Discount value must be greater than 0.');
      return false;
    }
    if (formData.scope === DISCOUNT_SCOPE.PERCENTAGE && val > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return false;
    }
    if (formData.scope === DISCOUNT_SCOPE.PRODUCT && !formData.targetProductId) {
      setFormError('Please select a specific target product for this discount.');
      return false;
    }
    if (formData.scope === DISCOUNT_SCOPE.COMBO) {
      if (!formData.comboProductIds || formData.comboProductIds.length < 2) {
        setFormError('Please select at least 2 items to bundle into a combo deal.');
        return false;
      }
    }
    return true;
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;
    setConfirmAddOpen(true);
  };

  const handleConfirmAdd = async () => {
    try {
      await apiService.createDiscount(formData);
      showToast(`Created ${formData.scope === DISCOUNT_SCOPE.COMBO ? 'combo offer' : 'discount rule'} successfully.`, 'success');
      setConfirmAddOpen(false);
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create discount.', 'error');
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;
    setConfirmEditOpen(true);
  };

  const handleConfirmEdit = async () => {
    try {
      await apiService.updateDiscount(selectedDiscount.id, formData);
      showToast('Discount updated successfully.', 'success');
      setConfirmEditOpen(false);
      setEditModalOpen(false);
      setSelectedDiscount(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update discount.', 'error');
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      const res = await apiService.toggleDiscountStatus(discount.id);
      const newStatus = res.status || (discount.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
      showToast(
        `${discount.name} is now ${newStatus}.`,
        newStatus === 'ACTIVE' ? 'success' : 'info'
      );
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle status.', 'error');
    }
  };

  // Filtered discounts by tab
  const filteredDiscounts = useMemo(() => {
    if (activeTab === 'ALL') return discounts;
    return discounts.filter((d) => (d.scope || DISCOUNT_SCOPE.ORDER) === activeTab);
  }, [discounts, activeTab]);

  const counts = useMemo(() => {
    return {
      all: discounts.length,
      order: discounts.filter((d) => (d.scope || DISCOUNT_SCOPE.ORDER) === DISCOUNT_SCOPE.ORDER).length,
      product: discounts.filter((d) => d.scope === DISCOUNT_SCOPE.PRODUCT).length,
      combo: discounts.filter((d) => d.scope === DISCOUNT_SCOPE.COMBO).length
    };
  }, [discounts]);

  // Filtered products for combo selector
  const eligibleComboProducts = useMemo(() => {
    if (!comboSearch.trim()) return products;
    const q = comboSearch.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.categoryName && p.categoryName.toLowerCase().includes(q))
    );
  }, [products, comboSearch]);

  // Selected combo items sum
  const comboSum = useMemo(() => {
    if (!formData.comboProductIds || formData.comboProductIds.length === 0) return 0;
    return formData.comboProductIds.reduce((sum, pId) => {
      const p = products.find((prod) => prod.id === Number(pId));
      return sum + (p ? Number(p.price) : 0);
    }, 0);
  }, [formData.comboProductIds, products]);

  const targetProduct = useMemo(() => {
    if (!formData.targetProductId) return null;
    return products.find((p) => p.id === Number(formData.targetProductId)) || null;
  }, [formData.targetProductId, products]);

  return (
    <div>
      <PageHeader
        title="Discounts & Combo Offers"
        subtitle="Create automated combo deals, item-specific markdowns, and lunch specials"
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              icon={Gift}
              onClick={() => handleOpenAdd(DISCOUNT_SCOPE.COMBO)}
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              + Add Combo Deal
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => handleOpenAdd(DISCOUNT_SCOPE.ORDER)}
            >
              + Add Discount
            </Button>
          </div>
        }
      />

      {/* Scope Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 4
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: activeTab === 'ALL' ? '2px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: activeTab === 'ALL' ? 'var(--primary-light)' : 'var(--surface)',
            color: activeTab === 'ALL' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>All Promotions</span>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface-alt)', padding: '2px 7px', borderRadius: '10px' }}>
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(DISCOUNT_SCOPE.COMBO)}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: activeTab === DISCOUNT_SCOPE.COMBO ? '2px solid #8e24aa' : '1px solid var(--border)',
            backgroundColor: activeTab === DISCOUNT_SCOPE.COMBO ? '#f3e5f5' : 'var(--surface)',
            color: activeTab === DISCOUNT_SCOPE.COMBO ? '#8e24aa' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Gift size={16} />
          <span>Combo Deals</span>
          <span style={{ fontSize: '0.75rem', backgroundColor: activeTab === DISCOUNT_SCOPE.COMBO ? '#e1bee7' : 'var(--surface-alt)', padding: '2px 7px', borderRadius: '10px' }}>
            {counts.combo}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(DISCOUNT_SCOPE.PRODUCT)}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: activeTab === DISCOUNT_SCOPE.PRODUCT ? '2px solid #1976d2' : '1px solid var(--border)',
            backgroundColor: activeTab === DISCOUNT_SCOPE.PRODUCT ? '#e3f2fd' : 'var(--surface)',
            color: activeTab === DISCOUNT_SCOPE.PRODUCT ? '#1976d2' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Tag size={16} />
          <span>Product Specific</span>
          <span style={{ fontSize: '0.75rem', backgroundColor: activeTab === DISCOUNT_SCOPE.PRODUCT ? '#bbdefb' : 'var(--surface-alt)', padding: '2px 7px', borderRadius: '10px' }}>
            {counts.product}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(DISCOUNT_SCOPE.ORDER)}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            border: activeTab === DISCOUNT_SCOPE.ORDER ? '2px solid #2e7d32' : '1px solid var(--border)',
            backgroundColor: activeTab === DISCOUNT_SCOPE.ORDER ? '#e8f5e9' : 'var(--surface)',
            color: activeTab === DISCOUNT_SCOPE.ORDER ? '#2e7d32' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Percent size={16} />
          <span>Order Level</span>
          <span style={{ fontSize: '0.75rem', backgroundColor: activeTab === DISCOUNT_SCOPE.ORDER ? '#c8e6c9' : 'var(--surface-alt)', padding: '2px 7px', borderRadius: '10px' }}>
            {counts.order}
          </span>
        </button>
      </div>

      {/* Grid of Discounts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        {filteredDiscounts.map((discount) => {
          const isCombo = discount.scope === DISCOUNT_SCOPE.COMBO;
          const isProduct = discount.scope === DISCOUNT_SCOPE.PRODUCT;
          const accentColor = isCombo ? '#8e24aa' : isProduct ? '#1976d2' : '#2e7d32';
          const bgPillColor = isCombo ? '#f3e5f5' : isProduct ? '#e3f2fd' : '#e8f5e9';

          return (
            <Card
              key={discount.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `5px solid ${discount.status === 'ACTIVE' ? accentColor : 'var(--muted)'}`
              }}
            >
              <div>
                {/* Card Top: Name & Scope Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: bgPillColor,
                          color: accentColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {isCombo ? <Gift size={12} /> : isProduct ? <Tag size={12} /> : <Percent size={12} />}
                        {isCombo ? 'Combo Deal' : isProduct ? 'Product Deal' : 'Order Level'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                      {discount.name}
                    </h3>
                  </div>
                  <StatusBadge status={discount.status} />
                </div>

                {/* Savings Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    marginBottom: 14,
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: accentColor }}>
                      {discount.type === DISCOUNT_TYPE.PERCENTAGE ? `${discount.value}%` : `₹${discount.value}`} OFF
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {isCombo ? 'per bundle' : isProduct ? 'per item' : 'on subtotal'}
                    </span>
                  </div>

                  {/* Combo or Target Product Details */}
                  {isCombo && discount.comboProductNames && discount.comboProductNames.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        BUNDLE ITEMS:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {discount.comboProductNames.map((name, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#f3e5f5',
                              color: '#6a1b9a',
                              border: '1px solid #e1bee7'
                            }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isProduct && discount.targetProductName && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
                        APPLIES TO:{' '}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#1565c0' }}>
                        {discount.targetProductName}
                      </strong>
                    </div>
                  )}

                  {/* Timing & Mode */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 10 }}>
                    <Clock size={15} />
                    <span>
                      {discount.startTime} – {discount.endTime}
                    </span>
                    {discount.forceApply && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginLeft: 'auto' }}>
                        (Always Active)
                      </span>
                    )}
                  </div>
                </div>

                {discount.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 14 }}>
                    {discount.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(discount)}
                >
                  Edit
                </Button>
                <Button
                  variant={discount.status === 'ACTIVE' ? 'secondary' : 'success'}
                  size="sm"
                  icon={Power}
                  onClick={() => handleToggleStatus(discount)}
                >
                  {discount.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Discount Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={formData.scope === DISCOUNT_SCOPE.COMBO ? 'Create New Combo Deal' : 'Add Discount Rule'}
      >
        <form onSubmit={handleSaveAdd}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {formError && <div className="form-error">{formError}</div>}

            {/* Scope Selection */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
                Promotion Category:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 90px), 1fr))', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: DISCOUNT_SCOPE.ORDER, type: DISCOUNT_TYPE.PERCENTAGE })}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: formData.scope === DISCOUNT_SCOPE.ORDER ? '2px solid #2e7d32' : '1px solid var(--border)',
                    backgroundColor: formData.scope === DISCOUNT_SCOPE.ORDER ? '#e8f5e9' : 'var(--surface)',
                    color: formData.scope === DISCOUNT_SCOPE.ORDER ? '#2e7d32' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Percent size={18} />
                  <span>Whole Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: DISCOUNT_SCOPE.PRODUCT, type: DISCOUNT_TYPE.FIXED })}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: formData.scope === DISCOUNT_SCOPE.PRODUCT ? '2px solid #1976d2' : '1px solid var(--border)',
                    backgroundColor: formData.scope === DISCOUNT_SCOPE.PRODUCT ? '#e3f2fd' : 'var(--surface)',
                    color: formData.scope === DISCOUNT_SCOPE.PRODUCT ? '#1976d2' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Tag size={18} />
                  <span>Single Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: DISCOUNT_SCOPE.COMBO, type: DISCOUNT_TYPE.FIXED })}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: formData.scope === DISCOUNT_SCOPE.COMBO ? '2px solid #8e24aa' : '1px solid var(--border)',
                    backgroundColor: formData.scope === DISCOUNT_SCOPE.COMBO ? '#f3e5f5' : 'var(--surface)',
                    color: formData.scope === DISCOUNT_SCOPE.COMBO ? '#8e24aa' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Gift size={18} />
                  <span>Combo Deal</span>
                </button>
              </div>
            </div>

            <Input
              label="Promotion Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={
                formData.scope === DISCOUNT_SCOPE.COMBO
                  ? 'e.g. Burger + Cold Coffee Combo'
                  : formData.scope === DISCOUNT_SCOPE.PRODUCT
                  ? 'e.g. Cold Coffee Happy Hour'
                  : 'e.g. Lunch Special 10% Off'
              }
              required
            />

            {/* If Single Product Discount: choose target item */}
            {formData.scope === DISCOUNT_SCOPE.PRODUCT && (
              <div>
                <Select
                  label="Select Qualifying Product"
                  value={formData.targetProductId}
                  onChange={(e) => setFormData({ ...formData, targetProductId: e.target.value })}
                  options={products.map((p) => ({
                    value: String(p.id),
                    label: `${p.name} (Regular ₹${p.price})`
                  }))}
                  required
                />
                {targetProduct && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 4 }}>
                    Regular item price: <strong>₹{targetProduct.price}</strong>
                  </div>
                )}
              </div>
            )}

            {/* If Combo Deal: pick bundled products */}
            {formData.scope === DISCOUNT_SCOPE.COMBO && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
                    Select Products in this Combo (Min 2):
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8e24aa' }}>
                    {formData.comboProductIds.length} Selected
                  </span>
                </div>

                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
                  <input
                    type="text"
                    value={comboSearch}
                    onChange={(e) => setComboSearch(e.target.value)}
                    placeholder="Search items to bundle..."
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 34px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
                    gap: 6,
                    paddingRight: 4
                  }}
                >
                  {eligibleComboProducts.map((p) => {
                    const isSelected = formData.comboProductIds.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleToggleComboProduct(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid #8e24aa' : '1px solid var(--border)',
                          backgroundColor: isSelected ? '#f3e5f5' : 'var(--surface)',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSelected ? 700 : 500 }}>
                          {p.name}
                        </span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 4 }}>
                          ₹{p.price}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {formData.comboProductIds.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Original combined price: <strong>₹{comboSum}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Discount Value & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
              <Select
                label="Discount Calculation"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: DISCOUNT_TYPE.FIXED, label: 'Fixed Amount (₹ OFF)' },
                  { value: DISCOUNT_TYPE.PERCENTAGE, label: 'Percentage (% OFF)' }
                ]}
                required
              />

              <Input
                label={`Discount Value (${formData.type === DISCOUNT_TYPE.PERCENTAGE ? '%' : '₹'})`}
                type="number"
                min="1"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === DISCOUNT_TYPE.PERCENTAGE ? 'e.g. 10' : 'e.g. 40'}
                required
              />
            </div>

            {/* Timing */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
              <Input
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
            />

            <Input
              label="Description / Marketing Text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Order Veg Burger and Cold Coffee together to save ₹40!"
            />
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Promotion
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Discount Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Promotion: ${selectedDiscount?.name || ''}`}
      >
        <form onSubmit={handleSaveEdit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {formError && <div className="form-error">{formError}</div>}

            {/* Scope Selection */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>
                Promotion Category:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 90px), 1fr))', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: DISCOUNT_SCOPE.ORDER })}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: formData.scope === DISCOUNT_SCOPE.ORDER ? '2px solid #2e7d32' : '1px solid var(--border)',
                    backgroundColor: formData.scope === DISCOUNT_SCOPE.ORDER ? '#e8f5e9' : 'var(--surface)',
                    color: formData.scope === DISCOUNT_SCOPE.ORDER ? '#2e7d32' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Percent size={18} />
                  <span>Whole Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: DISCOUNT_SCOPE.PRODUCT })}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: formData.scope === DISCOUNT_SCOPE.PRODUCT ? '2px solid #1976d2' : '1px solid var(--border)',
                    backgroundColor: formData.scope === DISCOUNT_SCOPE.PRODUCT ? '#e3f2fd' : 'var(--surface)',
                    color: formData.scope === DISCOUNT_SCOPE.PRODUCT ? '#1976d2' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Tag size={18} />
                  <span>Single Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: DISCOUNT_SCOPE.COMBO })}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: formData.scope === DISCOUNT_SCOPE.COMBO ? '2px solid #8e24aa' : '1px solid var(--border)',
                    backgroundColor: formData.scope === DISCOUNT_SCOPE.COMBO ? '#f3e5f5' : 'var(--surface)',
                    color: formData.scope === DISCOUNT_SCOPE.COMBO ? '#8e24aa' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Gift size={18} />
                  <span>Combo Deal</span>
                </button>
              </div>
            </div>

            <Input
              label="Promotion Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            {/* If Single Product: choose target item */}
            {formData.scope === DISCOUNT_SCOPE.PRODUCT && (
              <div>
                <Select
                  label="Select Qualifying Product"
                  value={formData.targetProductId}
                  onChange={(e) => setFormData({ ...formData, targetProductId: e.target.value })}
                  options={products.map((p) => ({
                    value: String(p.id),
                    label: `${p.name} (Regular ₹${p.price})`
                  }))}
                  required
                />
              </div>
            )}

            {/* If Combo Deal: pick bundled products */}
            {formData.scope === DISCOUNT_SCOPE.COMBO && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
                    Products in this Combo:
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8e24aa' }}>
                    {formData.comboProductIds.length} Selected
                  </span>
                </div>

                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
                  <input
                    type="text"
                    value={comboSearch}
                    onChange={(e) => setComboSearch(e.target.value)}
                    placeholder="Search items..."
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 34px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
                    gap: 6,
                    paddingRight: 4
                  }}
                >
                  {eligibleComboProducts.map((p) => {
                    const isSelected = formData.comboProductIds.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleToggleComboProduct(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid #8e24aa' : '1px solid var(--border)',
                          backgroundColor: isSelected ? '#f3e5f5' : 'var(--surface)',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSelected ? 700 : 500 }}>
                          {p.name}
                        </span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.75rem', marginLeft: 4 }}>
                          ₹{p.price}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {formData.comboProductIds.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Original combined price: <strong>₹{comboSum}</strong>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
              <Select
                label="Discount Calculation"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: DISCOUNT_TYPE.FIXED, label: 'Fixed Amount (₹ OFF)' },
                  { value: DISCOUNT_TYPE.PERCENTAGE, label: 'Percentage (% OFF)' }
                ]}
                required
              />

              <Input
                label={`Discount Value (${formData.type === DISCOUNT_TYPE.PERCENTAGE ? '%' : '₹'})`}
                type="number"
                min="1"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
              <Input
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
            />

            <Input
              label="Description / Marketing Text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Promotion
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Add Promotion Dialog */}
      <ConfirmDialog
        isOpen={confirmAddOpen}
        onClose={() => setConfirmAddOpen(false)}
        onConfirm={handleConfirmAdd}
        title={formData.scope === DISCOUNT_SCOPE.COMBO ? 'Confirm Combo Deal' : 'Confirm Discount Rule'}
        confirmText="Yes, Create Promotion"
        cancelText="Back to Edit"
        message="Please review the discount details before activating it in the system:"
      >
        <div
          style={{
            backgroundColor: 'var(--surface-alt)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            padding: '14px',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Category:</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor:
                  formData.scope === DISCOUNT_SCOPE.COMBO
                    ? '#f3e5f5'
                    : formData.scope === DISCOUNT_SCOPE.PRODUCT
                    ? '#e3f2fd'
                    : '#e8f5e9',
                color:
                  formData.scope === DISCOUNT_SCOPE.COMBO
                    ? '#8e24aa'
                    : formData.scope === DISCOUNT_SCOPE.PRODUCT
                    ? '#1976d2'
                    : '#2e7d32'
              }}
            >
              {formData.scope === DISCOUNT_SCOPE.COMBO
                ? 'COMBO DEAL'
                : formData.scope === DISCOUNT_SCOPE.PRODUCT
                ? 'SINGLE ITEM'
                : 'WHOLE ORDER'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Promotion Name:</span>
            <strong style={{ color: 'var(--text)' }}>{formData.name}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Discount Value:</span>
            <strong style={{ color: 'var(--primary)' }}>
              {formData.type === DISCOUNT_TYPE.PERCENTAGE ? `${formData.value}% OFF` : `₹${Number(formData.value || 0).toFixed(2)} OFF`}
            </strong>
          </div>

          {formData.scope === DISCOUNT_SCOPE.PRODUCT && targetProduct && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Applies To:</span>
              <span style={{ color: 'var(--text)' }}>{targetProduct.name} (₹{targetProduct.price})</span>
            </div>
          )}

          {formData.scope === DISCOUNT_SCOPE.COMBO && (
            <div>
              <div style={{ color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Combo Items:</div>
              <div style={{ paddingLeft: 8, borderLeft: '2px solid #8e24aa', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(formData.comboProductIds || []).map((id) => {
                  const p = products.find((prod) => prod.id === Number(id));
                  return p ? (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text)' }}>
                      <span>• {p.name}</span>
                      <span style={{ color: 'var(--muted)' }}>₹{p.price}</span>
                    </div>
                  ) : null;
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 4, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
                  <span>Combined Regular Price:</span>
                  <span>₹{comboSum.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Active Hours:</span>
            <span style={{ color: 'var(--text)' }}>{formData.startTime} – {formData.endTime}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Status:</span>
            <span style={{ fontWeight: 700, color: formData.status === 'ACTIVE' ? 'var(--success)' : 'var(--muted)' }}>
              {formData.status}
            </span>
          </div>
        </div>
      </ConfirmDialog>

      {/* Confirm Edit Promotion Dialog */}
      <ConfirmDialog
        isOpen={confirmEditOpen}
        onClose={() => setConfirmEditOpen(false)}
        onConfirm={handleConfirmEdit}
        title="Confirm Promotion Changes"
        confirmText="Yes, Update Rule"
        cancelText="Back to Edit"
        message={`Are you sure you want to save changes to "${selectedDiscount?.name}"?`}
      >
        <div
          style={{
            backgroundColor: 'var(--surface-alt)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            padding: '12px 14px',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 8
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Updated Name:</span>
            <strong style={{ color: 'var(--text)' }}>{formData.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Discount Value:</span>
            <strong style={{ color: 'var(--primary)' }}>
              {formData.type === DISCOUNT_TYPE.PERCENTAGE ? `${formData.value}% OFF` : `₹${Number(formData.value || 0).toFixed(2)} OFF`}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Active Hours:</span>
            <span style={{ color: 'var(--text)' }}>{formData.startTime} – {formData.endTime}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Status:</span>
            <span style={{ fontWeight: 700, color: formData.status === 'ACTIVE' ? 'var(--success)' : 'var(--muted)' }}>
              {formData.status}
            </span>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
};
