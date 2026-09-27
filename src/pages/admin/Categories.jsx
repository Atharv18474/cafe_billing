import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, Power, Layers, Eye, Package, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewProductsModalOpen, setViewProductsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [categoryName, setCategoryName] = useState('');
  const [categoryStatus, setCategoryStatus] = useState('ACTIVE');
  const [formError, setFormError] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        apiService.getCategories(),
        apiService.getProducts()
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      showToast(err.message || 'Failed to load data.', 'error');
    }
  };

  const getProductsForCategory = (categoryId) => {
    return products.filter((p) => p.categoryId === categoryId);
  };

  const getProductCount = (categoryId) => {
    return getProductsForCategory(categoryId).length;
  };

  const handleOpenAdd = () => {
    setCategoryName('');
    setCategoryStatus('ACTIVE');
    setFormError('');
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!categoryName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    try {
      await apiService.createCategory({
        name: categoryName.trim(),
        status: categoryStatus
      });
      showToast('Category added successfully.', 'success');
      setAddModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to add category.');
    }
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCategoryStatus(category.status);
    setFormError('');
    setEditModalOpen(true);
  };

  const handleOpenViewProducts = (category) => {
    setSelectedCategory(category);
    setViewProductsModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!categoryName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    try {
      await apiService.updateCategory(selectedCategory.id, {
        name: categoryName.trim(),
        status: categoryStatus
      });
      showToast('Category updated successfully.', 'success');
      setEditModalOpen(false);
      setSelectedCategory(null);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update category.');
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await apiService.updateCategory(category.id, { status: newStatus });
      showToast(
        `${category.name} status changed to ${newStatus}.`,
        newStatus === 'ACTIVE' ? 'success' : 'info'
      );
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to change status.', 'error');
    }
  };

  const categoryProducts = selectedCategory ? getProductsForCategory(selectedCategory.id) : [];

  return (
    <div>
      <PageHeader
        title="Category Management"
        subtitle="Organize menu items into categorized groups for faster order entry"
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            + Add Category
          </Button>
        }
      />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Number of Products</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} color="var(--primary)" />
                  <span>{category.name}</span>
                </td>
                <td>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--surface-alt)',
                      fontWeight: 600,
                      fontSize: '0.825rem'
                    }}
                  >
                    {getProductCount(category.id)} Products
                  </span>
                </td>
                <td>
                  <StatusBadge status={category.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleOpenViewProducts(category)}
                      title="View products in this category"
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenEdit(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={category.status === 'ACTIVE' ? 'secondary' : 'success'}
                      size="sm"
                      icon={Power}
                      onClick={() => handleToggleStatus(category)}
                    >
                      {category.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Products Modal */}
      <Modal
        isOpen={viewProductsModalOpen}
        onClose={() => setViewProductsModalOpen(false)}
        title={`Products in "${selectedCategory?.name || ''}" (${categoryProducts.length})`}
        maxWidth="560px"
      >
        <div className="modal-body" style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
          {categoryProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
              <Package size={36} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No products found in this category.</p>
              <span style={{ fontSize: '0.85rem' }}>You can add products to this category from the Products page.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categoryProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-alt)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                        {p.name}
                      </div>
                      {p.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
                          {p.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      {formatCurrency(p.price)}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setViewProductsModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Category"
        maxWidth="440px"
      >
        <form onSubmit={handleSaveAdd}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Input
              label="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Mocktails or Bowls"
              required
            />
            <Select
              label="Status"
              value={categoryStatus}
              onChange={(e) => setCategoryStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Category: ${selectedCategory?.name || ''}`}
        maxWidth="440px"
      >
        <form onSubmit={handleSaveEdit}>
          <div className="modal-body">
            {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
            <Input
              label="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <Select
              label="Status"
              value={categoryStatus}
              onChange={(e) => setCategoryStatus(e.target.value)}
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
