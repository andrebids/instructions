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
      item = await OrderItem.create({
        orderId: id,
        productId,
        itemType: 'product',
        name: product.name,
        quantity,
        unitPrice: product.price,
        variant: variant || {},
        imageUrl: product.thumbnailUrl || product.imagesDayUrl || null,
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

    // Remover items de decoração existentes desta source image (para fazer sync completo)
    if (sourceImageId) {
      await OrderItem.destroy({
        where: {
          orderId: order.id,
          itemType: 'decoration',
          sourceImageId,
        },
        transaction,
      });
    } else {
      // Se não há sourceImageId, remover todas as decorações da order
      await OrderItem.destroy({
        where: {
          orderId: order.id,
          itemType: 'decoration',
        },
        transaction,
      });
    }

    // Agregar decorações por ID (contar quantidades)
    const decorationCounts = {};
    for (const dec of decorations) {
      const key = dec.decorationId || dec.id;
      if (!key) continue;
      
      if (!decorationCounts[key]) {
        decorationCounts[key] = {
          decorationId: key,
          name: dec.name,
          imageUrl: dec.imageUrl || dec.dayUrl || dec.src,
          price: dec.price || 0,
          quantity: 0,
        };
      }
      decorationCounts[key].quantity += 1;
    }

    // Criar novos items para cada decoração única
    const createdItems = [];
    for (const [decorationId, data] of Object.entries(decorationCounts)) {
      // Tentar buscar informações da decoração na base de dados
      let decoration = null;
      try {
        decoration = await Decoration.findByPk(decorationId, { transaction });
      } catch (e) {
        // Decoração pode não existir (IDs temporários do canvas)
      }

      const item = await OrderItem.create({
        orderId: order.id,
        decorationId: decoration ? decorationId : null,
        productId: null,
        itemType: 'decoration',
        name: decoration?.name || data.name || 'Decoração',
        quantity: data.quantity,
        unitPrice: decoration?.price || data.price || 0,
        imageUrl: decoration?.thumbnailUrl || data.imageUrl,
        sourceImageId: sourceImageId || null,
        variant: {},
      }, { transaction });

      createdItems.push(item);
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

    res.json({
      order: updatedOrder,
      syncedDecorations: createdItems.length,
      totalDecorations: decorations.length,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao sincronizar decorações:', error);
    res.status(500).json({ error: 'Erro ao sincronizar decorações', details: error.message });
  }
};

