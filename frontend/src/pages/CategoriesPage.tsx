import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { Plus, Edit2, Trash2, X, Check, Palette } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';

const presetColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [color, setColor] = useState(presetColors[5]);
  const [loading, setLoading] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);

  const { data: categories, refetch, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await client.get('/categories');
      return res.data;
    }
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('📁');
    setColor(presetColors[5]);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon || '📁');
    setColor(cat.color || presetColors[5]);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editingCategory) {
        await client.put(`/categories/${editingCategory.id}`, { name, icon, color });
      } else {
        await client.post('/categories', { name, icon, color });
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await client.delete(`/categories/${categoryToDelete.id}`);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="w-full">
      <main className="mx-auto max-w-4xl pt-8 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-white tracking-tight">Categories</h1>
            <p className="text-slate-400 mt-1 text-sm">Manage your habit categories and colors</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500"
          >
            <Plus size={18} />
            New Category
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-slate-400 mt-10">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories?.map((cat: any) => (
              <div 
                key={cat.id}
                className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-700/50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner border border-white/10"
                    style={{ backgroundColor: `${cat.color || '#3b82f6'}20`, color: cat.color || '#3b82f6' }}
                  >
                    {cat.icon || '📁'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">{cat.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 uppercase mt-0.5">
                      {new Date(cat.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(cat)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-600"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/80 rounded-lg transition-colors border border-transparent hover:border-red-500/50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {(!categories || categories.length === 0) && (
              <div className="col-span-full text-center py-12 text-slate-400 border border-slate-800 border-dashed rounded-2xl">
                No categories found. Create one to get started!
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                
                <div className="flex gap-3">
                  <div className="w-20">
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Icon</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-2 py-3 text-center text-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-400 mb-1.5">Category Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Health"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                    <Palette size={14} /> Color Theme
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {presetColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Saving...' : (
                      <>
                        <Check size={18} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? Habits in this category will become uncategorized.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setCategoryToDelete(null)}
      />

    </div>
  );
}
