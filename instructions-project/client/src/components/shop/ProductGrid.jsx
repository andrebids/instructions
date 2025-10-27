import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, onOrder, cols = 4, glass = false, allowQty = false }) {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={`grid ${colClasses[cols] || colClasses[4]} gap-6`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onOrder={onOrder} glass={glass} allowQty={allowQty} />
      ))}
    </div>
  );
}


