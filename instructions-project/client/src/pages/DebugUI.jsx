import React from 'react';
import { Button, Snippet, Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Ripple, useRipple } from "../components/ui/Ripple";

const ActionCard = ({ title, button, code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="shadow-sm border border-default-200 dark:border-default-100 h-full">
      <CardHeader className="bg-default-50 dark:bg-default-50/50 border-b border-default-200 dark:border-default-100 px-3 py-2 flex justify-between items-center">
        <h3 className="text-xs font-semibold text-default-700 uppercase tracking-wider">{title}</h3>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={handleCopy}
          className="min-w-6 w-6 h-6 text-default-400 hover:text-primary-500"
        >
          {copied ? <Icon icon="lucide:check" width={14} /> : <Icon icon="lucide:copy" width={14} />}
        </Button>
      </CardHeader>
      <CardBody className="p-4 flex items-center justify-center min-h-[100px]">
        {button}
      </CardBody>
    </Card>
  );
};

const HeroButton = ({ children, className, ...props }) => {
  const { ripples, onRippleClickHandler, onClearRipple } = useRipple();

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onMouseDown={onRippleClickHandler}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {children}
      <Ripple ripples={ripples} onClear={onClearRipple} />
    </motion.button>
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
        <Button className="bg-[oklch(73.29%_0.1935_150.81)] font-medium text-white" startContent={<Icon icon="lucide:check" width={20} />}>
          Approve
        </Button>
      ),
      code: `<Button className="bg-[oklch(73.29%_0.1935_150.81)] font-medium text-white" startContent={<Icon icon="lucide:check" width={20} />}>\n  Approve\n</Button>`
    },
    {
      title: "Edit",
      button: (
        <HeroButton className="h-10 text-small px-4 z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 min-w-20 gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-[oklch(82.03%_0.1388_76.34)]/10 backdrop-blur-md border border-[oklch(82.03%_0.1388_76.34)]/20 text-[oklch(82.03%_0.1388_76.34)] font-medium hover:bg-[oklch(82.03%_0.1388_76.34)]/20 transition-colors duration-300 group/btn">
          <Icon icon="lucide:pencil" width={18} className="group-hover/btn:scale-110 transition-transform mr-1" /> Edit
        </HeroButton>
      ),
      code: `<button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-[oklch(82.03%_0.1388_76.34)]/10 backdrop-blur-md border border-[oklch(82.03%_0.1388_76.34)]/20 text-[oklch(82.03%_0.1388_76.34)] font-medium hover:bg-[oklch(82.03%_0.1388_76.34)]/20 transition-all duration-300 group/btn">\n  <Icon icon="lucide:pencil" width={18} className="group-hover/btn:scale-110 transition-transform mr-2" /> Edit\n</button>`
    },
    {
      title: "Unlock",
      button: (
        <Button variant="flat" className="font-medium bg-[oklch(82.03%_0.1388_76.34)]/20 text-[oklch(82.03%_0.1388_76.34)]" startContent={<Icon icon="lucide:lock-open" width={18} />}>
          Unlock
        </Button>
      ),
      code: `<Button variant="flat" className="font-medium bg-[oklch(82.03%_0.1388_76.34)]/20 text-[oklch(82.03%_0.1388_76.34)]" startContent={<Icon icon="lucide:lock-open" width={18} />}>\n  Unlock\n</Button>`
    },
    {
      title: "Back",
      button: (
        <Button variant="flat" className="font-medium bg-default-400/20 text-default-700" startContent={<Icon icon="lucide:chevron-left" width={20} />}>
          Back
        </Button>
      ),
      code: `<Button variant="flat" className="font-medium bg-default-400/20 text-default-700" startContent={<Icon icon="lucide:chevron-left" width={20} />}>\n  Back\n</Button>`
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
        <Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:shopping-bag" width={18} />}>
          Order
        </Button>
      ),
      code: `<Button className="bg-primary-500 font-medium text-white" startContent={<Icon icon="lucide:shopping-bag" width={18} />}>\n  Order\n</Button>`
    },
    {
      title: "Extend",
      button: (
        <Button variant="flat" className="font-medium bg-[oklch(82.03%_0.1388_76.34)]/20 text-[oklch(82.03%_0.1388_76.34)]" startContent={<Icon icon="lucide:clock" width={18} />}>
          Extend
        </Button>
      ),
      code: `<Button variant="flat" className="font-medium bg-[oklch(82.03%_0.1388_76.34)]/20 text-[oklch(82.03%_0.1388_76.34)]" startContent={<Icon icon="lucide:clock" width={18} />}>\n  Extend\n</Button>`
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
        <Button className="bg-[oklch(73.29%_0.1935_150.81)] font-medium text-white" startContent={<Icon icon="lucide:check-circle" width={18} />}>
          Confirm
        </Button>
      ),
      code: `<Button className="bg-[oklch(73.29%_0.1935_150.81)] font-medium text-white" startContent={<Icon icon="lucide:check-circle" width={18} />}>\n  Confirm\n</Button>`
    },
    {
      title: "Add",
      button: (
        <HeroButton className="h-10 text-small px-4 z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 min-w-20 gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-primary-500/10 backdrop-blur-md border border-primary-500/20 text-primary-500 font-medium hover:bg-primary-500/20 transition-colors duration-300 group/btn">
          <Icon icon="lucide:plus-circle" width={18} className="group-hover/btn:rotate-90 transition-transform mr-1" /> Add
        </HeroButton>
      ),
      code: `<button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-primary-500/10 backdrop-blur-md border border-primary-500/20 text-primary-500 font-medium hover:bg-primary-500/20 transition-all duration-300 group/btn">\n  <Icon icon="lucide:plus-circle" width={18} className="group-hover/btn:rotate-90 transition-transform mr-2" /> Add\n</button>`
    },
    {
      title: "Delete",
      button: (
        <Button className="bg-[oklch(59.4%_0.1967_24.63)] font-medium text-white" startContent={<Icon icon="lucide:trash-2" width={18} />}>
          Delete
        </Button>
      ),
      code: `<Button className="bg-[oklch(59.4%_0.1967_24.63)] font-medium text-white" startContent={<Icon icon="lucide:trash-2" width={18} />}>\n  Delete\n</Button>`
    },
    {
      title: "Save",
      button: (
        <Button className="bg-[oklch(73.29%_0.1935_150.81)] font-medium text-white" startContent={<Icon icon="lucide:save" width={18} />}>
          Save
        </Button>
      ),
      code: `<Button className="bg-[oklch(73.29%_0.1935_150.81)] font-medium text-white" startContent={<Icon icon="lucide:save" width={18} />}>\n  Save\n</Button>`
    },
    {
      title: "Search",
      button: (
        <HeroButton className="h-10 text-small px-4 z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 min-w-20 gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-default-100/50 backdrop-blur-md border border-default-200/50 text-default-600 font-medium hover:bg-default-200/50 transition-colors duration-300 group/btn">
          Search <Icon icon="lucide:search" width={18} className="ml-1" />
        </HeroButton>
      ),
      code: `<button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-default-100/50 backdrop-blur-md border border-default-200/50 text-default-600 font-medium hover:bg-default-200/50 transition-all duration-300 group/btn">\n  Search <Icon icon="lucide:search" width={18} className="ml-2" />\n</button>`
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-4 scrollbar-hide">
      <div className="max-w-[1600px] mx-auto min-h-full">
        <div className="mb-4 flex flex-col gap-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent w-fit">
            Action Registry
          </h1>
          <p className="text-sm text-default-500 max-w-2xl">
            Standardized application action buttons.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-20">
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
