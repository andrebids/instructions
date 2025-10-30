import React from "react";
import { Card, CardBody, Chip, Progress, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Tooltip } from "@heroui/react";
import { useShop } from "../context/ShopContext";
import { PageTitle } from "../components/page-title";
import { useUser } from "../context/UserContext";
import ProjectOrderModal from "../components/projects/ProjectOrderModal";
import ProjectAddPieceModal from "../components/projects/ProjectAddPieceModal";
import { Icon } from "@iconify/react";

export default function Projects() {
  const { userName } = useUser();
  const { projects, cartByProject, totalsByProject, projectStatusById, setProjectStatus, projectBudgetById, setProjectBudget } = useShop();
  const [openProject, setOpenProject] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [confirmProject, setConfirmProject] = React.useState(null);
  const [editBudgetProject, setEditBudgetProject] = React.useState(null);
  const [budgetInput, setBudgetInput] = React.useState(0);

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

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Projects" userName={userName} lead={`Manage your projects, ${userName}`} subtitle="Review projects and budgets." className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const cart = cartByProject[proj.id] || { items: [] };
          const total = totalsByProject[proj.id]?.total || 0;
          const budgetValue = Number(projectBudgetById?.[proj.id] ?? proj.budget) || 0;
          const overBudget = total > budgetValue;
          const piecesCount = (cart.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
          const percent = budgetValue > 0 ? Math.min(100, Math.round((total / budgetValue) * 100)) : 0;
          const barColor = overBudget ? "danger" : (percent >= 85 ? "warning" : "success");
          const status = projectStatusById?.[proj.id] || "created";
          return (
            <div key={proj.id} onClick={() => setOpenProject(proj)} className="cursor-pointer">
              <Card className="bg-content1 border border-divider">
                <CardBody>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={(e)=> { e.stopPropagation(); setOpenProject(proj); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e)=> { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpenProject(proj); } }}
                    aria-label={`Open project ${proj.name}`}
                  >
                    {proj.name}
                  </div>
                    <div className="flex items-center gap-2">
                    <div onClick={(e)=> e.stopPropagation()}>
                      <Dropdown>
                      <DropdownTrigger>
                        <Chip as="button" size="sm" color={statusColorMap[status]} variant="flat">
                          {statusLabelMap[status]}
                        </Chip>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Change project status" onAction={(key)=> setProjectStatus(proj.id, String(key))}>
                        {Object.keys(statusLabelMap).map((k)=> (
                          <DropdownItem key={k}>{statusLabelMap[k]}</DropdownItem>
                        ))}
                      </DropdownMenu>
                      </Dropdown>
                    </div>
                    <div onClick={(e)=> e.stopPropagation()}>
                      <Chip
                        as="button"
                        size="sm"
                        variant="flat"
                        className={status==='ordered' ? 'opacity-60 cursor-not-allowed' : ''}
                        onClick={()=> { if (status==='ordered') return; setEditBudgetProject(proj); setBudgetInput(budgetValue); }}
                        startContent={<Icon icon="lucide:pencil" className="text-xs" />}
                      >
                        Budget €{budgetValue}
                      </Chip>
                    </div>
                    <Chip size="sm" variant="flat">Pieces {piecesCount}</Chip>
                    <Chip size="sm" color={overBudget ? "danger" : "success"} variant="flat">Total €{total}</Chip>
                  </div>
                </div>
                <Progress
                  aria-label="Budget progress"
                  value={percent}
                  color={barColor}
                  className="mb-2"
                  label={`€${total} / €${budgetValue}`}
                  showValueLabel
                />
                {cart.items.length === 0 ? (
                  <div className="text-default-500 text-sm">No items in this project.</div>
                ) : null}

                {/* Bottom-right action row */}
                <div className="mt-3 flex items-center justify-end">
                  {status === 'to_order' && (
                    <Button color="primary" startContent={<Icon icon="lucide:shopping-cart" className="text-sm" />} onPress={(e)=> { e.stopPropagation(); setConfirmProject(proj); }}>Place order</Button>
                  )}
                </div>
                </CardBody>
              </Card>
            </div>
          );
        })}
      </div>
      <ProjectOrderModal
        isOpen={!!openProject}
        onOpenChange={(v)=>{ if (!v) { setOpenProject(null); setAdding(false); } }}
        project={openProject}
        items={openProject ? (cartByProject[openProject.id]?.items || []) : []}
        total={openProject ? (totalsByProject[openProject.id]?.total || 0) : 0}
        onAddPiece={() => setAdding(true)}
      />
      <ProjectAddPieceModal
        isOpen={!!openProject && adding}
        onOpenChange={(v)=>{ if (!v) setAdding(false); }}
        project={openProject}
      />

      {/* Confirm Order Modal */}
      <Modal isOpen={!!confirmProject} onOpenChange={(v)=>{ if (!v) setConfirmProject(null); }}>
        <ModalContent>
          {(close)=> (
            <>
              <ModalHeader>Confirm order</ModalHeader>
              <ModalBody>
                Are you sure you want to order items for "{confirmProject?.name}"?
                You can review the items before confirming.
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={()=> { setProjectStatus(confirmProject.id, 'ordered'); setConfirmProject(null); }}>Confirm order</Button>
                <Button variant="flat" onPress={()=> { setOpenProject(confirmProject); setConfirmProject(null); }}>Review project</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal isOpen={!!editBudgetProject} onOpenChange={(v)=> { if (!v) setEditBudgetProject(null); }}>
        <ModalContent>
          {(close)=> (
            <>
              <ModalHeader>Edit budget</ModalHeader>
              <ModalBody>
                <div className="space-y-2">
                  <div className="text-sm text-default-500">Project</div>
                  <div className="font-medium">{editBudgetProject?.name}</div>
                  <div className="text-sm text-default-500">New budget</div>
                  <Input type="number" aria-label="New budget" value={String(budgetInput)} onChange={(e)=> setBudgetInput(Number(e.target.value))} />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={()=> { setProjectBudget(editBudgetProject.id, budgetInput); setEditBudgetProject(null); }}>Save</Button>
                <Button variant="flat" onPress={close}>Cancel</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}



