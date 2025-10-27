import React from "react";
import { Image, Chip, Tooltip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../../context/ShopContext";
import ProductModal from "./ProductModal";
import RequestInfoModal from "./RequestInfoModal";
import CompareSuggestModal from "./CompareSuggestModal";

export default function ProductCard({ product, onOrder, glass = false }) {
  const [open, setOpen] = React.useState(false);
  const [activeColor, setActiveColor] = React.useState(null);
  const { addToProject, projects, favorites, compare, toggleFavorite, toggleCompare, products, getAvailableStock } = useShop();

  const previewSrc = React.useMemo(() => {
    if (activeColor && product.images?.colors?.[activeColor]) return product.images.colors[activeColor];
    if (product.images?.night) return product.images.night; // prefer night on cards
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
  const stock = getAvailableStock(product);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group cursor-pointer select-none"
        style={glass ? {
          WebkitMaskImage: "radial-gradient(100% 100% at 50% 50%, black calc(100% - 16px), rgba(0,0,0,0) 100%)",
          maskImage: "radial-gradient(100% 100% at 50% 50%, black calc(100% - 16px), rgba(0,0,0,0) 100%)",
        } : undefined}
      >
          <div className="relative overflow-hidden rounded-t-2xl bg-[#0b1b3a]">
            {discountPct ? (
              <Chip size="sm" color="danger" variant="solid" className="absolute left-3 top-3 z-30 text-white">{discountPct}% Off</Chip>
            ) : null}
            {isOutOfStock ? (
              <Chip size="sm" color="danger" variant="solid" className="absolute left-3 top-3 z-30 text-white">Out of stock</Chip>
            ) : isLowStock ? (
              <Chip size="sm" color="warning" variant="solid" className="absolute left-3 top-3 z-30 text-white">Low stock</Chip>
            ) : null}
            <Image removeWrapper src={previewSrc} alt={product.name} className="w-full h-64 object-contain transition-transform duration-300 group-hover:scale-105" />
            {glass && (
              <div
                className="absolute inset-0 z-5 pointer-events-none rounded-t-2xl"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.012), rgba(255,255,255,0.005))",
                  backdropFilter: "blur(2px)",
                  WebkitBackdropFilter: "blur(2px)",
                  maskImage: "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0) 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0) 100%)",
                  zIndex: 5,
                }}
              />
            )}
            {glass && (
              <div
                className="absolute inset-0 pointer-events-none rounded-t-2xl"
                style={{
                  zIndex: 6,
                  backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.08"/></svg>')`,
                  backgroundSize: "110px 110px",
                  mixBlendMode: "soft-light",
                  maskImage: "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0) 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0) 100%)",
                }}
              />
            )}
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
                    onPress={() => { if (!compare?.includes(product.id)) toggleCompare(product.id); setCompareOpen(true); }}
                    onClick={(e)=> e.stopPropagation()}
                  >
                    <Icon icon="lucide:shuffle" className="text-white text-xl" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
          {/* Info card-only rectangle with gradient into background */}
          <div className="relative rounded-b-2xl p-4 bg-gradient-to-t from-[#e5e7eb] dark:from-black to-[#0b1b3a]">
            {/* bottom glass overlay removed to avoid visible seam; keep original background gradient */}
            <div className="relative z-10">
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
          </div>
      </div>
      <ProductModal
        isOpen={open}
        onOpenChange={setOpen}
        product={product}
        onOrder={(variant) => onOrder?.(product, variant)}
      />
      <RequestInfoModal isOpen={infoOpen} onOpenChange={setInfoOpen} product={product} />
      <CompareSuggestModal
        isOpen={compareOpen}
        onOpenChange={setCompareOpen}
        baseProduct={product}
        onAdd={(p)=>{ toggleCompare(p.id); }}
      />
    </>
  );
}


