import React, { useState } from 'react';
import { 
  Tabs, 
  Tab, 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  ButtonGroup, 
  Snippet,
  Divider,
  Switch
} from "@heroui/react";
import { Icon } from "@iconify/react";

// Helper component to display preview and code
const ComponentShowcase = ({ title, description, children, code }) => {
  return (
    <div className="mb-8 border border-default-200 dark:border-default-100 rounded-xl overflow-hidden bg-background">
      <div className="p-4 border-b border-default-200 dark:border-default-100 bg-default-50 dark:bg-default-50/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-default-500">{description}</p>}
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="p-4 border border-dashed border-default-300 rounded-lg flex flex-wrap gap-4 items-center justify-center bg-content1/50">
          {children}
        </div>
        <div className="relative">
          <Snippet 
            hideSymbol 
            variant="flat" 
            color="default"
            codeString={code}
            className="w-full text-sm"
          >
            {code.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </Snippet>
        </div>
      </div>
    </div>
  );
};

export default function DebugUI() {
  const [activeTab, setActiveTab] = useState("buttons");

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-hide">
      <div className="max-w-[1600px] mx-auto min-h-full">
        <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent w-fit">
          UI Design System
        </h1>
        <p className="text-default-500 max-w-2xl">
          Centralized style guide and component library. Use this page to reference standard UI elements, 
          copy usage patterns, and ensure consistency across the application.
        </p>
      </div>

      <Tabs 
        aria-label="Design System Sections" 
        color="primary" 
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary"
        }}
        selectedKey={activeTab}
        onSelectionChange={setActiveTab}
      >
        <Tab
          key="buttons"
          title={
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:mouse-pointer-2" width={20} />
              <span>Buttons</span>
            </div>
          }
        >
          <div className="pt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Variants */}
            <ComponentShowcase 
              title="Variants" 
              description="Standard button styles for different hierarchy levels."
              code={`<Button color="primary" className="font-medium" variant="solid">Solid</Button>
<Button color="primary" className="font-medium" variant="faded">Faded</Button>
<Button color="primary" className="font-medium" variant="bordered">Bordered</Button>
<Button color="primary" className="font-medium" variant="light">Light</Button>
<Button color="primary" className="font-medium" variant="flat">Flat</Button>
<Button color="primary" className="font-medium" variant="shadow">Shadow</Button>
<button className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300 group/btn">
  Glass <Icon icon="lucide:arrow-right" className="group-hover/btn:translate-x-1 transition-transform" />
</button>`}
            >
              <Button color="primary" className="font-medium" variant="solid">Solid</Button>
              <Button color="primary" className="font-medium" variant="faded">Faded</Button>
              <Button color="primary" className="font-medium" variant="bordered">Bordered</Button>
              <Button color="primary" className="font-medium" variant="light">Light</Button>
              <Button color="primary" className="font-medium" variant="flat">Flat</Button>
              <Button color="primary" className="font-medium" variant="shadow">Shadow</Button>
              <button 
                type="button" 
                className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu active:scale-[0.97] cursor-pointer outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 px-4 min-w-20 h-10 text-small gap-2 rounded-medium [&>svg]:max-w-[theme(spacing.8)] bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300 group/btn"
              >
                Glass 
                <Icon icon="lucide:arrow-right" className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </ComponentShowcase>

            {/* Colors */}
            <ComponentShowcase 
              title="Colors" 
              description="Semantic color palette for communicating state."
              code={`<Button color="default" className="font-medium text-white">Default</Button>
<Button color="primary" className="bg-primary-500 font-medium text-white">Primary</Button>
<Button color="secondary" className="font-medium text-white">Secondary</Button>
<Button color="success" className="font-medium text-white">Success</Button>
<Button color="warning" className="font-medium text-white">Warning</Button>
<Button color="danger" className="font-medium text-white">Danger</Button>`}
            >
              <Button color="default" className="font-medium text-white">Default</Button>
              <Button color="primary" className="bg-primary-500 font-medium text-white">Primary</Button>
              <Button color="secondary" className="font-medium text-white">Secondary</Button>
              <Button color="success" className="font-medium text-white">Success</Button>
              <Button color="warning" className="font-medium text-white">Warning</Button>
              <Button color="danger" className="font-medium text-white">Danger</Button>
            </ComponentShowcase>

            {/* Sizes */}
            <ComponentShowcase 
              title="Sizes" 
              description="Button scaling options."
              code={`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
            >
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </ComponentShowcase>



            {/* With Icons */}
            <ComponentShowcase 
              title="With Icons" 
              description="Buttons integrated with Iconify icons."
              code={`<Button color="primary" startContent={<Icon icon="lucide:user" />}>
  User Profile
</Button>
<Button color="secondary" endContent={<Icon icon="lucide:camera" />}>
  Take Photo
</Button>
<Button isIconOnly color="danger" aria-label="Like">
  <Icon icon="lucide:heart" width={20} />
</Button>
<Button isIconOnly color="warning" variant="faded" aria-label="Take a photo">
  <Icon icon="lucide:camera" width={20} />
</Button>`}
            >
              <Button color="primary" startContent={<Icon icon="lucide:user" />}>
                User Profile
              </Button>
              <Button color="secondary" endContent={<Icon icon="lucide:camera" />}>
                Take Photo
              </Button>
              <Button isIconOnly color="danger" aria-label="Like">
                <Icon icon="lucide:heart" width={20} />
              </Button>
              <Button isIconOnly color="warning" variant="faded" aria-label="Take a photo">
                <Icon icon="lucide:camera" width={20} />
              </Button>
            </ComponentShowcase>

            {/* Loading State */}
            <ComponentShowcase 
              title="Loading State" 
              description="Built-in loading indicators."
              code={`<Button isLoading color="primary">
  Loading
</Button>
<Button isLoading color="secondary" spinnerPlacement="end">
  Processing
</Button>`}
            >
              <Button isLoading color="primary">
                Loading
              </Button>
              <Button isLoading color="secondary" spinnerPlacement="end">
                Processing
              </Button>
            </ComponentShowcase>

             {/* Button Group */}
             <ComponentShowcase 
              title="Button Group" 
              description="Grouped actions."
              code={`<ButtonGroup>
  <Button>One</Button>
  <Button>Two</Button>
  <Button>Three</Button>
</ButtonGroup>`}
            >
              <ButtonGroup>
                <Button>One</Button>
                <Button>Two</Button>
                <Button>Three</Button>
              </ButtonGroup>
            </ComponentShowcase>





          </div>
        </Tab>
        
        <Tab
          key="inputs"
          title={
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:text-cursor-input" width={20} />
              <span>Inputs (Coming Soon)</span>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center p-20 text-default-400">
            <Icon icon="lucide:construction" width={64} className="mb-4 text-default-200" />
            <p className="text-xl">Input components section is under construction.</p>
          </div>
        </Tab>
      </Tabs>
      </div>
    </div>
  );
}
