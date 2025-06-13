const express = require('express');
const router = express.Router();
const Card = require('../models/card');
const CardType = require('../models/cardType');
const Customer = require('../models/customer');
const authMiddleware = require('../middleware/auth');
const { validateCardRequest } = require('../middleware/validation');

// Apply authentication middleware to all card routes
router.use(authMiddleware);

// Get all cards for the authenticated user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        const cards = await Card.findByCustomerId(customer.id);
        
        // Enhance card details with card type information
        const enhancedCards = [];
        for (const card of cards) {
            const cardType = await CardType.findById(card.card_type_id);
            enhancedCards.push({
                ...card,
                card_type: cardType ? {
                    name: cardType.name,
                    description: cardType.description,
                    benefits: cardType.benefits
                } : null
            });
        }
        
        res.json({
            success: true,
            cards: enhancedCards
        });
    } catch (error) {
        console.error('Error retrieving cards:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific card details
router.get('/:id', async (req, res) => {
    try {
        const cardId = req.params.id;
        const card = await Card.findById(cardId);
        
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        // Check if the card belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || card.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to view this card' });
        }
        
        // Get card type details
        const cardType = await CardType.findById(card.card_type_id);
        
        res.json({
            success: true,
            card: {
                ...card,
                card_type: cardType ? {
                    name: cardType.name,
                    description: cardType.description,
                    interest_rate: cardType.interest_rate,
                    annual_fee: cardType.annual_fee,
                    benefits: cardType.benefits
                } : null
            }
        });
    } catch (error) {
        console.error('Error retrieving card:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request a new card
router.post('/', validateCardRequest, async (req, res) => {
    try {
        const { card_type_id, account_id } = req.body;
        
        // Check if the user is authenticated and get customer profile
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Check if the card type exists
        const cardType = await CardType.findById(card_type_id);
        
        if (!cardType) {
            return res.status(404).json({ error: 'Card type not found' });
        }
        
        // In a real implementation, this would involve additional verification,
        // credit checks, approval process, etc. For now, we'll create the card directly.
        
        // Generate a masked card number
        const cardNumber = `4111${Math.floor(1000 + Math.random() * 9000)}****${Math.floor(1000 + Math.random() * 9000)}`;
        
        // Generate expiry date (3 years from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 3);
        
        // Generate CVV
        const cvv = `${Math.floor(100 + Math.random() * 900)}`;
        
        // Create the card
        const card = await Card.create({
            customer_id: customer.id,
            card_type_id: card_type_id,
            account_id: account_id,
            card_number: cardNumber,
            expiry_date: expiryDate,
            cvv: cvv,
            card_holder_name: `${customer.first_name} ${customer.last_name}`,
            is_active: true
        });
        
        res.status(201).json({
            success: true,
            message: 'Card request successful',
            card: {
                id: card.id,
                card_type: cardType.name,
                card_number: card.card_number,
                expiry_date: card.expiry_date,
                card_holder_name: card.card_holder_name,
                is_active: card.is_active
            }
        });
    } catch (error) {
        console.error('Error requesting card:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update card status (activate/deactivate)
router.put('/:id/status', async (req, res) => {
    try {
        const cardId = req.params.id;
        const { is_active } = req.body;
        
        if (is_active === undefined) {
            return res.status(400).json({ error: 'Card status (is_active) is required' });
        }
        
        const card = await Card.findById(cardId);
        
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        // Check if the card belongs to the authenticated user
        const userId = req.user.id;
        const customer = await Customer.findByUserId(userId);
        
        if (!customer || card.customer_id !== customer.id) {
            return res.status(403).json({ error: 'You do not have permission to update this card' });
        }
        
        // Update card status
        const updatedCard = await Card.update(cardId, { is_active });
        
        res.json({
            success: true,
            card: updatedCard
        });
    } catch (error) {
        console.error('Error updating card status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get available card types
router.get('/types', async (req, res) => {
    try {
        const cardTypes = await CardType.findAll();
        
        res.json({
            success: true,
            card_types: cardTypes
        });
    } catch (error) {
        console.error('Error retrieving card types:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
