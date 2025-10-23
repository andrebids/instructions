import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, RadioGroup, Radio, Switch } from "@heroui/react";

export default function ProductModal({ isOpen, onOpenChange, product, onOrder }) {
  const [mode, setMode] = React.useState("day");
  const [color, setColor] = React.useState("brancoPuro");

  React.useEffect(() => {
    if (isOpen) {
      setMode("day");
      setColor("brancoPuro");
    }
  }, [isOpen]);

  if (!product) return null;
  const imageSrc = mode === "day" ? product.images?.day : product.images?.night;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" placement="center" scrollBehavior="outside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex gap-2 items-center justify-between">
              <div className="text-xl font-semibold">{product.name}</div>
              <div className="text-primary font-bold">€{product.price}</div>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Viewer */}
                <div className="relative">
                  <Image removeWrapper src={imageSrc} alt={product.name} className="w-full h-72 object-cover rounded-lg" />
                  <div className="absolute top-3 right-3 bg-content1/80 border border-divider rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span>Dia</span>
                      <Switch size="sm" isSelected={mode === "night"} onValueChange={(v) => setMode(v ? "night" : "day")} aria-label="Dia/Noite" />
                      <span>Noite</span>
                    </div>
                  </div>
                </div>

                {/* Right: Details */}
                <div>
                  <div className="mb-3">
                    <div className="text-sm text-default-500 mb-1">Cor</div>
                    <RadioGroup orientation="horizontal" value={color} onValueChange={setColor}>
                      <Radio value="brancoPuro">Branco Puro</Radio>
                      <Radio value="brancoQuente">Branco Quente</Radio>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2 text-sm text-default-600">
                    <div><span className="text-default-500">Descrição:</span> {product.specs?.descricao}</div>
                    <div><span className="text-default-500">Técnicas:</span> {product.specs?.tecnicas}</div>
                    <div><span className="text-default-500">Dimensões:</span> {product.specs?.dimensoes}</div>
                    <div><span className="text-default-500">Materiais:</span> {product.specs?.materiais}</div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close}>Fechar</Button>
              <Button color="primary" onPress={() => { onOrder?.({ mode, color }); close(); }}>Encomendar</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


