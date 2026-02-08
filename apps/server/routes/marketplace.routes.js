/**
 * VECTRYS - Marketplace Routes
 * Shop avatars, items, badges + P2P trading
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// GET /api/marketplace/items
// Catalogue complet d'items
// ============================================================================
router.get('/items', async (req, res) => {
  try {
    const {
      type,            // avatar, accessory, badge, background, emote
      rarity,          // common, rare, epic, legendary, mythic
      min_price,
      max_price,
      available_only = 'true',
      sort = 'popularity', // popularity, price_asc, price_desc, newest
      limit = '50',
      offset = '0'
    } = req.query;

    // Filtres
    const where = { active: true };

    if (type) where.type = type;
    if (rarity) where.rarity = rarity;
    if (available_only === 'true') {
      where.available_for_purchase = true;
    }
    if (min_price) {
      where.base_price = { gte: parseInt(min_price) };
    }
    if (max_price) {
      where.base_price = { ...where.base_price, lte: parseInt(max_price) };
    }

    // Tri
    let orderBy = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { base_price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { base_price: 'desc' };
        break;
      case 'newest':
        orderBy = { created_at: 'desc' };
        break;
      case 'popularity':
      default:
        orderBy = { popularity_score: 'desc' };
    }

    const total = await prisma.item.count({ where });

    const items = await prisma.item.findMany({
      where,
      orderBy,
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/marketplace/item/:id
// Détail d'un item
// ============================================================================
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        trades_as_item1: {
          where: { status: 'completed' },
          take: 5,
          orderBy: { completed_at: 'desc' },
          select: {
            id: true,
            xp_from_seller: true,
            xp_from_buyer: true,
            completed_at: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Calculer valeur marchée moyenne
    const recentTrades = item.trades_as_item1;
    const avgTradeValue = recentTrades.length > 0
      ? recentTrades.reduce((sum, t) => sum + t.xp_from_buyer, 0) / recentTrades.length
      : item.base_price;

    res.json({
      success: true,
      data: {
        ...item,
        market_data: {
          average_trade_value: Math.round(avgTradeValue),
          recent_trades_count: recentTrades.length,
          supply_remaining: item.limited_edition
            ? (item.max_supply - item.times_purchased)
            : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/marketplace/purchase
// Acheter un item
// ============================================================================
router.post('/purchase', async (req, res) => {
  try {
    const {
      housekeeper_id,
      item_id,
      quantity = 1
    } = req.body;

    if (!housekeeper_id || !item_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: housekeeper_id, item_id'
      });
    }

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Vérifier l'item
      const item = await tx.item.findUnique({ where: { id: item_id } });

      if (!item) {
        throw new Error('Item not found');
      }

      if (!item.available_for_purchase) {
        throw new Error('Item not available for purchase');
      }

      if (item.limited_edition && item.current_supply <= 0) {
        throw new Error('Item out of stock');
      }

      // 2. Vérifier le housekeeper
      const housekeeper = await tx.housekeeper.findUnique({
        where: { id: housekeeper_id }
      });

      if (!housekeeper) {
        throw new Error('Housekeeper not found');
      }

      // 3. Vérifier niveau requis
      if (housekeeper.level < item.required_level) {
        throw new Error(`Level ${item.required_level} required (current: ${housekeeper.level})`);
      }

      // 4. Vérifier XP suffisant
      const totalCost = item.base_price * quantity;
      if (housekeeper.total_xp < totalCost) {
        throw new Error(`Insufficient XP (required: ${totalCost}, have: ${housekeeper.total_xp})`);
      }

      // 5. Déduire XP
      await tx.housekeeper.update({
        where: { id: housekeeper_id },
        data: {
          total_xp: { decrement: totalCost }
        }
      });

      // 6. Mettre à jour stats item
      await tx.item.update({
        where: { id: item_id },
        data: {
          times_purchased: { increment: quantity },
          current_supply: item.limited_edition
            ? { decrement: quantity }
            : undefined,
          popularity_score: { increment: 1 }
        }
      });

      return { item, totalCost, newXP: housekeeper.total_xp - totalCost };
    });

    res.json({
      success: true,
      data: {
        item: result.item,
        quantity,
        xp_spent: result.totalCost,
        remaining_xp: result.newXP
      },
      message: 'Item purchased successfully'
    });

  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not available') ||
        error.message.includes('out of stock') || error.message.includes('required') ||
        error.message.includes('Insufficient')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error('Error purchasing item:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/marketplace/my-inventory
// Inventaire d'un utilisateur
// ============================================================================
router.get('/my-inventory', async (req, res) => {
  try {
    const { housekeeper_id } = req.query;

    if (!housekeeper_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: housekeeper_id'
      });
    }

    const housekeeper = await prisma.housekeeper.findUnique({
      where: { id: housekeeper_id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        total_xp: true,
        level: true,
        badges: true,
        avatar_customization: true
      }
    });

    if (!housekeeper) {
      return res.status(404).json({
        success: false,
        error: 'Housekeeper not found'
      });
    }

    // Pour l'instant, l'inventaire est stocké dans avatar_customization
    // Dans une version complète, il faudrait une table HousekeeperInventory

    res.json({
      success: true,
      data: {
        housekeeper: {
          id: housekeeper.id,
          name: `${housekeeper.first_name} ${housekeeper.last_name}`,
          xp: housekeeper.total_xp,
          level: housekeeper.level
        },
        badges: housekeeper.badges || [],
        customization: housekeeper.avatar_customization,
        total_badges: Array.isArray(housekeeper.badges) ? housekeeper.badges.length : 0
      }
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// POST /api/marketplace/trade/create
// Créer une offre de trade P2P
// ============================================================================
router.post('/trade/create', async (req, res) => {
  try {
    const {
      seller_id,
      buyer_id,
      item1_id,
      item1_quantity = 1,
      item2_id,
      item2_quantity = 1,
      xp_from_seller = 0,
      xp_from_buyer = 0,
      offer_message
    } = req.body;

    if (!seller_id || !buyer_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: seller_id, buyer_id'
      });
    }

    if (seller_id === buyer_id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot trade with yourself'
      });
    }

    if (!item1_id && !item2_id && xp_from_seller === 0 && xp_from_buyer === 0) {
      return res.status(400).json({
        success: false,
        error: 'Trade must include at least one item or XP'
      });
    }

    const trade = await prisma.trade.create({
      data: {
        seller_id,
        buyer_id,
        item1_id,
        item1_quantity,
        item2_id,
        item2_quantity,
        xp_from_seller,
        xp_from_buyer,
        offer_message,
        status: 'pending'
      },
      include: {
        item1: true,
        item2: true
      }
    });

    res.status(201).json({
      success: true,
      data: trade,
      message: 'Trade offer created successfully'
    });

  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// PUT /api/marketplace/trade/:id/accept
// Accepter une offre de trade
// ============================================================================
router.put('/trade/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer_id } = req.body;

    if (!buyer_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: buyer_id'
      });
    }

    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        item1: true,
        item2: true
      }
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    if (trade.buyer_id !== buyer_id) {
      return res.status(403).json({
        success: false,
        error: 'Only the buyer can accept this trade'
      });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Trade already ${trade.status}`
      });
    }

    // Transaction pour exécuter le trade
    await prisma.$transaction(async (tx) => {
      // Vérifier et transférer XP si nécessaire
      if (trade.xp_from_buyer > 0) {
        const buyer = await tx.housekeeper.findUnique({
          where: { id: trade.buyer_id }
        });

        if (buyer.total_xp < trade.xp_from_buyer) {
          throw new Error('Buyer has insufficient XP');
        }

        await tx.housekeeper.update({
          where: { id: trade.buyer_id },
          data: { total_xp: { decrement: trade.xp_from_buyer } }
        });

        await tx.housekeeper.update({
          where: { id: trade.seller_id },
          data: { total_xp: { increment: trade.xp_from_buyer } }
        });
      }

      if (trade.xp_from_seller > 0) {
        await tx.housekeeper.update({
          where: { id: trade.seller_id },
          data: { total_xp: { decrement: trade.xp_from_seller } }
        });

        await tx.housekeeper.update({
          where: { id: trade.buyer_id },
          data: { total_xp: { increment: trade.xp_from_seller } }
        });
      }

      // Mettre à jour stats des items
      if (trade.item1_id) {
        await tx.item.update({
          where: { id: trade.item1_id },
          data: {
            times_traded: { increment: 1 },
            current_market_value: trade.xp_from_buyer > 0
              ? trade.xp_from_buyer
              : undefined
          }
        });
      }

      if (trade.item2_id) {
        await tx.item.update({
          where: { id: trade.item2_id },
          data: { times_traded: { increment: 1 } }
        });
      }

      // Mettre à jour le trade
      await tx.trade.update({
        where: { id },
        data: {
          status: 'completed',
          completed_at: new Date()
        }
      });
    });

    const updatedTrade = await prisma.trade.findUnique({
      where: { id },
      include: {
        item1: true,
        item2: true
      }
    });

    res.json({
      success: true,
      data: updatedTrade,
      message: 'Trade completed successfully'
    });

  } catch (error) {
    if (error.message.includes('insufficient')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error('Error accepting trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// PUT /api/marketplace/trade/:id/reject
// Rejeter une offre de trade
// ============================================================================
router.put('/trade/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, reason } = req.body;

    const trade = await prisma.trade.findUnique({
      where: { id }
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    if (trade.buyer_id !== user_id && trade.seller_id !== user_id) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this trade'
      });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Trade already ${trade.status}`
      });
    }

    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        status: 'rejected',
        cancelled_reason: reason
      }
    });

    res.json({
      success: true,
      data: updatedTrade,
      message: 'Trade rejected'
    });

  } catch (error) {
    console.error('Error rejecting trade:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================================================
// GET /api/marketplace/trades/:userId
// Mes trades (envoyés et reçus)
// ============================================================================
router.get('/trades/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type = 'all' } = req.query;

    const where = {};

    if (type === 'sent') {
      where.seller_id = userId;
    } else if (type === 'received') {
      where.buyer_id = userId;
    } else {
      where.OR = [
        { seller_id: userId },
        { buyer_id: userId }
      ];
    }

    if (status) {
      where.status = status;
    }

    const trades = await prisma.trade.findMany({
      where,
      include: {
        item1: {
          select: {
            id: true,
            name: true,
            type: true,
            rarity: true,
            image_url: true
          }
        },
        item2: {
          select: {
            id: true,
            name: true,
            type: true,
            rarity: true,
            image_url: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const stats = {
      total: trades.length,
      pending: trades.filter(t => t.status === 'pending').length,
      completed: trades.filter(t => t.status === 'completed').length,
      rejected: trades.filter(t => t.status === 'rejected').length
    };

    res.json({
      success: true,
      data: {
        trades,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
