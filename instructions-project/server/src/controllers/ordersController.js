import { Order, OrderItem, Product, Project, Decoration } from '../models/index.js';
import sequelize from '../config/database.js';

// Obter todas as orders de um projeto
export const getOrdersByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const orders = await Order.findAll({
      where: { projectId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl'],
              required: false,
            },
            {
              model: Decoration,
              as: 'decoration',
              attributes: ['id', 'name', 'price', 'thumbnailUrl', 'category'],
              required: false,
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    console.error('Erro ao buscar orders:', error);
    res.status(500).json({ error: 'Erro ao buscar orders', details: error.message });
  }
};

// Obter uma order específica
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl'],
            },
          ],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'budget', 'clientName'],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar order:', error);
    res.status(500).json({ error: 'Erro ao buscar order', details: error.message });
  }
};

// Criar ou obter order draft de um projeto
export const getOrCreateDraftOrder = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verificar se o projeto existe
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Procurar order draft existente
    let order = await Order.findOne({
      where: { projectId, status: 'draft' },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl', 'stock'],
              required: false,
            },
            {
              model: Decoration,
              as: 'decoration',
              attributes: ['id', 'name', 'price', 'thumbnailUrl', 'category'],
              required: false,
            },
          ],
        },
      ],
    });

    // Se não existir, criar nova
    if (!order) {
      order = await Order.create({
        projectId,
        status: 'draft',
        total: 0,
      });
      order = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl', 'stock'],
                required: false,
              },
              {
                model: Decoration,
                as: 'decoration',
                attributes: ['id', 'name', 'price', 'thumbnailUrl', 'category'],
                required: false,
              },
            ],
          },
        ],
      });
    }

    // Debug: Verificar se GX349L está na order
    if (order && order.items) {
      const gx349lItem = order.items.find(item => 
        item.name === 'GX349L' || 
        item.product?.name === 'GX349L' || 
        item.product?.id === 'prd-005' ||
        item.productId === 'prd-005'
      );
      if (gx349lItem) {
        console.log('✅ [getOrCreateDraftOrder] GX349L encontrado:', {
          itemId: gx349lItem.id,
          name: gx349lItem.name,
          productId: gx349lItem.productId,
          productName: gx349lItem.product?.name,
          itemType: gx349lItem.itemType
        });
      } else {
        console.log('❌ [getOrCreateDraftOrder] GX349L NÃO encontrado. Total items:', order.items.length);
        console.log('Items disponíveis:', order.items.map(item => ({
          id: item.id,
          name: item.name,
          productId: item.productId,
          productName: item.product?.name,
          itemType: item.itemType
        })));
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Erro ao obter/criar order draft:', error);
    res.status(500).json({ error: 'Erro ao obter/criar order', details: error.message });
  }
};

// Criar nova order
export const createOrder = async (req, res) => {
  try {
    const { projectId, notes } = req.body;

    // Verificar se o projeto existe
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const order = await Order.create({
      projectId,
      status: 'draft',
      notes,
      total: 0,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar order:', error);
    res.status(500).json({ error: 'Erro ao criar order', details: error.message });
  }
};

// Atualizar order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    // Atualizar campos permitidos
    if (notes !== undefined) order.notes = notes;
    if (status !== undefined) order.status = status;

    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Erro ao atualizar order:', error);
    res.status(500).json({ error: 'Erro ao atualizar order', details: error.message });
  }
};

// Alterar status da order
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'to_order', 'ordered', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    order.status = status;

    // Atualizar datas conforme o status
    if (status === 'ordered' && !order.orderedAt) {
      order.orderedAt = new Date();
    }
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    // Retornar order com items
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl'],
            },
          ],
        },
      ],
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status', details: error.message });
  }
};

// Eliminar order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    // Só permite eliminar orders em draft
    if (order.status !== 'draft') {
      return res.status(400).json({ error: 'Apenas orders em rascunho podem ser eliminadas' });
    }

    await order.destroy();
    res.json({ message: 'Order eliminada com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar order:', error);
    res.status(500).json({ error: 'Erro ao eliminar order', details: error.message });
  }
};

