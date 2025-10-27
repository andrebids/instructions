import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, RadioGroup, Radio, Switch, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import DayNightToggle from "../DayNightToggle";
import RequestInfoModal from "./RequestInfoModal";
import { useShop } from "../../context/ShopContext";

export default function ProductModal({ isOpen, onOpenChange, product, onOrder }) {
  const { getAvailableStock } = useShop();
  const [mode, setMode] = React.useState("night");
  const [color, setColor] = React.useState("brancoPuro");
  const [infoOpen, setInfoOpen] = React.useState(false);
  // Using custom toggle; no external player

  React.useEffect(() => {
    if (isOpen) {
      setMode("night");
      setColor("brancoPuro");
    }
  }, [isOpen]);

  // Custom toggle has internal animation

  const toggleMode = () => {
    setMode((prev) => (prev === "day" ? "night" : "day"));
  };

  // No external event handling needed

  if (!product) return null;
  const imageSrc = mode === "day" ? product.images?.day : product.images?.night;
  const stock = getAvailableStock(product);
  const isOutOfStock = stock <= 0;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="4xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        wrapper: "items-center justify-center",
        base: "max-w-[1400px] w-[96vw] my-10",
        body: "pt-4",
      }}
    >
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left: Viewer */}
                <div className="relative md:col-span-3">
                  <Image removeWrapper src={imageSrc} alt={product.name} className="w-full h-80 md:h-[28rem] lg:h-[36rem] object-contain rounded-lg bg-content2" />
                  <div className="absolute top-3 right-3 z-10">
                    <DayNightToggle
                      isNight={mode === "night"}
                      onToggle={() => toggleMode()}
                      size={32}
                    />
                  </div>
                </div>

                {/* Right: Details */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 gap-y-3 text-base text-default-600">
                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:ruler" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Dimensions</div>
                        <div>{product.specs?.dimensoes}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:layers" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Materials</div>
                        <div>{product.specs?.materiais}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:cpu" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Technical</div>
                        <div>{product.specs?.tecnicas}</div>
                      </div>
                    </div>

                    {product.specs?.weight && (
                      <div className="flex items-start gap-2">
                        <Icon icon="lucide:scale" className="text-default-500 text-lg mt-0.5" />
                        <div>
                          <div className="text-default-500 text-sm">Weight</div>
                          <div>{product.specs?.weight}</div>
                        </div>
                      </div>
                    )}

                    {product.specs?.effects && (
                      <div className="flex items-start gap-2">
                        <Icon icon="lucide:sparkles" className="text-default-500 text-lg mt-0.5" />
                        <div>
                          <div className="text-default-500 text-sm">LED / Effects</div>
                          <div>{product.specs?.effects}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:file-text" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Description</div>
                        <div>{product.specs?.descricao}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price and stock stacked */}
                  <div className="mt-5">
                    <div className="text-2xl font-bold text-primary">€{product.price}</div>
                    <div className="mt-1.5 text-sm">
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
            </ModalBody>
            <ModalFooter>
              <div className="flex items-center gap-2">
                <Button variant="flat" onPress={close}>Close</Button>
                <Button color="primary" isDisabled={isOutOfStock} onPress={() => { onOrder?.({ mode, color }); close(); }}>Add</Button>
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


