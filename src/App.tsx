import React, { useState } from 'react';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import { preloadedDatasets } from './data/datasets';

const ValuesTierList = () => {
  const [values, setValues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [draggedValue, setDraggedValue] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [hoveredValue, setHoveredValue] = useState(null);
  const [changesMade, setChangesMade] = useState(false);
  const [lastExportTime, setLastExportTime] = useState(null);
  const [animatingValues, setAnimatingValues] = useState(new Set());
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedDataset, setSelectedDataset] = useState('act-comprehensive');

  const tiers = [
    { id: 'very-important', label: 'Very Important to Me', color: 'bg-emerald-50 border-emerald-200', icon: '💎' },
    { id: 'somewhat-important', label: 'Somewhat Important to Me', color: 'bg-blue-50 border-blue-200', icon: '⭐' },
    { id: 'not-important', label: 'Not Important to Me', color: 'bg-gray-50 border-gray-200', icon: '○' }
  ];

  const tierKeys = {
    '1': 'very-important',
    '2': 'somewhat-important',
    '3': 'not-important'
  };

  // Load default dataset on mount
  React.useEffect(() => {
    if (values.length === 0) {
      loadDataset('act-comprehensive');
    }
  }, []);

  const loadDataset = (datasetKey) => {
    const dataset = preloadedDatasets[datasetKey];
    if (dataset) {
      const importedValues = dataset.data.map((item, idx) => ({
        id: item.id || `value-${idx}`,
        value: item.value || item.name || '',
        description: item.description || '',
        category: item.category || 'Uncategorized',
        location: item.location || item.category || 'Uncategorized'
      }));

      const uniqueCategories = [...new Set(importedValues.map(v => v.category))];

      setValues(importedValues);
      setCategories(uniqueCategories);
      setSelectedDataset(datasetKey);
      setChangesMade(false);
      setLastExportTime(null);
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(values, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `act-values-rankings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setLastExportTime(new Date());
      setChangesMade(false);
      alert('Progress exported successfully!');
    } catch (error) {
      alert('Failed to export: ' + error.message);
    }
  };

  // Track mouse position
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update hover after value positions change
  const updateHoverFromMousePosition = () => {
    setTimeout(() => {
      const element = document.elementFromPoint(mousePosition.x, mousePosition.y);
      if (element) {
        const valueElement = element.closest('[data-value-id]');
        if (valueElement) {
          const valueId = valueElement.getAttribute('data-value-id');
          const value = values.find(v => v.id === valueId);
          if (value) {
            setHoveredValue(value);
          }
        }
      }
    }, 50);
  };

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (hoveredValue && (tierKeys[e.key] || e.key === '4')) {
        let targetLocation;

        if (e.key === '4') {
          targetLocation = hoveredValue.category;
        } else {
          targetLocation = tierKeys[e.key];
        }

        if (hoveredValue.location !== targetLocation) {
          setValues(prev => prev.map(v =>
            v.id === hoveredValue.id ? { ...v, location: targetLocation } : v
          ));
          setChangesMade(true);

          const valueId = hoveredValue.id;
          setAnimatingValues(prev => new Set(prev).add(valueId));
          setTimeout(() => {
            setAnimatingValues(prev => {
              const newSet = new Set(prev);
              newSet.delete(valueId);
              return newSet;
            });
          }, 500);

          setHoveredValue(null);
          updateHoverFromMousePosition();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [hoveredValue, mousePosition, values]);

  const handleDragStart = (e, value) => {
    setDraggedValue(value);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newLocation) => {
    e.preventDefault();
    if (draggedValue && draggedValue.location !== newLocation) {
      setValues(prev => prev.map(v =>
        v.id === draggedValue.id ? { ...v, location: newLocation } : v
      ));
      setChangesMade(true);
    }
    setDraggedValue(null);
  };

  const handleCategoryDragStart = (e, category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = (e, targetCategory) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedCategory && draggedCategory !== targetCategory) {
      const draggedIndex = categories.indexOf(draggedCategory);
      const targetIndex = categories.indexOf(targetCategory);

      const newCategories = [...categories];
      newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, draggedCategory);

      setCategories(newCategories);
      setChangesMade(true);
    }
    setDraggedCategory(null);
  };

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getValuesByLocation = (location) => {
    return values.filter(v => v.location === location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ACT Values Tier List</h1>
              <p className="text-gray-600 mt-1">Drag values to rank them, or hover and press 1, 2, 3 (tiers) or 4 (categories)</p>
            </div>
            <div className="flex gap-3 items-center">
              <select
                value={selectedDataset}
                onChange={(e) => loadDataset(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(preloadedDatasets).map(([key, dataset]) => (
                  <option key={key} value={key}>
                    {dataset.name} ({dataset.data.length} values)
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                <Download size={20} />
                Export Progress
              </button>
              <button
                onClick={() => loadDataset(selectedDataset)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {tiers.map((tier, index) => (
              <div
                key={tier.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tier.id)}
                className={`${tier.color} border-2 rounded-lg p-4 min-h-32`}
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>{tier.icon}</span>
                  {tier.label}
                  <span className="text-sm font-normal text-gray-600">
                    ({getValuesByLocation(tier.id).length})
                  </span>
                  <span className="ml-auto text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300 text-gray-600">
                    Press {index + 1}
                  </span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {getValuesByLocation(tier.id).map(value => (
                    <div
                      key={value.id}
                      data-value-id={value.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, value)}
                      onMouseEnter={() => setHoveredValue(value)}
                      onMouseLeave={() => setHoveredValue(null)}
                      className={`relative px-4 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-move hover:shadow-md hover:border-gray-400 transition-all select-none ${
                        animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
                      }`}
                    >
                      <span className="font-medium text-gray-800 block">{value.value || value.name || 'Unnamed Value'}</span>
                      {hoveredValue?.id === value.id && value.description && (
                        <div className="absolute z-10 bottom-full left-0 mb-2 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96">
                          <div className="mb-1 text-emerald-300 text-xs font-semibold">Press 1, 2, 3 (tiers) or 4 (category)</div>
                          {value.description}
                          <div className="absolute top-full left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center justify-between">
                <span>Value Categories</span>
                <span className="text-xs font-mono bg-emerald-50 px-2 py-1 rounded border border-emerald-300 text-emerald-700">
                  Press 4
                </span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">Drag values to the tiers to rank them</p>

              <div className="space-y-2">
                {categories.map(category => {
                  const categoryValues = getValuesByLocation(category);
                  const isCollapsed = collapsedCategories[category];
                  const isDragging = draggedCategory === category;

                  return (
                    <div
                      key={category}
                      className={`border rounded-lg ${isDragging ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => handleCategoryDragStart(e, category)}
                      onDragOver={handleCategoryDragOver}
                      onDrop={(e) => handleCategoryDrop(e, category)}
                    >
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="font-medium text-gray-700 flex items-center gap-2">
                          <span className="cursor-move text-gray-400">⋮⋮</span>
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                          {category}
                          <span className="text-sm font-normal text-gray-500">
                            ({categoryValues.length})
                          </span>
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, category)}
                          className="p-3 pt-0 flex flex-wrap gap-2"
                        >
                          {categoryValues.map(value => (
                            <div
                              key={value.id}
                              data-value-id={value.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, value)}
                              onMouseEnter={() => setHoveredValue(value)}
                              onMouseLeave={() => setHoveredValue(null)}
                              className={`relative px-3 py-2 bg-gray-50 border border-gray-300 rounded cursor-move hover:bg-white hover:shadow-md transition-all text-sm select-none ${
                                animatingValues.has(value.id) ? 'animate-pulse ring-4 ring-emerald-300' : ''
                              }`}
                            >
                              <span className="text-gray-800 font-medium">{value.value || value.name || 'Unnamed Value'}</span>
                              {hoveredValue?.id === value.id && value.description && (
                                <div className="absolute z-10 left-full ml-2 top-0 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96">
                                  <div className="mb-1 text-emerald-300 text-xs font-semibold">Press 1, 2, 3 (tiers) or 4 (category)</div>
                                  {value.description}
                                  <div className="absolute right-full top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-gray-900"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuesTierList;
