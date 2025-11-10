<!-- 926e97cd-248e-41cc-90c2-d47ec8561b8b 5841c41c-b80e-4507-8f1c-0b95431104e3 -->
# Tablet/Desktop Detection Refinement

1. update-breakpoints

- In `instructions-project/client/tailwind.config.js`, add a custom `tablet` screen (e.g. 1366px) and adjust existing classes to use `tablet:` where needed.

2. detection-hook

- Create `instructions-project/client/src/hooks/useResponsiveBreakpoint.js` returning booleans like `isHandheld` that combine `(hover: none)`/`(pointer: coarse)` checks with width.

3. integrate-layout

- In `App.jsx` (and any page-specific overrides), swap current `md:hidden` toggles for the hook’s booleans so tablets in portrait get the bottom nav while desktops retain the sidebar.

### To-dos

- [ ] Revisar `ProductFeed.jsx` para confirmar classes utilitárias e dependências disponíveis
- [ ] Aplicar classes responsivas à sidebar e controlos existentes para ecrãs ≥768px
- [ ] Adicionar bottom nav responsivo e ajustes de espaçamento para ecrãs <768px
- [ ] Testar menus e rolagem em breakpoints desktop/mobile