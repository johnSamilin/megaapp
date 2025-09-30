import React, { useState, useEffect } from 'react';
import { ReactRough, Rectangle, Line } from 'react-rough';

const TagModal = ({ tag, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || '',
        color: tag.color || '#3B82F6',
        description: tag.description || ''
      });
    }
  }, [tag]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (tag) {
        await window.electronAPI.tags.update(tag.id, formData);
      } else {
        await window.electronAPI.tags.create(formData);
      }
      onSave();
    } catch (error) {
      alert('Failed to save tag: ' + error.message);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ position: 'relative' }}>
        {/* Sketch overlay for modal */}
        <ReactRough
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          <Rectangle
            x={2}
            y={2}
            width="calc(100% - 4px)"
            height="calc(100% - 4px)"
            options={{
              roughness: 1.0,
              stroke: '#374151',
              strokeWidth: 2,
              fill: 'rgba(255, 255, 255, 0.2)'
            }}
          />
          <Line
            x1={10}
            y1={60}
            x2="calc(100% - 10px)"
            y2={60}
            options={{
              roughness: 0.8,
              stroke: '#6b7280',
              strokeWidth: 1
            }}
          />
        </ReactRough>

        <div className="modal-header">
          <h2 className="modal-title">{tag ? 'Edit Tag' : 'Create New Tag'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="tag-name">Name</label>
            <input
              type="text"
              id="tag-name"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="tag-color">Color</label>
            <input
              type="color"
              id="tag-color"
              className="form-input"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="tag-description">Description</label>
            <textarea
              id="tag-description"
              className="form-input form-textarea"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {tag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagModal;