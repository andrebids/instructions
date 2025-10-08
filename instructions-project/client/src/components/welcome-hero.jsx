import React from "react";
import {Chip} from "@heroui/react";

export function WelcomeHero({userName = "Christopher"}) {
  return (
    <div className="mb-6">
      <Chip
        size="lg"
        variant="flat"
        radius="full"
        className="border-none bg-transparent text-default-700 dark:text-default-600 px-0 py-3"
        classNames={{ content: "px-0" }}
        startContent={<span className="text-lg">👋</span>}
      >
        {`Welcome in, ${userName}`}
      </Chip>
      <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">Your Dashboard</h1>
    </div>
  );
}


