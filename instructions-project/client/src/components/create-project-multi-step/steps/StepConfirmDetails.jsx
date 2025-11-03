import React from "react";
import { Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import { getLocalTimeZone } from "@internationalized/date";

export function StepConfirmDetails({ formData, error }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Confirm Details</h2>
      <p className="text-sm sm:text-base text-default-500">
        Please review the information before creating the project.
      </p>
      
      <div className="space-y-6">
        {/* Project Details Card */}
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon icon="lucide:folder" className="text-primary" />
            Project Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-default-500">Name:</span>
              <p className="font-medium">{formData.name || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Type:</span>
              <p className="font-medium capitalize">
                {formData.projectType 
                  ? formData.projectType 
                  : "Not specified (will use 'decor' as default)"}
              </p>
            </div>
            {formData.projectType === "simu" && (
              <div className="col-span-2">
                <span className="text-default-500">Simu mode:</span>
                <p className="font-medium">
                  {formData.simuWorkflow === "ai"
                    ? "AI Assisted Designer"
                    : formData.simuWorkflow === "human"
                    ? "Send to Human Designer"
                    : "—"}
                </p>
              </div>
            )}
            <div>
              <span className="text-default-500">Client:</span>
              <p className="font-medium">{formData.clientName || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Status:</span>
              <p className="font-medium">Created</p>
            </div>
            <div>
              <span className="text-default-500">Client Email:</span>
              <p className="font-medium">{formData.clientEmail || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Client Phone:</span>
              <p className="font-medium">{formData.clientPhone || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">End Date:</span>
              <p className="font-medium">
                {formData.endDate 
                  ? formData.endDate.toDate(getLocalTimeZone()).toLocaleDateString() 
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-default-500">Budget:</span>
              <p className="font-medium">
                {formData.budget 
                  ? `€${parseFloat(formData.budget).toLocaleString()}` 
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
        
        {/* AI Designer Card - apenas se for AI workflow */}
        {formData.projectType === "simu" && formData.simuWorkflow === "ai" && (
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Icon icon="lucide:sparkles" className="text-primary" />
              AI Generated Decorations
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-default-500">Decorations Generated:</span>
                <p className="font-medium">
                  {formData.canvasDecorations?.length || 0} decorations
                </p>
              </div>
              {formData.canvasDecorations && formData.canvasDecorations.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {formData.canvasDecorations.map((decoration, index) => (
                    <div
                      key={decoration.id || index}
                      className="flex items-center gap-2 p-2 bg-default-50 rounded"
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: decoration.color }}
                      />
                      <span className="text-xs font-medium capitalize">
                        {decoration.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
          <Icon icon="lucide:alert-circle" className="inline mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}

