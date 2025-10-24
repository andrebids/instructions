import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, RadioGroup, Radio, Switch, Chip } from "@heroui/react";
import RequestInfoModal from "./RequestInfoModal";

export default function ProductModal({ isOpen, onOpenChange, product, onOrder }) {
  const [mode, setMode] = React.useState("night");
  const [color, setColor] = React.useState("brancoPuro");
  const [infoOpen, setInfoOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMode("night");
      setColor("brancoPuro");
    }
  }, [isOpen]);

  if (!product) return null;
  const imageSrc = mode === "day" ? product.images?.day : product.images?.night;
  const computeStock = (id) => {
    try {
      let sum = 0; for (const ch of String(id||'')) sum += ch.charCodeAt(0);
      return 5 + (sum % 60);
    } catch (_) { return 20; }
  };
  const stock = typeof product.stock === 'number' ? product.stock : computeStock(product.id);
  const isOutOfStock = stock <= 0;

  return (
    <>
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" placement="center" scrollBehavior="outside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex gap-2 items-center justify-between">
              <div className="text-xl font-semibold flex items-center gap-3">
                {product.name}
                {isOutOfStock && (
                  <Chip size="sm" color="default" variant="solid">Out of stock</Chip>
                )}
              </div>
              {/* price moved to footer */}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Viewer */}
                <div className="relative">
                  <Image removeWrapper src={imageSrc} alt={product.name} className="w-full h-72 object-contain rounded-lg bg-content2" />
                  <div className="absolute top-3 right-3 z-10 bg-content1/90 border border-divider rounded-xl px-3 py-2 text-foreground shadow-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <span>Day</span>
                      <Switch size="sm" isSelected={mode === "night"} onValueChange={(v) => setMode(v ? "night" : "day")} aria-label="Day/Night" />
                      <span>Night</span>
                    </div>
                  </div>
                </div>

                {/* Right: Details */}
                <div>
                  <div className="space-y-2 text-sm text-default-600">
                    <div><span className="text-default-500">Dimensions:</span> {product.specs?.dimensoes}</div>
                    <div><span className="text-default-500">Materials:</span> {product.specs?.materiais}</div>
                    <div><span className="text-default-500">Technical:</span> {product.specs?.tecnicas}</div>
                    {product.specs?.weight && (
                      <div><span className="text-default-500">Weight:</span> {product.specs?.weight}</div>
                    )}
                    {product.specs?.effects && (
                      <div><span className="text-default-500">LED / Effects:</span> {product.specs?.effects}</div>
                    )}
                    <div><span className="text-default-500">Description:</span> {product.specs?.descricao}</div>
                    {/* Price and stock below description */}
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-primary">€{product.price}</div>
                      <div className="mt-1 text-sm">
                        <span className="text-default-500 mr-1">Stock:</span>
                        {isOutOfStock ? (
                          <span className="text-danger-400">Out of stock</span>
                        ) : (
                          <span className={`${stock <= 10 ? 'text-warning' : 'text-default-600'}`}>{stock}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <div className="flex items-center gap-2">
                <Button variant="flat" onPress={close}>Close</Button>
                <Button color="primary" isDisabled={isOutOfStock} onPress={() => { onOrder?.({ mode, color }); close(); }}>Order</Button>
                {isOutOfStock && (
                  <Button variant="bordered" onPress={() => setInfoOpen(true)}>Request info</Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    <RequestInfoModal isOpen={infoOpen} onOpenChange={setInfoOpen} product={product} />
    </>
  );
}


