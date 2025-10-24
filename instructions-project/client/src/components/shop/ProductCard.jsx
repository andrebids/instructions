import React from "react";
import { Card, CardBody, Image, Chip, Tooltip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../../context/ShopContext";
import ProductModal from "./ProductModal";
import RequestInfoModal from "./RequestInfoModal";

export default function ProductCard({ product, onOrder }) {
  const [open, setOpen] = React.useState(false);
  const [activeColor, setActiveColor] = React.useState(null);
  const { addToProject, projects, favorites, compare, toggleFavorite, toggleCompare } = useShop();

  const previewSrc = React.useMemo(() => {
    if (activeColor && product.images?.colors?.[activeColor]) return product.images.colors[activeColor];
    return product.images?.day;
  }, [activeColor, product]);

  const colorKeyToStyle = {
    brancoPuro: "#ffffff",
    brancoQuente: "#fbbf24",
    rgb: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
    vermelho: "#ef4444",
    verde: "#10b981",
    azul: "#3b82f6",
  };

  const colorKeys = Object.keys(product.images?.colors || {});
  const discountPct = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;
  const computeStock = (id) => {
    try {
      let sum = 0; for (const ch of String(id||'')) sum += ch.charCodeAt(0);
      return 5 + (sum % 60);
    } catch (_) { return 20; }
  };
  const stock = typeof product.stock === 'number' ? product.stock : computeStock(product.id);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;
  const [infoOpen, setInfoOpen] = React.useState(false);

  return (
    <>
      <Card isPressable onPress={() => setOpen(true)} className="group bg-content1/50 border border-divider rounded-2xl overflow-hidden">
        <CardBody className="p-0">
          <div className="relative">
            {discountPct ? (
              <Chip size="sm" color="danger" variant="solid" className="absolute left-3 top-3 z-10">{discountPct}% Off</Chip>
            ) : null}
            {isOutOfStock ? (
              <Chip size="sm" color="default" variant="solid" className="absolute left-3 top-3 z-10">Out of stock</Chip>
            ) : isLowStock ? (
              <Chip size="sm" color="warning" variant="solid" className="absolute left-3 top-3 z-10">Low stock</Chip>
            ) : null}
            <Image removeWrapper src={previewSrc} alt={product.name} className="w-full h-64 object-cover" />
            {/* Quick actions */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10 opacity-0 translate-x-2 pointer-events-auto transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
              {/* Add to cart or Request info */}
              <div className="group/action relative flex items-center">
                <Tooltip content={isOutOfStock ? "Request info" : "Add to cart"} placement="left">
                  <Button
                    isIconOnly
                    radius="full"
                    className="bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/70 shadow-medium"
                    aria-label={isOutOfStock ? "Request info" : "Add to cart"}
                    onPress={() => { isOutOfStock ? setInfoOpen(true) : onOrder?.(product, { color: activeColor || "brancoPuro", mode: "day" }); }}
                    onClick={(e)=> e.stopPropagation()}
                  >
                    <Icon icon={isOutOfStock ? "lucide:mail" : "lucide:shopping-bag"} className="text-white text-xl" />
                  </Button>
                </Tooltip>
              </div>

              {/* Favorite */}
              <div className="group/action relative flex items-center">
                <Tooltip content={favorites?.includes(product.id) ? "Remove from favorites" : "Add to favorites"} placement="left">
                  <Button
                    isIconOnly
                    radius="full"
                    className={`bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/70 shadow-medium ${favorites?.includes(product.id) ? 'ring-2 ring-danger-500' : ''}`}
                    aria-label="Add to favorites"
                    onPress={() => { toggleFavorite(product.id); }}
                    onClick={(e)=> e.stopPropagation()}
                  >
                    <Icon icon="lucide:heart" className="text-white text-xl" />
                  </Button>
                </Tooltip>
              </div>

              {/* Compare */}
              <div className="group/action relative flex items-center">
                <Tooltip content={compare?.includes(product.id) ? "Remove from compare" : "Add to compare"} placement="left">
                  <Button
                    isIconOnly
                    radius="full"
                    className="bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/70 shadow-medium"
                    aria-label="Add to compare"
                    onPress={() => { toggleCompare(product.id); }}
                    onClick={(e)=> e.stopPropagation()}
                  >
                    <Icon icon="lucide:shuffle" className="text-white text-xl" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="font-medium text-foreground mb-1 truncate" title={product.name}>{product.name}</div>
            <div className="flex items-baseline gap-2">
              <div className="text-base font-semibold text-primary">€{product.price}</div>
              {product.oldPrice ? (
                <div className="text-sm text-default-500 line-through">€{product.oldPrice}</div>
              ) : null}
            </div>
            <div className="mt-1 text-xs text-default-500">
              {isOutOfStock ? (
                <span className="text-danger-400">Out of stock</span>
              ) : (
                <>Stock: <span className={`${isLowStock ? 'text-warning' : 'text-default-600'}`}>{stock}</span></>
              )}
            </div>
            {colorKeys.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                {colorKeys.slice(0, 4).map((key) => (
                  <Tooltip key={key} content={key}>
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-full border ${activeColor === key ? 'ring-2 ring-primary' : 'border-default-200'}`}
                      style={{ background: colorKeyToStyle[key] || '#e5e7eb', boxShadow: key === 'brancoPuro' ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined }}
                      onClick={(e) => { e.stopPropagation(); setActiveColor(activeColor === key ? null : key); }}
                    />
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
      <ProductModal
        isOpen={open}
        onOpenChange={setOpen}
        product={product}
        onOrder={(variant) => onOrder?.(product, variant)}
      />
      <RequestInfoModal isOpen={infoOpen} onOpenChange={setInfoOpen} product={product} />
    </>
  );
}


