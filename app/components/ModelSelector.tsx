"use client";

import { useState, useMemo, type ChangeEvent } from "react";

interface Model {
  id: string;
  name: string;
  description?: string;
}

interface ModelSelectorProps {
  value: string | string[];
  onChange: (modelId: string | string[]) => void;
  multiple?: boolean;
  allowDuplicates?: boolean;
  label?: string;
  models: Model[];
}

export function ModelSelector({
  value,
  onChange,
  multiple = false,
  allowDuplicates = false,
  label = "Model",
  models,
}: ModelSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredModels = useMemo(() => {
    if (!search) return models;
    const lower = search.toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.id.toLowerCase().includes(lower)
    );
  }, [models, search]);

  const selectedModelsWithCounts = useMemo(() => {
    if (!multiple) {
      const model = models.find((m) => m.id === value);
      return model ? [{ model, count: 1 }] : [];
    }

    const ids = Array.isArray(value) ? value : [value];
    const countMap = new Map<string, number>();
    ids.forEach((id) => {
      countMap.set(id, (countMap.get(id) || 0) + 1);
    });

    return Array.from(countMap.entries())
      .map(([id, count]) => ({
        model: models.find((m) => m.id === id),
        count,
      }))
      .filter((item) => item.model !== undefined);
  }, [models, value, multiple]);

  const totalSelected = Array.isArray(value) ? value.length : value ? 1 : 0;

  const handleSelect = (modelId: string) => {
    if (multiple) {
      const currentIds = Array.isArray(value) ? value : [];
      if (allowDuplicates) {
        onChange([...currentIds, modelId]);
      } else {
        if (currentIds.includes(modelId)) {
          onChange(currentIds.filter((id) => id !== modelId));
        } else {
          onChange([...currentIds, modelId]);
        }
      }
    } else {
      onChange(modelId);
      setIsOpen(false);
    }
  };

  const handleRemove = (modelId: string, removeAll = false) => {
    if (!multiple) return;
    const currentIds = Array.isArray(value) ? value : [];

    if (removeAll) {
      onChange(currentIds.filter((id) => id !== modelId));
    } else {
      const lastIndex = currentIds.lastIndexOf(modelId);
      if (lastIndex !== -1) {
        const newIds = [...currentIds];
        newIds.splice(lastIndex, 1);
        onChange(newIds);
      }
    }
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {multiple && (
          <span className="ml-2 text-xs text-gray-500">({totalSelected} selected)</span>
        )}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {totalSelected > 0
          ? multiple
            ? `${totalSelected} model${totalSelected > 1 ? "s" : ""} selected`
            : selectedModelsWithCounts[0]?.model?.name
          : "Select model..."}
        <span className="float-right">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search models..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {multiple && allowDuplicates && (
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Click a model multiple times to add duplicates
              </p>
            </div>
          )}
          <div className="overflow-y-auto max-h-60">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => {
                const currentIds = Array.isArray(value) ? value : [];
                const count = currentIds.filter((id) => id === model.id).length;
                const isSelected = count > 0;
                return (
                  <div
                    key={model.id}
                    className={`w-full px-4 py-2 flex items-center justify-between ${
                      isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(model.id)}
                      className="flex-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 -ml-2"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {model.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{model.id}</div>
                    </button>
                    {isSelected && multiple && allowDuplicates ? (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(model.id, false);
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold"
                          title="Remove one"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(model.id);
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 text-sm font-bold"
                          title="Add one more"
                        >
                          +
                        </button>
                      </div>
                    ) : isSelected ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 ml-2">
                        {count > 1 && (
                          <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                            ×{count}
                          </span>
                        )}
                        ✓
                      </span>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No models found</div>
            )}
          </div>
        </div>
      )}

      {multiple && selectedModelsWithCounts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedModelsWithCounts.map(({ model, count }) => (
            <span
              key={model!.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {model!.name}
              {count > 1 && (
                <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-xs">×{count}</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(model!.id, false)}
                className="hover:text-blue-900 dark:hover:text-blue-100 ml-1"
                title={count > 1 ? "Remove one" : "Remove"}
              >
                −
              </button>
              {count > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(model!.id, true)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                  title="Remove all"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function getModelName(modelId: string, models: Model[]): string {
  const model = models.find((m) => m.id === modelId);
  return model?.name ?? modelId;
}
