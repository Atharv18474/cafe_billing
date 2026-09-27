import React from 'react';

export const CategoryBar = ({ categories = [], selectedCategoryId, onSelectCategory }) => {
  return (
    <div
      className="category-bar"
    >
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.875rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          backgroundColor: selectedCategoryId === null ? 'var(--primary)' : 'var(--surface)',
          color: selectedCategoryId === null ? '#fff' : 'var(--text-secondary)',
          border: selectedCategoryId === null ? '1px solid var(--primary)' : '1px solid var(--border)',
          boxShadow: selectedCategoryId === null ? '0 2px 6px rgba(194, 94, 0, 0.3)' : 'var(--shadow-sm)',
          transition: 'all 0.15s ease'
        }}
      >
        All Items
      </button>

      {categories
        .filter((c) => c.status === 'ACTIVE')
        .map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                boxShadow: isSelected ? '0 2px 6px rgba(194, 94, 0, 0.3)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              {category.name}
            </button>
          );
        })}
    </div>
  );
};
