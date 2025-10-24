import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem, Input } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";

export default function OrderAssignModal({ isOpen, onOpenChange, product, variant }) {
  const { projects, totalsByProject, addToProject } = useShop();
  const [projectId, setProjectId] = React.useState(projects[0]?.id || "");
  const [qty, setQty] = React.useState(1);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isOpen) {
      setProjectId(projects[0]?.id || "");
      setQty(1);
    }
  }, [isOpen, projects]);

  const currentTotal = totalsByProject[projectId]?.total || 0;
  const itemTotal = (product?.price || 0) * (qty || 0);
  const nextTotal = currentTotal + itemTotal;
  const project = projects.find((p) => p.id === projectId);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" placement="center" scrollBehavior="outside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex justify-between items-center">
              <div>Adicionar a Projeto</div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-default-500 mb-1">Projeto</div>
                  <Select selectedKeys={new Set([projectId])} onSelectionChange={(keys)=>setProjectId(Array.from(keys)[0])}>
                    {projects.map((p)=> (
                      <SelectItem key={p.id}>{p.name}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <div className="text-sm text-default-500 mb-1">Quantidade</div>
                  <Input type="number" min={1} value={String(qty)} onChange={(e)=> setQty(Math.max(1, Number(e.target.value||1)))} className="max-w-[160px]" />
                </div>
                <div className="text-sm text-default-600">
                  <div className="flex items-center gap-2">
                    <span>Budget:</span>
                    <span className="px-2 py-0.5 rounded-full bg-content2 border border-divider text-foreground/90 text-xs">€{project?.budget || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span>Total atual:</span>
                    <span className="px-2 py-0.5 rounded-full bg-content2 border border-divider text-foreground/90 text-xs">€{currentTotal}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span>Após adição:</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${nextTotal > (project?.budget||0) ? 'bg-danger-500/15 border-danger-500/30 text-danger-300' : 'bg-success-500/15 border-success-500/30 text-success-300'}`}>€{nextTotal}</span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close}>Cancelar</Button>
              <Button color="primary" onPress={() => { addToProject(projectId, product.id, variant, qty); close(); navigate("/orders"); }}>Confirmar</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


