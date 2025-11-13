import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { Icon } from '@iconify/react';
import { SimpleEditor } from '../../project-notes/SimpleEditor';

export function StepNotes({ formData, onInputChange }) {
  // Usar projectId temporário ou ID normal
  const projectId = formData.tempProjectId || formData.id;

  // If we don't have projectId yet, show message
  if (!projectId) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center py-12">
          <Icon icon="lucide:file-text" className="text-6xl text-default-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Create project first</h2>
          <p className="text-default-500">
            Complete the project details to start adding notes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Project Notes</h1>
        <p className="text-default-500 text-sm sm:text-base">
          Add notes and observations about this project. Changes are saved automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2">
            <h3 className="text-base sm:text-lg font-semibold">Notes Editor</h3>
          </div>
        </CardHeader>
        <CardBody className="p-2 sm:p-6">
          <SimpleEditor />
        </CardBody>
      </Card>

      <div className="mt-4 p-3 sm:p-4 bg-content1 rounded-lg border border-divider">
        <div className="flex items-start gap-2 sm:gap-3">
          <Icon icon="lucide:info" className="text-primary text-lg sm:text-xl mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-default-600">
            <p className="font-medium mb-1">Tip:</p>
            <p>
              You can proceed to the next step at any time. Notes are saved automatically 
              and can be edited later on the project page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

