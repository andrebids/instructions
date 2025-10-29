import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Button, Input, Tooltip, Progress, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../../context/ShopContext";

export default function ProjectOrderModal({ isOpen, onOpenChange, project, items = [], total = 0, onAddPiece }) {
  const { updateProjectItemQty, removeProjectItem, products, getAvailableStock, projectStatusById, setProjectStatus, projectBudgetById, setProjectBudget } = useShop();
  const statusColorMap = {
    created: "default",
    in_progress: "primary",
    finished: "success",
    approved: "secondary",
    cancelled: "danger",
    in_queue: "warning",
    to_order: "secondary",
    ordered: "primary",
  };
  const statusLabelMap = {
    created: "Created",
    in_progress: "In Progress",
    finished: "Finished",
    approved: "Approved",
    cancelled: "Cancelled",
    in_queue: "In Queue",
    to_order: "To Order",
    ordered: "Ordered",
  };
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const effectiveBudget = Number(projectBudgetById?.[project?.id] ?? project?.budget) || 0;
  const overBudget = Number(total) > effectiveBudget;
  const piecesCount = Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.qty) || 0), 0) : 0;
  const [editBudgetOpen, setEditBudgetOpen] = React.useState(false);
  const [budgetInput, setBudgetInput] = React.useState(effectiveBudget);
  const isOrdered = project ? (projectStatusById?.[project.id] === 'ordered') : false;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: "max-w-[1100px] w-[96vw]",
        body: "pt-2",
      }}
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex items-center justify-between gap-3">
              <div className="text-xl font-semibold truncate">{project?.name}</div>
              <div className="flex items-center gap-2">
                {project ? (
                  <Dropdown>
                    <DropdownTrigger>
                      <Chip as="button" size="sm" color={statusColorMap[projectStatusById?.[project.id] || 'created']} variant="flat">
                        {statusLabelMap[projectStatusById?.[project.id] || 'created']}
                      </Chip>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Change project status" onAction={(key)=> setProjectStatus(project.id, String(key))}>
                      {Object.keys(statusLabelMap).map((k)=> (
                        <DropdownItem key={k}>{statusLabelMap[k]}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                ) : null}
                <Chip
                  as="button"
                  size="sm"
                  variant="flat"
                  className={isOrdered ? 'opacity-60 cursor-not-allowed' : ''}
                  onClick={()=> { if (isOrdered) return; setBudgetInput(effectiveBudget); setEditBudgetOpen(true); }}
                  startContent={<Icon icon="lucide:pencil" className="text-xs" />}
                >
                  Budget €{effectiveBudget}
                </Chip>
                <Chip size="sm" variant="flat">Pieces {piecesCount}</Chip>
                <Chip size="sm" color={overBudget ? "danger" : "success"} variant="flat">Total €{total}</Chip>
              </div>
            </ModalHeader>
            <ModalBody>
              {/* Budget status */}
              <div className="mb-2 flex items-center justify-end">
                <Chip size="sm" color={(effectiveBudget - (Number(total)||0)) <= 0 ? 'danger' : 'default'} variant="flat">
                  Remaining budget: €{Math.max(0, effectiveBudget - (Number(total)||0))}
                </Chip>
              </div>
              <Progress
                aria-label="Budget progress"
                value={effectiveBudget > 0 ? Math.min(100, Math.round((Number(total)||0) / effectiveBudget * 100)) : 0}
                color={(Number(total)||0) > effectiveBudget ? 'danger' : ((Number(total)||0) / effectiveBudget >= 0.85 ? 'warning' : 'success')}
                className="mb-3"
                label={`€${Number(total)||0} / €${effectiveBudget}`}
                showValueLabel
              />
              <div className="mb-3 flex items-center justify-end">
                <Button color="primary" variant="solid" size="sm" onPress={onAddPiece} isDisabled={isOrdered}>Add item</Button>
              </div>
              {(!items || items.length === 0) ? (
                <div className="text-default-500 text-sm">No items in this project.</div>
              ) : (
                <div className="divide-y divide-divider rounded-medium overflow-hidden bg-content2 border border-divider">
                  {items.map((it) => {
                    const product = products.find((p) => p.id === it.productId);
                    const available = product ? getAvailableStock(product) : 0; // available excluding this line already
                    const maxAllowed = available + (Number(it.qty) || 0);
                    const remaining = Math.max(0, maxAllowed - (Number(it.qty) || 0)); // equals available
                    const low = remaining > 0 && remaining <= 10;
                    const out = remaining === 0;
                    const stockLabel = out ? 'Out of stock' : `Remaining ${remaining}`;
                    const stockColor = out ? 'danger' : (low ? 'warning' : 'default');
                    const budget = effectiveBudget || 0;
                    const currentTotal = Number(total) || 0;
                    const lineTotal = (Number(it.unitPrice)||0) * (Number(it.qty)||0);
                    const remainingBudgetExcl = Math.max(0, budget - (currentTotal - lineTotal));
                    const remainingBudgetGlobal = Math.max(0, budget - currentTotal);
                    const unitPrice = Number(it.unitPrice) || 0;
                    const maxByBudget = unitPrice > 0 ? Math.floor(remainingBudgetExcl / unitPrice) : 0;
                    const maxByAll = Math.min(maxAllowed, maxByBudget);
                    const budgetBlocked = Number(it.qty) >= maxByBudget;

                    return (
                      <div key={it.key} className="px-4 py-3 grid grid-cols-[1fr_auto] gap-4 items-center text-sm">
                        <div className="min-w-0">
                          <div className="text-foreground truncate" title={it.name}>{it.name}</div>
                          <div className="text-default-500 flex items-center gap-2">
                            <Chip size="sm" color={stockColor} variant="flat">{stockLabel}</Chip>
                            {budget > 0 && (
                              <Chip size="sm" color={budgetBlocked ? 'danger' : 'default'} variant="flat">
                                {budgetBlocked ? 'No budget' : `€${remainingBudgetGlobal} remaining`}
                              </Chip>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                          <div className="flex items-center gap-1">
                            <Tooltip content="Decrease">
                              <Button isIconOnly size="sm" variant="flat" onPress={() => updateProjectItemQty(project.id, it.key, Math.max(0, Number(it.qty) - 1))} isDisabled={isOrdered} aria-label="Decrease quantity">
                                <Icon icon="lucide:minus" className="text-base" />
                              </Button>
                            </Tooltip>
                            <Input
                              type="number"
                              size="sm"
                              min={0}
                              value={String(it.qty)}
                              className="w-16"
                              isDisabled={isOrdered}
                              onChange={(e)=> {
                                const desired = Number(e.target.value);
                                const clamped = Number.isFinite(desired) ? Math.max(0, Math.min(desired, maxByAll)) : 0;
                                updateProjectItemQty(project.id, it.key, clamped);
                              }}
                            />
                            <Tooltip content={remaining === 0 ? "Out of stock" : (budgetBlocked ? "No budget" : "Increase")}>
                              <Button isIconOnly size="sm" variant="flat" isDisabled={isOrdered || remaining === 0 || budgetBlocked} onPress={() => updateProjectItemQty(project.id, it.key, Number(it.qty) + 1)} aria-label="Increase quantity">
                                <Icon icon="lucide:plus" className="text-base" />
                              </Button>
                            </Tooltip>
                          </div>
                          <div className="text-default-600 whitespace-nowrap w-24 text-right">€{(Number(it.unitPrice)||0) * (Number(it.qty)||0)}</div>
                          <Tooltip content="Remove line">
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeProjectItem(project.id, it.key)} isDisabled={isOrdered} aria-label="Remove line">
                              <Icon icon="lucide:trash-2" className="text-base" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-default-500">{items?.length || 0} lines • {piecesCount} pieces</div>
                <div className="flex items-center gap-2">
                  {(project && (projectStatusById?.[project.id] === 'to_order')) && (
                    <Button color="primary" onPress={()=> setConfirmOpen(true)}>Order</Button>
                  )}
                  <Button variant="flat" onPress={close}>Close</Button>
                </div>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    <Modal isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
      <ModalContent>
        {(close)=> (
          <>
            <ModalHeader>Confirm order</ModalHeader>
            <ModalBody>
              Are you sure you want to order this project's items? You can review and edit items before confirming.
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={()=> { setProjectStatus(project.id, 'ordered'); close(); }}>Confirm order</Button>
              <Button variant="flat" onPress={close}>Review items</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    <Modal isOpen={editBudgetOpen} onOpenChange={setEditBudgetOpen}>
      <ModalContent>
        {(close)=> (
          <>
            <ModalHeader>Edit budget</ModalHeader>
            <ModalBody>
              <Input type="number" value={String(budgetInput)} onChange={(e)=> setBudgetInput(Number(e.target.value))} />
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={()=> { setProjectBudget(project.id, budgetInput); close(); }}>Save</Button>
              <Button variant="flat" onPress={close}>Cancel</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    </>
  );
}


