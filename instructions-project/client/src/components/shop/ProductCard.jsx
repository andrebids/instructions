import React from "react";
import { Card, CardBody, Image } from "@heroui/react";
import ProductModal from "./ProductModal";

export default function ProductCard({ product, onOrder }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Card isPressable onPress={() => setOpen(true)} className="bg-content1 border border-divider">
        <CardBody className="p-0">
          <Image removeWrapper src={product.images?.day} alt={product.name} className="w-full h-40 object-cover" />
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-foreground truncate pr-2">{product.name}</div>
              <div className="text-sm text-primary font-semibold">€{product.price}</div>
            </div>
          </div>
        </CardBody>
      </Card>
      <ProductModal
        isOpen={open}
        onOpenChange={setOpen}
        product={product}
        onOrder={(variant) => onOrder?.(product, variant)}
      />
    </>
  );
}


