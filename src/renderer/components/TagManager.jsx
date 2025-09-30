import React, { useState } from 'react';
import { ReactRough, Rectangle } from 'react-rough';
import TagModal from './TagModal';

const TagManager = ({ tags, onTagCreated, onTagUpdated, onTagDeleted }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const handleCreateTag = () => {
    setEditingTag(null);
    setShowModal(true);
  };

  const handleEditTag = (tag) => {
    setEditingTag(tag);
    setShowModal(true);
  };

  const handleDeleteTag = async (tagId) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    if (window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      try {
        await window.electronAPI.tags.delete(tagId);
        onTagDeleted();
      } catch (error) {
        alert('Failed to delete tag: ' + error.message);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTag(null);
  };

  const handleTagSaved = () => {
    handleModalClose();
    if (editingTag) {
      onTagUpdated();
    } else {
      onTagCreated();
    }
  };

  return (
    <div className="tag-manager">
      <div className="mb-4">
        <button className="btn btn-primary" onClick={handleCreateTag}>
          Create New Tag
        </button>
      </div>

      <div className="tag-list">
        {tags.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '2rem' }}>
            <p>No tags created yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Create your first tag to organize your MiniApps
            </p>
          </div>
        ) : (
          tags.map((tag, index) => (
            <div key={tag.id} className="tag-item" style={{ position: 'relative' }}>
              {/* Sketch overlay for tag item */}
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
                  x={1}
                  y={1}
                  width="calc(100% - 2px)"
                  height="calc(100% - 2px)"
                  options={{
                    roughness: 0.6 + Math.sin(index) * 0.1,
                    stroke: '#f1f5f9',
                    strokeWidth: 1,
                    fill: 'rgba(243, 244, 246, 0.1)'
                  }}
                />
              </ReactRough>

              <div className="tag-info">
                <div 
                  className="tag-color" 
                  style={{ backgroundColor: tag.color }}
                />
                <div className="tag-details">
                  <h3>{tag.name}</h3>
                  {tag.description && <p>{tag.description}</p>}
                </div>
              </div>
              <div className="tag-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleEditTag(tag)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleDeleteTag(tag.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TagModal
          tag={editingTag}
          onClose={handleModalClose}
          onSave={handleTagSaved}
        />
      )}
    </div>
  );
};

export default TagManager;