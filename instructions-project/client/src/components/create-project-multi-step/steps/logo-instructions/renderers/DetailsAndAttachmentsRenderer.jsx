import React from "react";
import { Input, Textarea, Switch, Button, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AutocompleteWithMarquee } from "../components/AutocompleteWithMarquee";
import { AttachmentItem } from "../components/AttachmentItem";

export const DetailsAndAttachmentsRenderer = ({
  formik,
  currentLogo,
  isCompact,
  handleModificationToggle,
  productSearchValue,
  setProductSearchValue,
  productSearchResults,
  isSearchingProducts,
  handleProductSelection,
  handleClearProductSelection,
  relatedProducts,
  selectedRelatedProductId,
  handleSelectRelatedProduct,
  handleFileUpload,
  handleRemoveAttachment,
  handleEditAIGenerated,
  setIsChatOpen,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
      {/* Details Section */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col overflow-hidden`}>
        <div className={`flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 flex-shrink-0`}>
          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icon icon="lucide:file-signature" className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold">Details</h2>
        </div>

        <div className={`flex-1 overflow-y-auto space-y-1.5`}>
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Logo Name</label>
            <Input
              placeholder="Enter logo name"
              variant="bordered"
              size="sm"
              isRequired
              aria-label="Logo Name"
              value={formik.values.logoName}
              onValueChange={(v) => formik.updateField("logoName", v)}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.logoName && !!formik.errors.logoName}
              errorMessage={formik.touched.logoName && formik.errors.logoName}
              classNames={{ input: "text-xs", inputWrapper: "h-8" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">Description</label>
            <Textarea
              placeholder="Enter description..."
              minRows={2}
              variant="bordered"
              size="sm"
              isRequired
              aria-label="Description"
              value={formik.values.description}
              onValueChange={(v) => formik.updateField("description", v)}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.description && !!formik.errors.description}
              errorMessage={formik.touched.description && formik.errors.description}
              classNames={{ input: "text-xs" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-0.5">
              Budget (EUR)
            </label>
            <Input
              placeholder="0,00"
              variant="bordered"
              size="sm"
              type="text"
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">&euro;</span>}
              value={formik.values.budget || ""}
              onValueChange={(v) => {
                let cleaned = v.replace(/[^\d,]/g, '');
                cleaned = cleaned.replace(/\./g, ',');
                const parts = cleaned.split(',');
                if (parts.length > 2) {
                  cleaned = parts[0] + ',' + parts.slice(1).join('');
                }
                if (parts.length === 2 && parts[1].length > 2) {
                  cleaned = parts[0] + ',' + parts[1].substring(0, 2);
                }
                if (parts[0] && parts[0].length > 3) {
                  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                  cleaned = parts.length > 1 ? integerPart + ',' + parts[1] : integerPart;
                }
                formik.updateField("budget", cleaned);
              }}
              onBlur={(e) => {
                const value = formik.values.budget || "";
                if (value) {
                  let cleaned = value.replace(/\s/g, '');
                  const parts = cleaned.split(',');
                  if (parts.length === 1 && parts[0]) {
                    cleaned = parts[0] + ',00';
                  } else if (parts.length === 2 && parts[1].length === 1) {
                    cleaned = parts[0] + ',' + parts[1] + '0';
                  } else if (parts.length === 2 && parts[1].length === 0) {
                    cleaned = parts[0] + ',00';
                  }
                  const finalParts = cleaned.split(',');
                  if (finalParts[0] && finalParts[0].length > 3) {
                    const integerPart = finalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                    cleaned = finalParts.length > 1 ? integerPart + ',' + finalParts[1] : integerPart;
                  }
                  formik.updateField("budget", cleaned);
                }
                formik.handleBlur(e);
              }}
              isInvalid={formik.touched.budget && !!formik.errors.budget}
              errorMessage={formik.touched.budget && formik.errors.budget}
              classNames={{ input: "text-xs", inputWrapper: "h-8" }}
            />
          </div>

          {/* Logo Modification Section */}
          <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Switch
                size="sm"
                isSelected={currentLogo.isModification || false}
                onValueChange={handleModificationToggle}
                classNames={{
                  base: "max-w-fit",
                  wrapper: "group-data-[selected=true]:bg-primary-500",
                  label: "text-xs font-semibold text-gray-700 dark:text-gray-200"
                }}
              >
                <span className="text-xs">Is this logo a modification of an existing product?</span>
              </Switch>
            </div>

            {currentLogo.isModification && (
              <div className="space-y-3 mt-3">
                <div>
                  <label className="text-xs sm:text-sm md:text-base lg:text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-1">Search Product from Stock Catalogue</label>
                  <AutocompleteWithMarquee
                    aria-label="Search Product from Stock Catalogue"
                    placeholder="Search products..."
                    size="sm"
                    variant="bordered"
                    selectedKey={currentLogo.baseProductId || null}
                    inputValue={productSearchValue !== "" ? productSearchValue : (currentLogo.baseProduct ? currentLogo.baseProduct.name : "")}
                    onSelectionChange={(key) => {
                      if (key) {
                        handleProductSelection(key);
                      } else {
                        handleClearProductSelection();
                      }
                    }}
                    onInputChange={(value) => {
                      setProductSearchValue(value);
                      if (value === "" && currentLogo.baseProductId) {
                        handleClearProductSelection();
                      }
                    }}
                    defaultItems={productSearchResults}
                    menuTrigger="input"
                    isLoading={isSearchingProducts}
                    startContent={<Icon icon="lucide:search" className="w-3 h-3 text-gray-500" />}
                    endContent={
                      currentLogo.baseProductId && !productSearchValue ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearProductSelection();
                          }}
                          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Clear selection"
                        >
                          <Icon icon="lucide:x" className="w-3 h-3 text-gray-500" />
                        </button>
                      ) : null
                    }
                    allowsCustomValue={false}
                    classNames={{
                      listboxWrapper: "max-h-[300px]",
                      trigger: "text-xs h-8",
                      input: "text-xs"
                    }}
                  >
                    {(product) => (
                      <AutocompleteItem
                        key={product.id}
                        textValue={`${product.name} ${product.type || ""}`}
                      >
                        <div className="flex flex-col">
                          <div className="text-sm font-medium">{product.name}</div>
                          {product.type && (
                            <div className="text-xs text-gray-500">{product.type}</div>
                          )}
                        </div>
                      </AutocompleteItem>
                    )}
                  </AutocompleteWithMarquee>
                </div>

                {currentLogo.baseProduct && relatedProducts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon icon="lucide:package" className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <label className="text-xs sm:text-sm md:text-base lg:text-sm font-semibold text-gray-700 dark:text-gray-200">Related Products</label>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {relatedProducts.map((product, idx) => {
                          const isSelected = selectedRelatedProductId === product.id;
                          return (
                            <div
                              key={product.id || idx}
                              onClick={() => handleSelectRelatedProduct(product)}
                              className={`
                                p-2 rounded-lg border space-y-1.5 cursor-pointer transition-all
                                ${isSelected
                                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400 shadow-md'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                                }
                              `}
                            >
                              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{product.name || product}</div>
                              {(() => {
                                const height = product.height || product.specs?.dimensions?.heightM || product.specs?.height;
                                const width = product.width || product.specs?.dimensions?.widthM || product.specs?.width;
                                const depth = product.depth || product.specs?.dimensions?.depthM || product.specs?.depth;
                                const diameter = product.diameter || product.specs?.dimensions?.diameterM || product.specs?.diameter;

                                if (height || width || depth || diameter) {
                                  return (
                                    <div className="space-y-0.5 text-xs">
                                      {height && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">H:</span>
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{Number(height).toFixed(2)}m</span>
                                        </div>
                                      )}
                                      {width && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">W:</span>
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{Number(width).toFixed(2)}m</span>
                                        </div>
                                      )}
                                      {depth && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">D:</span>
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{Number(depth).toFixed(2)}m</span>
                                        </div>
                                      )}
                                      {diameter && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Ø:</span>
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{Number(diameter).toFixed(2)}m</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {isSelected && (
                                <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 text-xs">
                                  <Icon icon="lucide:check-circle" className="w-3 h-3" />
                                  <span className="font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl ${isCompact ? 'p-2.5' : 'p-3'} shadow-xl border border-white/10 flex flex-col overflow-hidden`}>
        <div className={`flex items-center justify-between mb-2 flex-shrink-0`}>
          <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
            <div className="p-1 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Icon icon="lucide:paperclip" className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold">Attachments</h2>
          </div>
          {!isCompact && (
            <Button
              color="primary"
              variant="solid"
              size="sm"
              className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-medium text-xs shadow-lg h-7"
              startContent={<Icon icon="lucide:sparkles" className="w-3 h-3" />}
              onPress={() => setIsChatOpen(true)}
            >
              AI Assistant
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50/50 dark:bg-gray-700/50 hover:border-pink-300 dark:hover:border-pink-700 transition-colors">
          {(() => {
            const attachments = currentLogo.attachmentFiles || [];
            return attachments.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {attachments.map((file, index) => (
                    <AttachmentItem
                      key={`${file.name}-${file.filename || ''}-${index}-${file.url || file.path || ''}`}
                      file={file}
                      index={index}
                      onRemove={handleRemoveAttachment}
                      onEdit={file.isAIGenerated ? handleEditAIGenerated : null}
                    />
                  ))}
                </div>

                <input
                  type="file"
                  id="file-upload-more"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                />
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    className="font-medium px-3 py-1"
                    startContent={<Icon icon="lucide:upload" className="w-4 h-4" />}
                    onPress={() => document.getElementById('file-upload-more').click()}
                  >
                    Add More Files
                  </Button>
                </div>
              </div>
            ) : null;
          })()}
          {(!currentLogo.attachmentFiles || currentLogo.attachmentFiles.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="p-1.5 bg-pink-50 dark:bg-pink-900/20 rounded-full mb-1.5">
                <Icon icon="lucide:cloud-upload" className="w-5 h-5 text-pink-500" />
              </div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-0.5">Upload Files</h4>
              <p className="text-xs text-gray-500 mb-2">Drag & drop or click to upload</p>
              <input
                type="file"
                id="file-upload"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              />
              <Button
                size="sm"
                color="primary"
                variant="flat"
                className="font-medium px-6"
                onPress={() => document.getElementById('file-upload').click()}
              >
                Select Files
              </Button>
              <p className="text-xs text-gray-400 mt-2">Supported: All image formats (PNG, JPG, HEIC, WebP, etc.)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

