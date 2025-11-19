import React from "react";
import {
  Input,
  Checkbox,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Button,
  Divider,
  Switch,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";

export function StepLogoInstructions({ formData, onInputChange }) {
  const logoDetails = formData.logoDetails || {};

  const handleUpdate = (key, value) => {
    onInputChange("logoDetails", {
      ...logoDetails,
      [key]: value
    });
  };

  const handleDimensionUpdate = (dim, field, value) => {
    const dimensions = logoDetails.dimensions || {};
    handleUpdate("dimensions", {
      ...dimensions,
      [dim]: {
        ...dimensions[dim],
        [field]: value
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Logo Instructions</h2>
          <p className="text-default-500">Define the technical specifications for the logo</p>
        </div>
        <Button
          color="primary"
          variant="shadow"
          className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white"
          startContent={<Icon icon="lucide:sparkles" className="w-5 h-5" />}
          onPress={() => console.log("Open Chatbot")}
        >
          AI Assistant
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left Column - Main Specs */}
        <div className="xl:col-span-8 space-y-6">

          {/* 1. Identity Section */}
          <Card className="shadow-sm">
            <CardHeader className="px-6 pt-6 pb-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="lucide:fingerprint" className="text-primary" />
                Project Identity
              </h3>
            </CardHeader>
            <CardBody className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Logo Number"
                placeholder="142STE..."
                variant="bordered"
                value={logoDetails.logoNumber || ""}
                onValueChange={(v) => handleUpdate("logoNumber", v)}
              />
              <Input
                label="Logo Name"
                placeholder="Project Name"
                variant="bordered"
                value={logoDetails.logoName || ""}
                onValueChange={(v) => handleUpdate("logoName", v)}
              />
              <Input
                label="Requested By"
                placeholder="Name"
                variant="bordered"
                value={logoDetails.requestedBy || ""}
                onValueChange={(v) => handleUpdate("requestedBy", v)}
              />
            </CardBody>
          </Card>

          {/* 2. Physical Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensions */}
            <Card className="shadow-sm h-full">
              <CardHeader className="px-6 pt-6 pb-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="lucide:ruler" className="text-primary" />
                  Dimensions
                </h3>
              </CardHeader>
              <CardBody className="p-6 space-y-4">
                {['Height', 'Length', 'Width', 'Diameter'].map((dim) => {
                  const key = dim.toLowerCase();
                  return (
                    <div key={key} className="flex items-end gap-3">
                      <Input
                        label={dim}
                        type="number"
                        endContent={<span className="text-default-400 text-xs">m</span>}
                        variant="flat"
                        size="sm"
                        className="flex-1"
                        value={logoDetails.dimensions?.[key]?.value || ""}
                        onValueChange={(v) => handleDimensionUpdate(key, "value", v)}
                      />
                      <div className="pb-2">
                        <Checkbox
                          size="sm"
                          color="danger"
                          isSelected={logoDetails.dimensions?.[key]?.imperative || false}
                          onValueChange={(v) => handleDimensionUpdate(key, "imperative", v)}
                        >
                          Imperative
                        </Checkbox>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>

            {/* Fixation & Constraints */}
            <Card className="shadow-sm h-full">
              <CardHeader className="px-6 pt-6 pb-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="lucide:anchor" className="text-primary" />
                  Fixation & Constraints
                </h3>
              </CardHeader>
              <CardBody className="p-6 space-y-6">
                {/* Usage Toggle */}
                <div>
                  <p className="text-sm font-medium text-default-700 mb-2">Usage Environment</p>
                  <Tabs
                    fullWidth
                    size="md"
                    aria-label="Usage Options"
                    selectedKey={logoDetails.usageIndoor ? "indoor" : "outdoor"}
                    onSelectionChange={(key) => {
                      if (key === "indoor") {
                        handleUpdate("usageIndoor", true);
                        handleUpdate("usageOutdoor", false);
                      } else {
                        handleUpdate("usageIndoor", false);
                        handleUpdate("usageOutdoor", true);
                      }
                    }}
                  >
                    <Tab key="indoor" title="Indoor" />
                    <Tab key="outdoor" title="Outdoor" />
                  </Tabs>
                </div>

                <div>
                  <Select
                    label="Fixation Type"
                    placeholder="Select fixation"
                    selectedKeys={logoDetails.fixationType ? [logoDetails.fixationType] : []}
                    onChange={(e) => handleUpdate("fixationType", e.target.value)}
                  >
                    <SelectItem key="ground">Ground</SelectItem>
                    <SelectItem key="wall">Wall</SelectItem>
                    <SelectItem key="suspended">Suspended / Transversal</SelectItem>
                    <SelectItem key="none">None</SelectItem>
                    <SelectItem key="pole_side">Pole (Side)</SelectItem>
                    <SelectItem key="pole_central">Pole (Central)</SelectItem>
                    <SelectItem key="special">Special</SelectItem>
                  </Select>

                  {(logoDetails.fixationType === "pole_central" || logoDetails.fixationType === "pole_side") && (
                    <Input
                      label="Mast Diameter"
                      size="sm"
                      endContent="mm"
                      className="mt-3"
                      variant="bordered"
                      value={logoDetails.mastDiameter || ""}
                      onValueChange={(v) => handleUpdate("mastDiameter", v)}
                    />
                  )}
                </div>

                <Divider />

                {/* Lacquered Structure Moved Here */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-default-600">Lacquered Structure</span>
                    <Switch
                      size="sm"
                      isSelected={logoDetails.lacqueredStructure}
                      onValueChange={(v) => handleUpdate("lacqueredStructure", v)}
                    />
                  </div>
                  {logoDetails.lacqueredStructure && (
                    <Input
                      placeholder="RAL Color / Reference"
                      size="sm"
                      startContent={<Icon icon="lucide:palette" className="text-default-400" />}
                      value={logoDetails.lacquerColor || ""}
                      onValueChange={(v) => handleUpdate("lacquerColor", v)}
                    />
                  )}
                </div>

                <Divider />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Checkbox size="sm" isSelected={logoDetails.maxWeightConstraint} onValueChange={(v) => handleUpdate("maxWeightConstraint", v)}>Max Weight</Checkbox>
                    {logoDetails.maxWeightConstraint && (
                      <Input
                        placeholder="kg"
                        size="sm"
                        className="w-20"
                        value={logoDetails.maxWeight || ""}
                        onValueChange={(v) => handleUpdate("maxWeight", v)}
                      />
                    )}
                  </div>
                  <Checkbox size="sm" isSelected={logoDetails.ballast} onValueChange={(v) => handleUpdate("ballast", v)}>Ballast Integration</Checkbox>
                  <Checkbox size="sm" isSelected={logoDetails.controlReport} onValueChange={(v) => handleUpdate("controlReport", v)}>Control Bureau Report</Checkbox>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* 3. Description & Criteria */}
          <Card className="shadow-sm">
            <CardHeader className="px-6 pt-6 pb-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="lucide:file-text" className="text-primary" />
                Details & Criteria
              </h3>
            </CardHeader>
            <CardBody className="p-6 space-y-4">
              <Textarea
                label="Specific Criteria"
                placeholder="Enter any specific requirements or criteria..."
                minRows={2}
                variant="bordered"
                value={logoDetails.criteria || ""}
                onValueChange={(v) => handleUpdate("criteria", v)}
              />
              <div className="flex gap-4">
                <Textarea
                  label="Full Description"
                  placeholder="Detailed description of the logo..."
                  minRows={4}
                  className="flex-1"
                  variant="bordered"
                  value={logoDetails.description || ""}
                  onValueChange={(v) => handleUpdate("description", v)}
                />
                <div className="flex flex-col gap-2 pt-2">
                  <Checkbox
                    isSelected={logoDetails.hasAttachments}
                    onValueChange={(v) => handleUpdate("hasAttachments", v)}
                  >
                    Has Attachments
                  </Checkbox>
                </div>
              </div>
            </CardBody>
          </Card>

        </div>

        {/* Right Column - Composition & Options */}
        <div className="xl:col-span-4 space-y-6">

          {/* Composition Card */}
          <Card className="shadow-sm h-full">
            <CardHeader className="px-6 pt-6 pb-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="lucide:layers" className="text-primary" />
                Composition
              </h3>
            </CardHeader>
            <CardBody className="p-6 space-y-8">

              {/* Lighting */}
              <div>
                <p className="text-sm font-bold text-default-900 mb-3 uppercase tracking-wider">Lighting</p>
                <div className="flex flex-col gap-2">
                  <Checkbox isSelected={logoDetails.lightNone} onValueChange={(v) => handleUpdate("lightNone", v)}>No Light</Checkbox>
                  <Checkbox isSelected={logoDetails.lightRope} onValueChange={(v) => handleUpdate("lightRope", v)}>Rope Light</Checkbox>
                  <Checkbox isSelected={logoDetails.lightFireflies24} onValueChange={(v) => handleUpdate("lightFireflies24", v)}>Fireflies 24V</Checkbox>
                  <Checkbox isSelected={logoDetails.lightFireflies230} onValueChange={(v) => handleUpdate("lightFireflies230", v)}>Fireflies 230V</Checkbox>
                  <Checkbox isSelected={logoDetails.lightSparkles} onValueChange={(v) => handleUpdate("lightSparkles", v)}>Sparkles</Checkbox>
                  <Checkbox isSelected={logoDetails.lightXled} onValueChange={(v) => handleUpdate("lightXled", v)}>XLED Rods</Checkbox>
                  <Checkbox isSelected={logoDetails.lightComet} onValueChange={(v) => handleUpdate("lightComet", v)}>Comet Wire</Checkbox>
                  <Checkbox isSelected={logoDetails.lightSoftXled} onValueChange={(v) => handleUpdate("lightSoftXled", v)}>Soft XLED</Checkbox>

                  <Divider className="my-2" />

                  <div className="grid grid-cols-2 gap-2">
                    <Checkbox size="sm" isSelected={logoDetails.lightFlash} onValueChange={(v) => handleUpdate("lightFlash", v)}>With Flash</Checkbox>
                    <Checkbox size="sm" isSelected={logoDetails.lightProjectors} onValueChange={(v) => handleUpdate("lightProjectors", v)}>Projectors</Checkbox>
                  </div>
                </div>
              </div>

              {/* Passive / Print */}
              <div>
                <p className="text-sm font-bold text-default-900 mb-3 uppercase tracking-wider">Passive / Print</p>
                <div className="space-y-3">
                  <Checkbox isSelected={logoDetails.passiveStraw} onValueChange={(v) => handleUpdate("passiveStraw", v)}>Green Synth. Straw</Checkbox>
                  <Checkbox isSelected={logoDetails.passiveCarpet} onValueChange={(v) => handleUpdate("passiveCarpet", v)}>Carpet</Checkbox>

                  <div className="space-y-2 pt-2">
                    <Input
                      label="Print 1"
                      size="sm"
                      variant="flat"
                      value={logoDetails.print1 || ""}
                      onValueChange={(v) => handleUpdate("print1", v)}
                    />
                    <Input
                      label="Print 2"
                      size="sm"
                      variant="flat"
                      value={logoDetails.print2 || ""}
                      onValueChange={(v) => handleUpdate("print2", v)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <p className="text-sm font-bold text-default-900 mb-3 uppercase tracking-wider">Advanced Options</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pilotable</span>
                    <Switch size="sm" isSelected={logoDetails.pilotable} onValueChange={(v) => handleUpdate("pilotable", v)} />
                  </div>
                  {logoDetails.pilotable && (
                    <Select
                      placeholder="System"
                      size="sm"
                      className="w-full"
                      selectedKeys={logoDetails.pilotSystem ? [logoDetails.pilotSystem] : []}
                      onChange={(e) => handleUpdate("pilotSystem", e.target.value)}
                    >
                      <SelectItem key="orchestra">Orchestra</SelectItem>
                      <SelectItem key="switch">Switch</SelectItem>
                      <SelectItem key="cameleon">Cameleon</SelectItem>
                      <SelectItem key="rgb">RGB</SelectItem>
                      <SelectItem key="dmx">DMX</SelectItem>
                    </Select>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Material Only</span>
                    <Switch size="sm" isSelected={logoDetails.materialOnly} onValueChange={(v) => handleUpdate("materialOnly", v)} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Change Decor Color</span>
                    <Switch size="sm" isSelected={logoDetails.changeDecorColor} onValueChange={(v) => handleUpdate("changeDecorColor", v)} />
                  </div>

                  <Select
                    label="LED Density"
                    size="sm"
                    selectedKeys={logoDetails.ledDensity ? [logoDetails.ledDensity] : []}
                    onChange={(e) => handleUpdate("ledDensity", e.target.value)}
                  >
                    <SelectItem key="standard" value="standard">Standard</SelectItem>
                    <SelectItem key="high" value="high">High</SelectItem>
                    <SelectItem key="low" value="low">Low</SelectItem>
                  </Select>
                </div>
              </div>

            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
