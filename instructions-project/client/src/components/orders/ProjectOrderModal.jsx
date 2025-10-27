import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Button, Input, Tooltip, Progress } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../../context/ShopContext";

export default function ProjectOrderModal({ isOpen, onOpenChange, project, items = [], total = 0, onAddPiece }) {
  const { updateProjectItemQty, removeProjectItem, products, getAvailableStock } = useShop();
  if (!project) return null;
  const overBudget = Number(total) > Number(project?.budget || 0);
  const piecesCount = Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.qty) || 0), 0) : 0;

  return (
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
                <Chip size="sm" variant="flat">Budget €{project?.budget}</Chip>
                <Chip size="sm" variant="flat">Peças {piecesCount}</Chip>
                <Chip size="sm" color={overBudget ? "danger" : "success"} variant="flat">Total €{total}</Chip>
              </div>
            </ModalHeader>
            <ModalBody>
              {/* Budget status */}
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-default-500">Orçamento restante</div>
                <Chip size="sm" color={(Number(project?.budget)||0) - (Number(total)||0) <= 0 ? 'danger' : 'default'} variant="flat">
                  €{Math.max(0, (Number(project?.budget)||0) - (Number(total)||0))}
                </Chip>
              </div>
              <Progress
                aria-label="Budget progress"
                value={(Number(project?.budget)||0) > 0 ? Math.min(100, Math.round((Number(total)||0) / (Number(project?.budget)||0) * 100)) : 0}
                color={(Number(total)||0) > (Number(project?.budget)||0) ? 'danger' : ((Number(total)||0) / (Number(project?.budget)||0) >= 0.85 ? 'warning' : 'success')}
                className="mb-3"
                label={`€${Number(total)||0} / €${Number(project?.budget)||0}`}
                showValueLabel
              />
              <div className="mb-3 flex items-center justify-end">
                <Button color="primary" variant="solid" size="sm" onPress={onAddPiece}>Adicionar peça</Button>
              </div>
              {(!items || items.length === 0) ? (
                <div className="text-default-500 text-sm">Sem itens neste projeto.</div>
              ) : (
                <div className="divide-y divide-divider rounded-medium overflow-hidden bg-content2 border border-divider">
                  {items.map((it) => {
                    const product = products.find((p) => p.id === it.productId);
                    const available = product ? getAvailableStock(product) : 0; // available excluding this line already
                    const maxAllowed = available + (Number(it.qty) || 0);
                    const remaining = Math.max(0, maxAllowed - (Number(it.qty) || 0)); // equals available
                    const low = remaining > 0 && remaining <= 10;
                    const out = remaining === 0;
                    const stockLabel = out ? 'Sem stock' : `Restam ${remaining}`;
                    const stockColor = out ? 'danger' : (low ? 'warning' : 'default');
                    const budget = Number(project?.budget) || 0;
                    const currentTotal = Number(total) || 0;
                    const lineTotal = (Number(it.unitPrice)||0) * (Number(it.qty)||0);
                    const remainingBudgetExcl = Math.max(0, budget - (currentTotal - lineTotal));
                    const unitPrice = Number(it.unitPrice) || 0;
                    const maxByBudget = unitPrice > 0 ? Math.floor(remainingBudgetExcl / unitPrice) : 0;
                    const maxByAll = Math.min(maxAllowed, maxByBudget);
                    const budgetBlocked = Number(it.qty) >= maxByBudget;

                    return (
                      <div key={it.key} className="px-4 py-3 grid grid-cols-[1fr_auto] gap-4 items-center text-sm">
                        <div className="min-w-0">
                          <div className="text-foreground truncate" title={it.name}>{it.name}</div>
                          <div className="text-default-500 flex items-center gap-2">
                            <span>{it.variant?.color} • {it.variant?.mode}</span>
                            <Chip size="sm" color={stockColor} variant="flat">{stockLabel}</Chip>
                            {budget > 0 && (
                              <Chip size="sm" color={budgetBlocked ? 'danger' : 'default'} variant="flat">
                                {budgetBlocked ? 'Sem orçamento' : `€${remainingBudgetExcl} restante`}
                              </Chip>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                          <div className="flex items-center gap-1">
                            <Tooltip content="Diminuir">
                              <Button isIconOnly size="sm" variant="flat" onPress={() => updateProjectItemQty(project.id, it.key, Math.max(0, Number(it.qty) - 1))}>
                                <Icon icon="lucide:minus" className="text-base" />
                              </Button>
                            </Tooltip>
                            <Input
                              type="number"
                              size="sm"
                              min={0}
                              value={String(it.qty)}
                              className="w-16"
                              onChange={(e)=> {
                                const desired = Number(e.target.value);
                                const clamped = Number.isFinite(desired) ? Math.max(0, Math.min(desired, maxByAll)) : 0;
                                updateProjectItemQty(project.id, it.key, clamped);
                              }}
                            />
                            <Tooltip content={remaining === 0 ? "Sem stock" : (budgetBlocked ? "Sem orçamento" : "Aumentar")}>
                              <Button isIconOnly size="sm" variant="flat" isDisabled={remaining === 0 || budgetBlocked} onPress={() => updateProjectItemQty(project.id, it.key, Number(it.qty) + 1)}>
                                <Icon icon="lucide:plus" className="text-base" />
                              </Button>
                            </Tooltip>
                          </div>
                          <div className="text-default-600 whitespace-nowrap w-24 text-right">€{(Number(it.unitPrice)||0) * (Number(it.qty)||0)}</div>
                          <Tooltip content="Remover linha">
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeProjectItem(project.id, it.key)}>
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
                <div className="text-sm text-default-500">{items?.length || 0} linhas • {piecesCount} peças</div>
                <div className="flex items-center gap-2">
                  <Button variant="flat" onPress={close}>Fechar</Button>
                </div>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


