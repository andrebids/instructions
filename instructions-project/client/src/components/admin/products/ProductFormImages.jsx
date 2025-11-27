/**
 * ProductFormImages Component
 * Image and video upload fields
 */

import React from 'react';
import { Button, Image } from '@heroui/react';
import { Icon } from '@iconify/react';
import { DragAndDropZone } from '../../ui/DragAndDropZone';

export function ProductFormImages({ imageFiles, imagePreviews, onImageChange, onClearPreview }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Day Image */}
      <div>
        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Day Image</label>
        <DragAndDropZone
          accept="image/*"
          onFilesSelected={(files) => onImageChange('dayImage', files[0])}
          className="w-full"
        >
          <div className="flex flex-col gap-2">
            <Button
              variant="bordered"
              className="w-full pointer-events-none"
              startContent={<Icon icon="lucide:sun" />}
            >
              {imageFiles.dayImage ? imageFiles.dayImage.name : 'Select Image'}
            </Button>
            {imagePreviews.dayImage && (
              <div className="mt-2 relative group">
                <Image
                  src={imagePreviews.dayImage}
                  alt="Day preview"
                  className="max-h-32 object-contain rounded-lg"
                  onError={() => onClearPreview('dayImage')}
                />
              </div>
            )}
          </div>
        </DragAndDropZone>
      </div>

      {/* Night Image */}
      <div>
        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Night Image</label>
        <DragAndDropZone
          accept="image/*"
          onFilesSelected={(files) => onImageChange('nightImage', files[0])}
          className="w-full"
        >
          <div className="flex flex-col gap-2">
            <Button
              variant="bordered"
              className="w-full pointer-events-none"
              startContent={<Icon icon="lucide:moon" />}
            >
              {imageFiles.nightImage ? imageFiles.nightImage.name : 'Select Image'}
            </Button>
            {imagePreviews.nightImage && (
              <div className="mt-2 relative group">
                <Image
                  src={imagePreviews.nightImage}
                  alt="Night preview"
                  className="max-h-32 object-contain rounded-lg"
                  onError={() => onClearPreview('nightImage')}
                />
              </div>
            )}
          </div>
        </DragAndDropZone>
      </div>

      {/* Animation Video */}
      <div>
        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Animation Video</label>
        <DragAndDropZone
          accept="video/*"
          onFilesSelected={(files) => onImageChange('animation', files[0])}
          className="w-full"
        >
          <div className="flex flex-col gap-2">
            <Button
              variant="bordered"
              className="w-full pointer-events-none"
              startContent={<Icon icon="lucide:video" />}
            >
              {imageFiles.animation ? imageFiles.animation.name : 'Select Video'}
            </Button>
            {imagePreviews.animation && (
              <div className="mt-2">
                <video
                  src={imagePreviews.animation}
                  controls
                  className="max-h-32 w-full object-contain rounded-lg"
                  onError={() => onClearPreview('animation')}
                />
              </div>
            )}
          </div>
        </DragAndDropZone>
      </div>

      {/* Animation Simulation Video */}
      <div>
        <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Animation Simulation Video</label>
        <DragAndDropZone
          accept="video/*"
          onFilesSelected={(files) => onImageChange('animationSimulation', files[0])}
          className="w-full"
        >
          <div className="flex flex-col gap-2">
            <Button
              variant="bordered"
              className="w-full pointer-events-none"
              startContent={<Icon icon="lucide:play-circle" />}
            >
              {imageFiles.animationSimulation ? imageFiles.animationSimulation.name : 'Select Simulation Video'}
            </Button>
            {imagePreviews.animationSimulation && (
              <div className="mt-2">
                <video
                  src={imagePreviews.animationSimulation}
                  controls
                  className="max-h-32 w-full object-contain rounded-lg"
                  onError={() => onClearPreview('animationSimulation')}
                />
              </div>
            )}
          </div>
        </DragAndDropZone>
      </div>
    </div>
  );
}
