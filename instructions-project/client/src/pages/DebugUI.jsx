import React from 'react';
import { Button, Snippet, Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";

const ActionCard = ({ title, button, code }) => {
  return (
    <Card className="shadow-sm border border-default-200 dark:border-default-100 h-full">
      <CardHeader className="bg-default-50 dark:bg-default-50/50 border-b border-default-200 dark:border-default-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-default-700">{title}</h3>
      </CardHeader>
      <CardBody className="p-4 flex flex-col items-center justify-between gap-4">
        <div className="flex-grow flex items-center justify-center py-4 w-full border border-dashed border-default-200 rounded-lg bg-content1/50">
          {button}
        </div>
        <Snippet
          hideSymbol
          variant="flat"
          color="default"
          size="sm"
          codeString={code}
          className="w-full max-w-full"
          classNames={{
            pre: "truncate text-xs",
            base: "p-2 w-full"
          }}
        />
      </CardBody>
    </Card>
  );
};

export default function DebugUI() {
  const actions = [
    {
      title: "Cancel",
      button: (
        <Button color="danger" variant="flat" className="font-medium" startContent={<Icon icon="lucide:x" width={20} />}>
          Cancel
        </Button>
      ),
      code: `<Button color="danger" variant="flat" className="font-medium" startContent={<Icon icon="lucide:x" width={20} />}>\n  Cancel\n</Button>`
    },
    {
      title: "Approve",
      button: (
        <Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:check" width={20} />}>
          Approve
        </Button>
      ),
      code: `<Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:check" width={20} />}>\n  Approve\n</Button>`
    },
    {
      title: "Edit",
      button: (
        <button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-primary-500/10 backdrop-blur-md border border-primary-500/20 text-primary-500 font-medium hover:bg-primary-500/20 transition-all duration-300 group/btn">
          Edit <Icon icon="lucide:pencil" width={18} className="group-hover/btn:scale-110 transition-transform ml-2" />
        </button>
      ),
      code: `<button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-primary-500/10 backdrop-blur-md border border-primary-500/20 text-primary-500 font-medium hover:bg-primary-500/20 transition-all duration-300 group/btn">\n  Edit <Icon icon="lucide:pencil" width={18} className="group-hover/btn:scale-110 transition-transform ml-2" />\n</button>`
    },
    {
      title: "Unlock",
      button: (
        <Button color="default" variant="flat" className="font-medium text-warning" startContent={<Icon icon="lucide:lock-open" width={18} />}>
          Unlock
        </Button>
      ),
      code: `<Button color="default" variant="flat" className="font-medium text-warning" startContent={<Icon icon="lucide:lock-open" width={18} />}>\n  Unlock\n</Button>`
    },
    {
      title: "Back",
      button: (
        <Button color="default" variant="light" className="font-medium" startContent={<Icon icon="lucide:chevron-left" width={20} />}>
          Back
        </Button>
      ),
      code: `<Button color="default" variant="light" className="font-medium" startContent={<Icon icon="lucide:chevron-left" width={20} />}>\n  Back\n</Button>`
    },
    {
      title: "Next",
      button: (
        <Button className="bg-primary-500 font-medium text-white" endContent={<Icon icon="lucide:chevron-right" width={20} />}>
          Next
        </Button>
      ),
      code: `<Button className="bg-primary-500 font-medium text-white" endContent={<Icon icon="lucide:chevron-right" width={20} />}>\n  Next\n</Button>`
    },
    {
      title: "Order",
      button: (
        <Button className="bg-primary-500 font-medium text-white shadow-lg shadow-primary-500/40" startContent={<Icon icon="lucide:shopping-bag" width={18} />}>
          Order
        </Button>
      ),
      code: `<Button className="bg-primary-500 font-medium text-white shadow-lg shadow-primary-500/40" startContent={<Icon icon="lucide:shopping-bag" width={18} />}>\n  Order\n</Button>`
    },
    {
      title: "Extend",
      button: (
        <Button color="warning" variant="flat" className="font-medium" startContent={<Icon icon="lucide:clock" width={18} />}>
          Extend
        </Button>
      ),
      code: `<Button color="warning" variant="flat" className="font-medium" startContent={<Icon icon="lucide:clock" width={18} />}>\n  Extend\n</Button>`
    },
    {
      title: "Create",
      button: (
        <Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:plus" width={20} />}>
          Create
        </Button>
      ),
      code: `<Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:plus" width={20} />}>\n  Create\n</Button>`
    },
    {
      title: "Confirm",
      button: (
        <Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:check-circle" width={18} />}>
          Confirm
        </Button>
      ),
      code: `<Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:check-circle" width={18} />}>\n  Confirm\n</Button>`
    },
    {
      title: "Add",
      button: (
        <button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-primary-500/10 backdrop-blur-md border border-primary-500/20 text-primary-500 font-medium hover:bg-primary-500/20 transition-all duration-300 group/btn">
          Add <Icon icon="lucide:plus-circle" width={18} className="group-hover/btn:rotate-90 transition-transform ml-2" />
        </button>
      ),
      code: `<button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-primary-500/10 backdrop-blur-md border border-primary-500/20 text-primary-500 font-medium hover:bg-primary-500/20 transition-all duration-300 group/btn">\n  Add <Icon icon="lucide:plus-circle" width={18} className="group-hover/btn:rotate-90 transition-transform ml-2" />\n</button>`
    },
    {
      title: "Delete",
      button: (
        <Button color="danger" variant="solid" className="font-medium" startContent={<Icon icon="lucide:trash-2" width={18} />}>
          Delete
        </Button>
      ),
      code: `<Button color="danger" variant="solid" className="font-medium" startContent={<Icon icon="lucide:trash-2" width={18} />}>\n  Delete\n</Button>`
    },
    {
      title: "Save",
      button: (
        <Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:save" width={18} />}>
          Save
        </Button>
      ),
      code: `<Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:save" width={18} />}>\n  Save\n</Button>`
    },
    {
      title: "Search",
      button: (
        <button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-default-100/50 backdrop-blur-md border border-default-200/50 text-default-600 font-medium hover:bg-default-200/50 transition-all duration-300 group/btn">
          Search <Icon icon="lucide:search" width={18} className="ml-2" />
        </button>
      ),
      code: `<button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-default-100/50 backdrop-blur-md border border-default-200/50 text-default-600 font-medium hover:bg-default-200/50 transition-all duration-300 group/btn">\n  Search <Icon icon="lucide:search" width={18} className="ml-2" />\n</button>`
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-hide">
      <div className="max-w-[1600px] mx-auto min-h-full">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent w-fit">
            Action Registry
          </h1>
          <p className="text-default-500 max-w-2xl">
            Standardized application action buttons. Hover to see interactions, click the copy icon to get the exact code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {actions.map((action, index) => (
            <ActionCard 
              key={index} 
              title={action.title} 
              button={action.button} 
              code={action.code} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
