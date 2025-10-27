import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Autocomplete, AutocompleteItem } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";

export default function OrderAssignModal({ isOpen, onOpenChange, product, variant }) {
  const { projects, totalsByProject, addToProject, getAvailableStock } = useShop();
  const [projectId, setProjectId] = React.useState("");
  const [projectSearch, setProjectSearch] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [qtyError, setQtyError] = React.useState("");
  const [projectError, setProjectError] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isOpen) {
      setProjectId("");
      setProjectSearch("");
      setQty(1);
      setQtyError("");
      setProjectError("");
    }
  }, [isOpen, projects]);

  const currentTotal = totalsByProject[projectId]?.total || 0;
  const itemTotal = (product?.price || 0) * (qty || 0);
  const nextTotal = currentTotal + itemTotal;
  const project = projects.find((p) => p.id === projectId);
  const stock = product ? getAvailableStock(product) : 0;

  const handleQtyChange = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      setQty(1);
      setQtyError("");
      return;
    }
    if (numeric < 1) {
      setQty(1);
      setQtyError("Quantity cannot be negative or zero.");
      return;
    }
    if (stock > 0 && numeric > stock) {
      setQty(stock);
      setQtyError(`Quantity cannot exceed stock (${stock}).`);
      return;
    }
    setQty(numeric);
    setQtyError("");
  };

  const handleProjectSelection = (key) => {
    const id = typeof key === 'string' ? key : String(key);
    setProjectId(id);
    const selected = projects.find((p) => p.id === id);
    if (selected) setProjectSearch(selected.name);
    setProjectError("");
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" placement="center" scrollBehavior="outside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex justify-between items-center">
              <div>Add to Project</div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-default-500 mb-1">Project</div>
                  <Autocomplete
                    selectedKey={projectId || null}
                    inputValue={projectSearch}
                    onSelectionChange={handleProjectSelection}
                    onInputChange={setProjectSearch}
                    defaultItems={projects}
                    placeholder="Search for a project..."
                    menuTrigger="input"
                    isInvalid={!!projectError}
                    errorMessage={projectError}
                  >
                    {(p) => (
                      <AutocompleteItem key={p.id}>{p.name}</AutocompleteItem>
                    )}
                  </Autocomplete>
                </div>
                <div>
                  <div className="text-sm text-default-500 mb-1">Quantity</div>
                  <Input
                    type="number"
                    min={1}
                    value={String(qty)}
                    onChange={(e)=> handleQtyChange(e.target.value)}
                    className="max-w-[160px]"
                    isInvalid={!!qtyError}
                    errorMessage={qtyError}
                  />
                  {stock === 0 && (
                    <div className="mt-1 text-danger-400 text-xs">Out of stock.</div>
                  )}
                </div>
                <div className="text-sm text-default-600">
                  <div className="flex items-center gap-2">
                    <span>Budget:</span>
                    <span className="px-2 py-0.5 rounded-full bg-content2 border border-divider text-foreground/90 text-xs">€{project?.budget || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span>Current total:</span>
                    <span className="px-2 py-0.5 rounded-full bg-content2 border border-divider text-foreground/90 text-xs">€{currentTotal}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span>After addition:</span>
                    <span className={`px-2 py-0.5 rounded-full border text-xs ${nextTotal > (project?.budget||0) ? 'bg-danger-500/15 border-danger-500/30 text-danger-300' : 'bg-success-500/15 border-success-500/30 text-success-300'}`}>€{nextTotal}</span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close}>Cancel</Button>
              <Button
                color="primary"
                isDisabled={!projectId || qty < 1 || (stock > 0 && qty > stock) || stock === 0}
                onPress={() => {
                  if (!projectId) { setProjectError("Select a project first."); return; }
                  addToProject(projectId, product.id, variant, qty);
                  close();
                  navigate("/projects");
                }}
              >
                Confirm
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