// Adicionar item à order
export const addOrderItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params; // orderId
    const { productId, quantity = 1, variant } = req.body;

    const order = await Order.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    // Verificar se a order está em draft
    if (order.status !== 'draft') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Não é possível adicionar itens a uma order que não está em rascunho' });
    }

    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Debug: Log para GX349L
    if (product.name === 'GX349L' || productId === 'prd-005') {
      console.log('🔍 [addOrderItem] Adicionando GX349L:', {
        productId,
        productName: product.name,
        quantity,
        orderId: id
      });
    }

    // Verificar se já existe item com mesmo produto e variante
    const variantKey = JSON.stringify(variant || {});
    const existingItem = await OrderItem.findOne({
      where: {
        orderId: id,
        productId,
      },
      transaction,
    });

    let item;
    if (existingItem && JSON.stringify(existingItem.variant || {}) === variantKey) {
      // Atualizar quantidade
      existingItem.quantity += quantity;
      await existingItem.save({ transaction });
      item = existingItem;
    } else {
      // Criar novo item
      // Obter URL da imagem do produto (tentar várias fontes)
      let productImageUrl = product.thumbnailUrl || product.imagesDayUrl || null;
      
      // Se o produto tem availableColors e há uma cor selecionada, tentar usar a imagem da cor
      if (!productImageUrl && variant?.color && product.availableColors?.[variant.color]) {
        productImageUrl = product.availableColors[variant.color];
      }
      
      // Debug: Log para GX349L
      if (product.name === 'GX349L' || productId === 'prd-005') {
        console.log('🔍 [addOrderItem] Criando item GX349L com imagem:', {
          productId,
          productName: product.name,
          thumbnailUrl: product.thumbnailUrl,
          imagesDayUrl: product.imagesDayUrl,
          productImageUrl,
          availableColors: product.availableColors
        });
      }
      
      item = await OrderItem.create({
        orderId: id,
        productId,
        itemType: 'product',
        name: product.name,
        quantity,
        unitPrice: product.price,
        variant: variant || {},
        imageUrl: productImageUrl,
      }, { transaction });
    }

    // Recalcular total da order
    const allItems = await OrderItem.findAll({
      where: { orderId: id },
      transaction,
    });

    const newTotal = allItems.reduce((sum, i) => {
      return sum + (parseFloat(i.unitPrice) * i.quantity);
    }, 0);

    order.total = newTotal;
    await order.save({ transaction });

    await transaction.commit();

    // Retornar item com produto
    const itemWithProduct = await OrderItem.findByPk(item.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl', 'stock'],
        },
      ],
    });

    res.status(201).json({ item: itemWithProduct, orderTotal: newTotal });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao adicionar item:', error);
    res.status(500).json({ error: 'Erro ao adicionar item', details: error.message });
  }
};

// Atualizar item da order
export const updateOrderItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id, itemId } = req.params;
    const { quantity } = req.body;

    const order = await Order.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    if (order.status !== 'draft') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Não é possível editar itens de uma order que não está em rascunho' });
    }

    const item = await OrderItem.findOne({
      where: { id: itemId, orderId: id },
      transaction,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    if (quantity <= 0) {
      // Remover item se quantidade for 0 ou negativa
      await item.destroy({ transaction });
    } else {
      item.quantity = quantity;
      await item.save({ transaction });
    }

    // Recalcular total
    const allItems = await OrderItem.findAll({
      where: { orderId: id },
      transaction,
    });

    const newTotal = allItems.reduce((sum, i) => {
      return sum + (parseFloat(i.unitPrice) * i.quantity);
    }, 0);

    order.total = newTotal;
    await order.save({ transaction });

    await transaction.commit();

    res.json({ item: quantity > 0 ? item : null, orderTotal: newTotal });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ error: 'Erro ao atualizar item', details: error.message });
  }
};

// Remover item da order
export const removeOrderItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id, itemId } = req.params;

    const order = await Order.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    if (order.status !== 'draft') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Não é possível remover itens de uma order que não está em rascunho' });
    }

    const item = await OrderItem.findOne({
      where: { id: itemId, orderId: id },
      transaction,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    await item.destroy({ transaction });

    // Recalcular total
    const allItems = await OrderItem.findAll({
      where: { orderId: id },
      transaction,
    });

    const newTotal = allItems.reduce((sum, i) => {
      return sum + (parseFloat(i.unitPrice) * i.quantity);
    }, 0);

    order.total = newTotal;
    await order.save({ transaction });

    await transaction.commit();

    res.json({ message: 'Item removido', orderTotal: newTotal });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao remover item:', error);
    res.status(500).json({ error: 'Erro ao remover item', details: error.message });
  }
};

