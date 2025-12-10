import React from "react";
import { Icon } from "@iconify/react";

export const SummaryRenderer = ({
  formik,
  composition,
  currentLogo,
  hasBolaData,
}) => {
  // Helper function to check if a value is filled
  const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value !== 0;
    return true;
  };

  // Helper function to build image URL for attachments
  const buildImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(imageUrl);
        imageUrl = urlObj.pathname;
      } catch (e) {
        const match = imageUrl.match(/\/api\/[^\s]+/);
        if (match) imageUrl = match[0];
      }
    }
    if (imageUrl.startsWith('\\\\') || imageUrl.startsWith('//')) {
      const filename = imageUrl.split(/[\\/]/).pop();
      if (filename) imageUrl = `/api/files/${filename}`;
    }
    if (imageUrl && !imageUrl.startsWith('/api/') && imageUrl.startsWith('/')) {
      imageUrl = `/api${imageUrl}`;
    } else if (imageUrl && !imageUrl.startsWith('/')) {
      imageUrl = `/api/files/${imageUrl}`;
    }
    return imageUrl;
  };

  // Get dimensions in correct order: HEIGHT, WIDTH, LENGTH, DIAMETER
  const dimensionOrder = ['height', 'width', 'length', 'diameter'];
  const dimensionLabels = {
    height: 'HEIGHT',
    width: 'WIDTH',
    length: 'LENGTH',
    diameter: 'DIAMETER'
  };

  // Get valid componentes and bolas
  const validComponentes = composition.componentes?.filter(c => c.referencia) || [];
  const validBolas = composition.bolas?.filter(bola => hasBolaData(bola)) || [];

  // Get Attachments (use only the first one for the main preview if available)
  const attachments = currentLogo.attachmentFiles || [];
  const mainAttachment = attachments.length > 0 ? attachments[0] : null;

  return (
    <div className="h-full overflow-y-auto p-4 bg-[#141b2d] text-gray-300 font-sans">
      <div className="w-full mx-auto space-y-6">

        {/* TOP ROW: 4 equal columns for efficiency */}
        <div className="grid grid-cols-12 gap-4">

          {/* COLUMN 1: Details (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">

            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Icon icon="lucide:file-text" className="w-4 h-4" />
              <h3 className="text-sm font-bold">Details</h3>
            </div>

            <div className="space-y-3">
              {/* Row 1: Logo Number + Logo Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Logo Number</label>
                  <div className="text-xs font-medium text-white break-words">{formik.values.logoNumber || "---"}</div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Logo Name</label>
                  <div className="text-xs font-medium text-white break-words">{formik.values.logoName || "---"}</div>
                </div>
              </div>

              {/* Row 2: Budget + Requested By */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Budget (EUR)</label>
                  <div className="text-xs font-medium text-white break-words">&euro; {formik.values.budget || "---"}</div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Requested By</label>
                  <div className="text-xs font-medium text-white break-words">{formik.values.requestedBy || "---"}</div>
                </div>
              </div>

              {/* Description - now takes more vertical space */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Description</label>
                <div className="text-[10px] text-gray-300 leading-relaxed bg-[#1f2942] p-2 rounded-lg border border-gray-700/50 min-h-[100px] max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                  {formik.values.description || "No description provided."}
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 2: Fixation & Technical (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Icon icon="lucide:hammer" className="w-4 h-4" />
              <h3 className="text-sm font-bold">Fixation & Technical</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Usage</label>
                <div className="text-xs font-medium text-white flex items-center gap-2">
                  {formik.values.usageOutdoor ? (
                    <><Icon icon="lucide:trees" className="w-3 h-3" /> Outdoor</>
                  ) : (
                    <><Icon icon="lucide:home" className="w-3 h-3" /> Indoor</>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Structure Finish</label>
                {formik.values.lacqueredStructure ? (
                  <div className="text-[10px] font-bold bg-[#1f2942] border border-gray-600 px-2 py-1 rounded inline-block text-white">
                    {formik.values.lacquerColor}
                  </div>
                ) : (
                  <div className="text-[10px] font-medium text-gray-500 italic">Standard</div>
                )}
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Fixation Type</label>
                <div className="text-xs font-medium text-white flex items-center gap-2">
                  <Icon icon="lucide:ban" className="w-3 h-3" />
                  {formik.values.fixationType || "None"}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Technical Constraints</label>
                {formik.values.maxWeightConstraint ? (
                  <div className="text-[10px] font-medium text-white bg-[#1f2942] px-2 py-1 rounded border border-gray-700 inline-flex items-center gap-2">
                    <span>Max Weight</span>
                    <span className="font-bold text-orange-400">{formik.values.maxWeight} kg</span>
                  </div>
                ) : (
                  <span className="text-gray-600 text-[10px]">None</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {formik.values.ballast && (
                  <div className="px-2 py-1 rounded-full bg-gray-700/50 border border-gray-600 text-[10px] font-medium text-white inline-flex items-center gap-1.5">
                    <Icon icon="lucide:check-circle-2" className="w-3 h-3" /> Ballast
                  </div>
                )}
                {formik.values.controlReport && (
                  <div className="px-2 py-1 rounded-full bg-gray-700/50 border border-gray-600 text-[10px] font-medium text-white inline-flex items-center gap-1.5">
                    <Icon icon="lucide:check-circle-2" className="w-3 h-3" /> Control Report
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 3: Attachments (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-pink-500 mb-2">
              <Icon icon="lucide:paperclip" className="w-4 h-4" />
              <h4 className="text-sm font-bold">Attachments</h4>
            </div>

            {mainAttachment ? (
              <div className="relative w-full h-[200px] rounded-xl overflow-hidden border-2 border-dashed border-gray-700 bg-[#1f2942] group">
                {mainAttachment.url || mainAttachment.path ? (
                  <img
                    src={buildImageUrl(mainAttachment.url || mainAttachment.path)}
                    alt="Main Attachment"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 cursor-default">
                    <Icon icon="lucide:image-off" className="w-6 h-6" />
                  </div>
                )}
                {attachments.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md">
                    +{attachments.length - 1} more
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-[200px] rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600 bg-[#1f2942]/30">
                <span className="text-[10px]">No image attached</span>
              </div>
            )}
          </div>

          {/* COLUMN 4: Dimensions (3 cols) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <Icon icon="lucide:ruler" className="w-4 h-4" />
              <h3 className="text-sm font-bold">Dimensions</h3>
            </div>

            <div className="space-y-2">
              {dimensionOrder.map(key => {
                const dimData = formik.values.dimensions?.[key];
                const val = dimData?.value;
                const isImperative = dimData?.imperative;
                const displayVal = (val !== null && val !== undefined && val !== "") ? val : "---";

                return (
                  <div key={key} className="bg-[#1f2942] p-3 rounded-lg border border-gray-700 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dimensionLabels[key]}</span>
                      <div className={`flex items-center gap-1.5 ${isImperative ? 'opacity-100' : 'opacity-40'}`}>
                        {isImperative ? (
                          <Icon icon="lucide:check-circle" className="w-3 h-3 text-pink-500" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-gray-500"></div>
                        )}
                        <span className="text-[10px] text-white">Imperative</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-white">{displayVal}</span>
                      <span className="text-xs text-gray-500">m</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Composition (Components + Balls side by side) - Full Width */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Icon icon="lucide:layers" className="w-4 h-4" />
            <h3 className="text-sm font-bold">Composition</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Components Subsection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:box" className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-gray-300 uppercase">COMPONENTS</span>
                <span className="bg-purple-900/50 text-purple-300 text-[9px] px-1.5 rounded font-bold">{validComponentes.length}</span>
              </div>

              <div className="space-y-2">
                {validComponentes.length > 0 ? (
                  validComponentes.map((comp, idx) => (
                    <div key={idx} className="bg-[#1f2942] p-2 rounded-lg border border-gray-700 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-white uppercase">{comp.referencia}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                        <span className="truncate">{comp.componenteNome || "Component Name"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-gray-500 italic px-2">No components added.</div>
                )}
              </div>
            </div>

            {/* Balls Subsection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:circle-dot" className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-gray-300 uppercase">BALLS</span>
                <span className="bg-purple-900/50 text-purple-300 text-[9px] px-1.5 rounded font-bold">{validBolas.length}</span>
              </div>

              <div className="space-y-2">
                {validBolas.length > 0 ? (
                  validBolas.map((bola, idx) => (
                    <div key={idx} className="bg-[#1f2942] p-2 rounded-lg border border-gray-700 flex flex-col gap-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-bold text-white">
                          {bola.corNome || "Ball"} - {bola.acabamentoNome || "Finish"} - {bola.tamanho ? `${bola.tamanho} cm` : "Size"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                        <span className="text-[10px] text-gray-400">{bola.corNome || "Color"} &bull; {bola.acabamentoNome || "Matte"}</span>
                      </div>
                      {bola.reference && (
                        <div className="mt-0.5">
                          <span className="text-[9px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-mono">Ref: {bola.reference}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-gray-500 italic px-2">No balls added.</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

