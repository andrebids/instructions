import React from "react";
import { Card, CardBody, Chip } from "@heroui/react";
import { useShop } from "../context/ShopContext";
import { PageTitle } from "../components/page-title";

export default function Orders() {
  const { projects, cartByProject, totalsByProject } = useShop();

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Orders" userName="Christopher" subtitle="Review orders per project." className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const cart = cartByProject[proj.id] || { items: [] };
          const total = totalsByProject[proj.id]?.total || 0;
          const overBudget = total > proj.budget;
          return (
            <Card key={proj.id} className="bg-content1 border border-divider">
              <CardBody>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-foreground">{proj.name}</div>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat">Budget €{proj.budget}</Chip>
                    <Chip size="sm" color={overBudget ? "danger" : "success"} variant="flat">Total €{total}</Chip>
                  </div>
                </div>
                {cart.items.length === 0 ? (
                  <div className="text-default-500 text-sm">Sem itens neste projeto.</div>
                ) : (
                  <div className="divide-y divide-divider">
                    {cart.items.map((it) => (
                      <div key={it.key} className="py-2 flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <div className="text-foreground truncate">{it.name}</div>
                          <div className="text-default-500">{it.variant?.color} • {it.variant?.mode} • x{it.qty}</div>
                        </div>
                        <div className="text-default-600">€{it.unitPrice * it.qty}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


