import React from "react";
import { Card, CardBody, Chip, Progress } from "@heroui/react";
import { useShop } from "../context/ShopContext";
import { PageTitle } from "../components/page-title";
import ProjectOrderModal from "../components/projects/ProjectOrderModal";
import ProjectAddPieceModal from "../components/projects/ProjectAddPieceModal";

export default function Projects() {
  const { projects, cartByProject, totalsByProject } = useShop();
  const [openProject, setOpenProject] = React.useState(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Projects" userName="Christopher" subtitle="Review projects and budgets." className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const cart = cartByProject[proj.id] || { items: [] };
          const total = totalsByProject[proj.id]?.total || 0;
          const budgetValue = Number(proj.budget) || 0;
          const overBudget = total > budgetValue;
          const piecesCount = (cart.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
          const percent = budgetValue > 0 ? Math.min(100, Math.round((total / budgetValue) * 100)) : 0;
          const barColor = overBudget ? "danger" : (percent >= 85 ? "warning" : "success");
          return (
            <Card key={proj.id} isPressable onPress={() => setOpenProject(proj)} className="bg-content1 border border-divider cursor-pointer">
              <CardBody>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-foreground">{proj.name}</div>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat">Budget €{budgetValue}</Chip>
                    <Chip size="sm" variant="flat">Peças {piecesCount}</Chip>
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
                  <div className="text-default-500 text-sm">Sem itens neste projeto.</div>
                ) : null}
              </CardBody>
            </Card>
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
    </div>
  );
}



