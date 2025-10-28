import React from "react";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../context/ShopContext";
import ProductGrid from "../components/shop/ProductGrid";
import { PageTitle } from "../components/page-title";
import ConfirmModal from "../components/common/ConfirmModal";
import EditNameModal from "../components/common/EditNameModal";

export default function Favorites() {
  const { products, favorites, favoriteFolders, createFavoriteFolder, renameFavoriteFolder, deleteFavoriteFolder } = useShop();
  const [selectedFolderId, setSelectedFolderId] = React.useState('all');
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [renameModal, setRenameModal] = React.useState({ open: false, folder: null });
  const [deleteModal, setDeleteModal] = React.useState({ open: false, folder: null });

  const selectedFolder = React.useMemo(() => (favoriteFolders || []).find(f=>f.id===selectedFolderId) || null, [favoriteFolders, selectedFolderId]);
  const productIds = React.useMemo(() => {
    if (selectedFolderId === 'all') return favorites || [];
    return selectedFolder?.productIds || [];
  }, [favorites, selectedFolderId, selectedFolder]);

  const items = React.useMemo(() => products.filter(p => productIds.includes(p.id)), [products, productIds]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = createFavoriteFolder(name);
    setSelectedFolderId(id);
    setCreating(false);
    setNewName('');
  };

  return (
    <>
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Favorites" userName="Christopher" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground mt-2">Favorite folders</h1>
        <div className="flex items-center gap-2">
          {creating ? (
            <div className="flex items-center gap-2">
              <Input size="sm" placeholder="Folder name" value={newName} onValueChange={setNewName} autoFocus />
              <Button size="sm" color="primary" onPress={handleCreate}>Create</Button>
              <Button size="sm" variant="light" onPress={() => { setCreating(false); setNewName(''); }}>Cancel</Button>
            </div>
          ) : (
            <Button radius="full" variant="bordered" startContent={<Icon icon="lucide:folder-plus" />} onPress={() => setCreating(true)}>New folder</Button>
          )}
        </div>
      </div>

      <div className="md:flex md:items-start md:gap-6">
        {/* Left: folders list */}
        <aside className="md:w-64 w-full md:flex-shrink-0 border border-divider rounded-xl p-3 space-y-2">
          <button
            type="button"
            onClick={() => setSelectedFolderId('all')}
            className={`w-full text-left px-3 py-2 rounded-md ${selectedFolderId==='all' ? 'bg-content2' : 'hover:bg-content2'}`}
          >
            <span>All favorites</span>
            <span className="ml-2 text-default-500">({favorites?.length || 0})</span>
          </button>
          {(favoriteFolders || []).map((f)=> (
            <div key={f.id} className={`flex items-center gap-2 px-2 py-1 rounded-md ${selectedFolderId===f.id ? 'bg-content2' : 'hover:bg-content2'}`}>
              <button type="button" className="flex-1 text-left" onClick={()=> setSelectedFolderId(f.id)}>
                {f.name} <span className="text-default-500">({f.productIds?.length || 0})</span>
              </button>
              <button className="text-default-400 hover:text-default-600" title="Rename" onClick={()=>{
                setRenameModal({ open: true, folder: f });
              }}>
                <Icon icon="lucide:edit-2" />
              </button>
              <button className="text-default-400 hover:text-danger" title="Delete" onClick={()=>{ setDeleteModal({ open: true, folder: f }); }}>
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          ))}
        </aside>

        {/* Right: products in folder */}
        <div className="flex-1 w-full">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-default-500">{selectedFolderId==='all' ? 'All favorite products' : `Folder: ${selectedFolder?.name || ''}`}</div>
          </div>
          <ProductGrid products={items} onOrder={()=>{}} cols={4} glass={false} />
        </div>
      </div>
    </div>

    <EditNameModal
      isOpen={renameModal.open}
      onOpenChange={(v)=> setRenameModal({ open: v, folder: renameModal.folder })}
      title="Rename folder"
      label="Folder name"
      initialValue={renameModal.folder?.name || ''}
      onSubmit={(val)=> { if (val && val.trim()) renameFavoriteFolder(renameModal.folder.id, val.trim()); }}
    />
    <ConfirmModal
      isOpen={deleteModal.open}
      onOpenChange={(v)=> setDeleteModal({ open: v, folder: deleteModal.folder })}
      title="Delete folder"
      description={<span>Are you sure you want to delete <span className="font-medium">{deleteModal.folder?.name}</span>? Items remain in All favorites.</span>}
      confirmText="Delete"
      confirmColor="danger"
      onConfirm={()=> { if (deleteModal.folder) { deleteFavoriteFolder(deleteModal.folder.id); if (selectedFolderId===deleteModal.folder.id) setSelectedFolderId('all'); } }}
    />
    </>
  );
}


