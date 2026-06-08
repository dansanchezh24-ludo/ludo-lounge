import React from "react";

export default function Sidebar({ categories, selectedCategory, onSelect }) {
  return (
    <aside className="sidebar">
      {categories.map((cat) => (
        <div
          key={cat}
          onClick={() => onSelect(cat)}
          className={`category-chip${selectedCategory === cat ? " active" : ""}`}
        >
          {cat}
        </div>
      ))}
    </aside>
  );
}
