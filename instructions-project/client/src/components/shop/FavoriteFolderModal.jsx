import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, RadioGroup, Radio } from "@heroui/react";
import { useShop } from "../../context/ShopContext";

export default function FavoriteFolderModal({ isOpen, onOpenChange, productId }) {
  const { favorites, favoriteFolders, toggleFavorite, toggleProductInFolder, createFavoriteFolder } = useShop();
  const [selectedFolderId, setSelectedFolderId] = React.useState("none");
  const [creating, setCreating] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) return;
    setSelectedFolderId("none");
    setCreating(false);
    setNewFolderName("");
  }, [isOpen]);

  const handleConfirm = () => {
    // Ensure item is in favorites
    if (!favorites?.includes(productId)) toggleFavorite(productId);
    // Add to selected folder if any
    if (selectedFolderId && selectedFolderId !== "none") {
      toggleProductInFolder(selectedFolderId, productId);
    }
    onOpenChange?.(false);
  };

  const handleCreate = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const id = createFavoriteFolder(name);
    setSelectedFolderId(id);
    setCreating(false);
    setNewFolderName("");
  };

  const isFav = Array.isArray(favorites) && favorites.includes(productId);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" hideCloseButton>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{isFav ? 'Update favorites' : 'Add to favorites'}</ModalHeader>
            <ModalBody>
              <div className="space-y-3">
                <RadioGroup label="Choose a folder (optional)" value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <Radio value="none">All favorites</Radio>
                  {(favoriteFolders || []).map((f) => (
                    <Radio key={f.id} value={f.id}>{f.name}</Radio>
                  ))}
                </RadioGroup>

                {creating ? (
                  <div className="flex items-end gap-2">
                    <Input label="New folder name" value={newFolderName} onValueChange={setNewFolderName} size="sm" className="flex-1" autoFocus />
                    <Button size="sm" color="primary" onPress={handleCreate}>Create</Button>
                    <Button size="sm" variant="light" onPress={() => { setCreating(false); setNewFolderName(""); }}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="flat" onPress={() => setCreating(true)}>New folder…</Button>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <div className="w-full flex justify-end gap-2">
                <Button 
                  variant="flat" 
                  onPress={close}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                >
                  Close
                </Button>
                {isFav && (
                  <Button color="danger" variant="flat" onPress={() => { toggleFavorite(productId); onOpenChange?.(false); }}>Remove</Button>
                )}
                <Button color="primary" onPress={handleConfirm}>Save</Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


