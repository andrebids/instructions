import React from "react";
import { Chip } from "@heroui/react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, onOrder }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((p) => (
        <div key={p.id} className="space-y-2">
          <ProductCard product={p} onOrder={onOrder} />
          <div className="mt-1 flex flex-wrap gap-1">
            {p.tags?.slice(0, 2).map((t) => (
              <Chip key={t} size="sm" variant="flat" color="primary" className="text-xs">{t}</Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


