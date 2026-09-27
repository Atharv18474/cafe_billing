import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Power, Package, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    status: 'ACTIVE'
  });
  const [formError, setFormError] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      showToast(err.message || 'Failed to load data.', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || p.categoryId === Number(categoryFilter);
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
      description: '',
      price: '',
      status: 'ACTIVE'
    });
    setFormError('');
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Please select a category.');
      return;
    }
    const priceNum = Number(formData.price);
    if (!priceNum || priceNum <= 0) {
      setFormError('Price must be greater than 0.');
      return;
    }

    try {
      await apiService.createProduct({
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        description: formData.description,
        price: priceNum,
        status: formData.status
      });
      showToast('Product added successfully.', 'success');
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to add product.');
    }
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      categoryId: String(product.categoryId),
      description: product.description || '',
      price: String(product.price),
      status: product.status
    });
    setFormError('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Please select a category.');
      return;
    }
    const priceNum = Number(formData.price);
    if (!priceNum || priceNum <= 0) {
      setFormError('Price must be greater than 0.');
      return;
    }

    try {
      await apiService.updateProduct(selectedProduct.id, {
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        description: formData.description,
        price: priceNum,
        status: formData.status
      });
      showToast('Product updated successfully.', 'success');
      setEditModalOpen(false);
      setSelectedProduct(null);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update product.');
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await apiService.updateProduct(product.id, { status: newStatus });
      showToast(
        newStatus === 'ACTIVE'
          ? `${product.name} activated.`
          : `${product.name} deactivated. It will be hidden from waiters.`,
        newStatus === 'ACTIVE' ? 'success' : 'info'
      );
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle product status.', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Products Management"
        subtitle="Manage food & beverages menu, pricing, categories, and availability"
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Add Product
          </Button>
        }
      />

      {/* Notice Banner: Price Update & Deactivation Rules */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          backgroundColor: 'var(--info-bg)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--info-border)',
          color: 'var(--info)',
          fontSize: '0.825rem',
          marginBottom: 20
        }}
      >
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Rule 26 & 27:</strong> Inactive products are automatically hidden from waiter ordering terminals. Updating a product price updates new orders only; historical orders and bills retain original recorded unit prices.
        </span>
      </div>

      {/* Search and Filters Bar (Section 23, 56) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 20,
          flexWrap: 'wrap',
          backgroundColor: 'var(--surface)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}
      >
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search products..."
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', height: '38px' }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', height: '38px' }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Try changing your search keywords or filter selection."
          actionLabel="+ Add Product"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 700 }}>{product.name}</td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'var(--surface-alt)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      {product.categoryName}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {formatCurrency(product.price)}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 280 }}>
                    {product.description || '-'}
                  </td>
                  <td>
                    <StatusBadge status={product.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEdit(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={product.status === 'ACTIVE' ? 'secondary' : 'success'}
                        size="sm"
                        icon={Power}
                        onClick={() => handleToggleStatus(product)}
                      >
                        {product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal (Section 24) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Product"
      >
        <form onSubmit={handleSaveAdd}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Hazelnut Frappe"
              required
            />
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              required
            />
            <Input
              label="Price (₹)"
              type="number"
              min="1"
              step="0.5"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. 140"
              required
            />
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief item description..."
                className="form-textarea"
                rows="3"
              />
            </div>
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active (Visible to Waiters)' },
                { value: 'INACTIVE', label: 'Inactive (Hidden)' }
              ]}
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal (Section 25) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Product: ${selectedProduct?.name || ''}`}
      >
        <form onSubmit={handleSaveEdit}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              required
            />
            <Input
              label="Price (₹)"
              type="number"
              min="1"
              step="0.5"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
                rows="3"
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
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
