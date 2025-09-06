import React, { useState, useEffect } from "react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_API_BASE_URL;

export default function CategoriesForm({
  editingCategory,
  onSuccess,
  onCancel,
  token
}: {
  editingCategory?: any;
  onSuccess: () => void;
  onCancel: () => void;
  token?: string;
}) {
  const [name, setName] = useState("");
  const [subcategories, setSubcategories] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setSubcategories(editingCategory.subcategories.join(", "));
    } else {
      setName("");
      setSubcategories("");
    }
    setError("");
    setSuccess("");
  }, [editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (editingCategory && editingCategory._id) {
        await axios.put(`${backendUrl}/api/admin/categories/${editingCategory._id}`, {
          name,
          subcategories: subcategories.split(",").map((s) => s.trim()).filter(Boolean),
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        });
        setSuccess("Category updated");
      } else {
        await axios.post(`${backendUrl}/api/admin/categories`, {
          name,
          subcategories: subcategories.split(",").map((s) => s.trim()).filter(Boolean),
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true
        });
        setSuccess("Category created");
      }
      setName("");
      setSubcategories("");
      onSuccess();
    } catch (err) {
      setError("Failed to save category");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-4 bg-white p-6 rounded-lg shadow max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-2">{editingCategory ? "Edit Category" : "Add New Category"}</h2>
      <div>
        <label className="block font-medium mb-1">Category Name</label>
        <input
          className="border p-2 rounded w-full focus:border-[#B8956A] focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Jewelry"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Subcategories (comma separated)</label>
        <input
          className="border p-2 rounded w-full focus:border-[#B8956A] focus:outline-none"
          value={subcategories}
          onChange={(e) => setSubcategories(e.target.value)}
          placeholder="e.g. Rings, Necklaces, Lockets"
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="bg-[#B8956A] text-white px-4 py-2 rounded hover:bg-[#A0845A] transition"
          disabled={loading}
        >
          {editingCategory ? "Update Category" : "Add Category"}
        </button>
        {editingCategory && (
          <button
            type="button"
            className="px-4 py-2 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
    </form>
  );
}
