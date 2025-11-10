import React from "react";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import ProductGrid from "../components/shop/ProductGrid";
import { PageTitle } from "../components/page-title";
import ConfirmModal from "../components/common/ConfirmModal";
import EditNameModal from "../components/common/EditNameModal";
import { useUser } from "../context/UserContext";

export default function Favorites() {
  const navigate = useNavigate();
  const { userName } = useUser();
  const { products, favorites, favoriteFolders, createFavoriteFolder, renameFavoriteFolder, deleteFavoriteFolder } = useShop();
  const [selectedFolderId, setSelectedFolderId] = React.useState('all');
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [suggestSeed, setSuggestSeed] = React.useState(0);
  const [renameModal, setRenameModal] = React.useState({ open: false, folder: null });
  const [deleteModal, setDeleteModal] = React.useState({ open: false, folder: null });

  const selectedFolder = React.useMemo(() => (favoriteFolders || []).find(f=>f.id===selectedFolderId) || null, [favoriteFolders, selectedFolderId]);
  const productIds = React.useMemo(() => {
    if (selectedFolderId === 'all') return favorites || [];
    return selectedFolder?.productIds || [];
  }, [favorites, selectedFolderId, selectedFolder]);

  const items = React.useMemo(() => products.filter(p => productIds.includes(p.id)), [products, productIds]);
  const filteredItems = React.useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(p => String(p.name || '').toLowerCase().includes(q));
  }, [items, query]);

  // Suggestions: 3 random when empty, otherwise top matches (up to 5)
  const suggestions = React.useMemo(() => {
    if (!items.length) return [];
    if (!query) {
      const n = Math.min(3, items.length);
      const scored = items.map((p, idx) => ({ idx, score: Math.abs(Math.sin(suggestSeed + idx) * 10000) }));
      scored.sort((a, b) => a.score - b.score);
      return scored.slice(0, n).map((s) => items[s.idx]);
    }
    const q = query.toLowerCase();
    return items.filter(p => String(p.name || '').toLowerCase().includes(q)).slice(0, 5);
  }, [items, query, suggestSeed]);

  React.useEffect(() => {
    if (searchFocused) setSuggestSeed(Date.now());
  }, [searchFocused]);

  const highlight = (name) => {
    const q = query.trim();
    if (!q) return name;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = name.split(new RegExp(`(${escaped})`, 'ig'));
    return (
      <>
        {parts.map((part, idx) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <span key={idx} className="font-semibold text-primary">{part}</span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    );
  };

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
    <div className="flex-1 min-h-0 overflow-auto p-6 pb-24 md:pb-6">
      <PageTitle title="Favorites" userName={userName} lead={`Your saved products, ${userName}`} />
      <div className="mb-4">
        <Button
          variant="light"
          radius="full"
          onPress={() => navigate(-1)}
          aria-label="Go back"
          startContent={<Icon icon="lucide:arrow-left" className="text-xl" />}
        >
          Back
        </Button>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold text-foreground mt-2">Favorite folders</h2>
        <div className="flex items-center gap-2">
          {creating ? (
            <div className="flex items-center gap-2">
              <Input size="sm" placeholder="Folder name" aria-label="Folder name" value={newName} onValueChange={setNewName} autoFocus />
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
              <button className="text-default-400 hover:text-default-600" title="Rename" aria-label="Rename folder" onClick={()=>{
                setRenameModal({ open: true, folder: f });
              }}>
                <Icon icon="lucide:edit-2" />
              </button>
              <button className="text-default-400 hover:text-danger" title="Delete" aria-label="Delete folder" onClick={()=>{ setDeleteModal({ open: true, folder: f }); }}>
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          ))}
        </aside>

        {/* Right: products in folder */}
        <div className="flex-1 w-full">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-default-500">{selectedFolderId==='all' ? 'All favorite products' : `Folder: ${selectedFolder?.name || ''}`}</div>
            <div className={`relative transition-all duration-200 ${searchFocused ? 'flex-1 max-w-md' : 'w-48 md:w-60'}`}>
              <Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search favorites..."
                aria-label="Search favorites"
                isClearable
                startContent={<Icon icon="lucide:search" className="text-default-400" />}
                size="sm"
                classNames={{ inputWrapper: "bg-default-50" }}
                onFocus={()=> setSearchFocused(true)}
                onBlur={()=> setSearchFocused(false)}
              />
              {searchFocused && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 rounded-md border border-divider bg-content1 shadow-medium z-20 overflow-hidden">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-content2 text-left"
                      onMouseDown={(e)=> { e.preventDefault(); setQuery(p.name); }}
                    >
                      <img
                        src={p.images?.night || p.images?.day}
                        alt={p.name}
                        className="w-8 h-8 object-contain rounded"
                        onError={(e)=>{ e.currentTarget.style.visibility = 'hidden'; }}
                      />
                      <span className="text-sm text-foreground truncate">{highlight(p.name)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ProductGrid products={filteredItems} onOrder={()=>{}} cols={4} glass={false} cardProps={{ removable: true }} />
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
      description={<span>Are you sure you want to delete <span className="font-medium">{deleteModal.folder?.name}</span>?<br />Items remain in All favorites.</span>}
      confirmText="Delete"
      confirmColor="danger"
      onConfirm={()=> { if (deleteModal.folder) { deleteFavoriteFolder(deleteModal.folder.id); if (selectedFolderId===deleteModal.folder.id) setSelectedFolderId('all'); } }}
    />
    </>
  );
}