// Sincronizar decorações do AI Designer com a order
export const syncDecorations = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { projectId } = req.params;
    const { decorations, sourceImageId } = req.body;
    // decorations: [{ decorationId, name, quantity, imageUrl, price }]

    // Validar que decorations é um array
    if (!Array.isArray(decorations)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'decorations deve ser um array' });
    }

    // Verificar se o projeto existe
    const project = await Project.findByPk(projectId, { transaction });
    if (!project) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Obter ou criar order draft
    let order = await Order.findOne({
      where: { projectId, status: 'draft' },
      transaction,
    });

    if (!order) {
      order = await Order.create({
        projectId,
        status: 'draft',
        total: 0,
      }, { transaction });
    }

    // Se o array estiver vazio, apenas remover decorações existentes e retornar
    if (decorations.length === 0) {
      // Remover todas as decorações da order (apenas decorações, não produtos!)
      await OrderItem.destroy({
        where: {
          orderId: order.id,
          itemType: 'decoration',
        },
        transaction,
      });

      // Recalcular total
      const allItems = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction,
      });

      const newTotal = allItems.reduce((sum, i) => {
        const price = parseFloat(i.unitPrice) || 0;
        return sum + (price * i.quantity);
      }, 0);

      order.total = newTotal;
      await order.save({ transaction });
      await transaction.commit();

      const updatedOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl'],
                required: false,
              },
              {
                model: Decoration,
                as: 'decoration',
                attributes: ['id', 'name', 'price', 'thumbnailUrl', 'category'],
                required: false,
              },
            ],
          },
        ],
      });

      return res.json({
        order: updatedOrder,
        syncedDecorations: 0,
        totalDecorations: 0,
      });
    }

    // Contar items antes da remoção (para debug)
    const itemsBefore = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction,
    });
    const productsBefore = itemsBefore.filter(item => item.itemType === 'product' || !item.itemType);
    const decorationsBefore = itemsBefore.filter(item => item.itemType === 'decoration');
    
    console.log('🔄 [syncDecorations] Antes da sincronização:', {
      totalItems: itemsBefore.length,
      products: productsBefore.length,
      decorations: decorationsBefore.length,
      productNames: productsBefore.map(p => p.name)
    });

    // Remover items de decoração existentes desta source image (para fazer sync completo)
    // IMPORTANTE: Remover APENAS decorações, nunca produtos!
    // Usar condição explícita para garantir que apenas decorações são removidas
    if (sourceImageId) {
      const deleted = await OrderItem.destroy({
        where: {
          orderId: order.id,
          itemType: 'decoration', // Apenas decorações
          sourceImageId,
        },
        transaction,
      });
      console.log(`🗑️ [syncDecorations] Removidas ${deleted} decorações da sourceImage ${sourceImageId}`);
    } else {
      // Se não há sourceImageId, remover todas as decorações da order
      // IMPORTANTE: itemType: 'decoration' garante que produtos não são removidos
      const deleted = await OrderItem.destroy({
        where: {
          orderId: order.id,
          itemType: 'decoration', // Apenas decorações
        },
        transaction,
      });
      console.log(`🗑️ [syncDecorations] Removidas ${deleted} decorações (todas)`);
    }

    // Verificar items após remoção (para debug)
    const itemsAfter = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction,
    });
    const productsAfter = itemsAfter.filter(item => item.itemType === 'product' || !item.itemType);
    const decorationsAfter = itemsAfter.filter(item => item.itemType === 'decoration');
    
    console.log('🔄 [syncDecorations] Após remoção de decorações:', {
      totalItems: itemsAfter.length,
      products: productsAfter.length,
      decorations: decorationsAfter.length,
      productNames: productsAfter.map(p => p.name)
    });

    // Verificar se algum produto foi removido incorretamente
    if (productsBefore.length !== productsAfter.length) {
      console.error('❌ [syncDecorations] ERRO: Produtos foram removidos!', {
        antes: productsBefore.length,
        depois: productsAfter.length,
        produtosRemovidos: productsBefore.filter(p => !productsAfter.find(pa => pa.id === p.id)).map(p => p.name)
      });
    }

    // Função para normalizar chave de agrupamento (mesma lógica do frontend)
    const normalizeKey = (value) => {
      if (!value) return 'unknown';
      return String(value)
        .toLowerCase()
        .replace(/^prd-/, '') // Remove prefixo "prd-"
        .replace(/[-\s]/g, '') // Remove hífens e espaços
        .trim();
    };

    // Agregar decorações por ID normalizado (contar quantidades)
    // Isso garante que decorações com formatação diferente sejam agrupadas
    const decorationCounts = {};
    for (const dec of decorations) {
      const originalKey = dec.decorationId || dec.id;
      if (!originalKey) continue;
      
      // Normalizar chave para agrupamento
      const normalizedKey = normalizeKey(originalKey);
      
      if (!decorationCounts[normalizedKey]) {
        decorationCounts[normalizedKey] = {
          decorationId: originalKey, // Guardar ID original
          normalizedKey: normalizedKey, // Chave normalizada para agrupamento
          name: dec.name,
          imageUrl: dec.imageUrl || dec.dayUrl || dec.src,
          price: dec.price || 0,
          quantity: 0,
        };
      }
      decorationCounts[normalizedKey].quantity += 1;
    }

    // Criar novos items para cada decoração única
    const createdItems = [];
    for (const [normalizedKey, data] of Object.entries(decorationCounts)) {
      // Tentar buscar informações da decoração na base de dados usando o ID original
      let decoration = null;
      
      // Verificar se o decorationId parece ser um UUID válido antes de tentar buscar
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.decorationId);
      
      if (isUUID) {
        try {
          decoration = await Decoration.findByPk(data.decorationId, { transaction });
        } catch (e) {
          // Decoração pode não existir (IDs temporários do canvas)
          console.warn('Decoração não encontrada na BD:', data.decorationId, e.message);
        }
      } else {
        // ID não é um UUID válido, provavelmente é um ID temporário do canvas
        console.log('ID de decoração não é UUID válido (provavelmente temporário):', data.decorationId);
      }

      // Só guardar decorationId se for um UUID válido e a decoração existir na BD
      const validDecorationId = (decoration && isUUID) ? data.decorationId : null;

      // Validar e preparar dados antes de criar o item
      const itemName = (decoration?.name || data.name || 'Decoração').trim();
      if (!itemName) {
        console.warn('Nome vazio para decoração:', data.decorationId);
        continue; // Pular esta decoração se não tiver nome
      }
      
      const itemPrice = decoration?.price || parseFloat(data.price) || 0;
      const itemImageUrl = decoration?.thumbnailUrl || data.imageUrl || null;
      // data.quantity já é um número (foi incrementado), mas garantir que é válido
      const itemQuantity = typeof data.quantity === 'number' ? data.quantity : parseInt(data.quantity) || 1;

      // Validar que a quantidade é válida
      if (!itemQuantity || itemQuantity < 1) {
        console.warn('Quantidade inválida para decoração:', data.decorationId, itemQuantity);
        continue; // Pular esta decoração
      }

      try {
        const item = await OrderItem.create({
          orderId: order.id,
          decorationId: validDecorationId,
          productId: null,
          itemType: 'decoration',
          name: itemName,
          quantity: itemQuantity,
          unitPrice: itemPrice,
          imageUrl: itemImageUrl,
          sourceImageId: sourceImageId || null,
          variant: {},
        }, { transaction });

        createdItems.push(item);
      } catch (itemError) {
        console.error('Erro ao criar OrderItem para decoração:', data.decorationId, itemError);
        // Continuar com as outras decorações mesmo se uma falhar
        throw itemError; // Re-throw para que a transação seja revertida
      }
    }

    // Recalcular total da order
    const allItems = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction,
    });

    const newTotal = allItems.reduce((sum, i) => {
      const price = parseFloat(i.unitPrice) || 0;
      return sum + (price * i.quantity);
    }, 0);

    order.total = newTotal;
    await order.save({ transaction });

    await transaction.commit();

    // Retornar order atualizada
    let updatedOrder;
    try {
      updatedOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl'],
                required: false,
              },
              {
                model: Decoration,
                as: 'decoration',
                attributes: ['id', 'name', 'price', 'thumbnailUrl', 'category'],
                required: false,
              },
            ],
          },
        ],
      });

      if (!updatedOrder) {
        throw new Error('Order não encontrada após sincronização');
      }
      
      // Debug: Verificar se produtos estão na resposta
      const finalProducts = updatedOrder.items?.filter(item => item.itemType === 'product' || !item.itemType) || [];
      const finalDecorations = updatedOrder.items?.filter(item => item.itemType === 'decoration') || [];
      console.log('✅ [syncDecorations] Order final retornada:', {
        totalItems: updatedOrder.items?.length || 0,
        products: finalProducts.length,
        decorations: finalDecorations.length,
        productNames: finalProducts.map(p => p.name)
      });
    } catch (fetchError) {
      console.error('Erro ao buscar order atualizada:', fetchError);
      // Se falhar ao buscar a order atualizada, tentar buscar sem includes
      updatedOrder = await Order.findByPk(order.id);
      if (!updatedOrder) {
        throw new Error('Order não encontrada após sincronização');
      }
    }

    res.json({
      order: updatedOrder,
      syncedDecorations: createdItems.length,
      totalDecorations: decorations.length,
    });
  } catch (error) {
    // Se a transação ainda estiver ativa, fazer rollback
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Erro ao sincronizar decorações:', error);
    console.error('Stack trace:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Project ID:', req.params.projectId);
    res.status(500).json({ 
      error: 'Erro ao sincronizar decorações', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

