import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { userSchema, productSchema, operationSchema, otpSchema } from './schema';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'stocksense-super-secret-key-2026';

// ==========================================
// IN-MEMORY DATABASE (Mocks)
// ==========================================
let users: any[] = [];
let products: any[] = [
  { id: '1', name: 'Steel Rods', sku: 'ST-001', category: 'Raw Material', uom: 'kg', initialStock: 1500 }
];
let categories: any[] = [{ id: '1', name: 'Raw Material' }, { id: '2', name: 'Finished Goods' }];
let reorderRules: any[] = [];
let warehouses: any[] = [{ id: '1', name: 'Main Store' }];
let locations: any[] = [{ id: '1', warehouseId: '1', name: 'Rack A' }];
let operations: any[] = [];
let ledger: any[] = [];
let quants: any[] = [];
let profileData: any = { name: 'Admin User', email: 'admin@stocksense.com', role: 'Inventory Manager' };

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
app.post('/auth/signup', (req, res) => res.status(201).json({ message: 'User created' }));
app.post('/auth/login', (req, res) => res.json({ token: jwt.sign({ email: req.body.email }, JWT_SECRET, { expiresIn: '1h' }) }));
app.post('/auth/logout', (req, res) => res.json({ message: 'Logout successful' }));
app.post('/auth/reset/request', (req, res) => res.json({ message: 'OTP sent to email' }));
app.post('/auth/reset/verify', (req, res) => res.json({ message: 'OTP verified' }));
app.post('/auth/reset/confirm', (req, res) => res.json({ message: 'Password has been reset' }));

// ==========================================
// 2. DASHBOARD ENDPOINTS
// ==========================================
app.get('/dashboard', (req, res) => res.json({ totalProducts: products.length, lowStock: 48, pendingReceipts: 12, pendingDeliveries: 34, internalTransfers: 8 }));

app.get('/dashboard/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendData = () => {
    res.write(`data: ${JSON.stringify({ totalProducts: products.length, lowStock: 48, pendingReceipts: 12, pendingDeliveries: 34, internalTransfers: 8, timestamp: new Date().toISOString() })}\n\n`);
  };

  sendData();
  const intervalId = setInterval(sendData, 5000);
  req.on('close', () => clearInterval(intervalId));
});

app.get('/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendAlert = () => res.write(`data: ${JSON.stringify({ message: 'Stock alert!', severity: 'warning', timestamp: new Date().toISOString() })}\n\n`);
  const intervalId = setInterval(sendAlert, 15000);
  req.on('close', () => clearInterval(intervalId));
});

// ==========================================
// 3. PRODUCTS ENDPOINTS
// ==========================================
app.get('/products', (req, res) => res.json(products));
app.post('/products', (req, res) => {
  const newProduct = { id: Date.now().toString(), ...req.body };
  products.push(newProduct);
  res.status(201).json(newProduct);
});
app.get('/products/:id', (req, res) => res.json(products.find(p => p.id === req.params.id) || {}));
app.put('/products/:id', (req, res) => res.json({ message: 'Product updated', id: req.params.id }));
app.get('/products/:id/stock', (req, res) => res.json({ stock: 1500, locations: [{ name: 'Main Store', qty: 1500 }] }));

app.get('/products/categories', (req, res) => res.json(categories));
app.post('/products/categories', (req, res) => res.status(201).json({ message: 'Category created' }));

app.get('/products/reorder-rules', (req, res) => res.json(reorderRules));
app.post('/products/reorder-rules', (req, res) => res.status(201).json({ message: 'Rule created' }));

// ==========================================
// 4. WAREHOUSES & LOCATIONS ENDPOINTS
// ==========================================
app.get('/warehouses', (req, res) => res.json(warehouses));
app.post('/warehouses', (req, res) => res.status(201).json({ message: 'Warehouse created' }));
app.get('/warehouses/:id/locations', (req, res) => res.json(locations.filter(l => l.warehouseId === req.params.id)));
app.post('/warehouses/:id/locations', (req, res) => res.status(201).json({ message: 'Location created' }));

// ==========================================
// 5. OPERATIONS ENDPOINTS (Receipts, Deliveries, Transfers, Adjustments)
// ==========================================
// Receipts
app.get('/operations/receipts', (req, res) => res.json(operations.filter(o => o.type === 'Receipt')));
app.post('/operations/receipts', (req, res) => res.status(201).json({ message: 'Receipt created' }));
app.get('/operations/receipts/:id', (req, res) => res.json({}));
app.put('/operations/receipts/:id', (req, res) => res.json({ message: 'Receipt updated' }));
app.post('/operations/receipts/:id/validate', (req, res) => res.json({ message: 'Receipt validated (Stock increased)' }));

// Deliveries
app.get('/operations/deliveries', (req, res) => res.json(operations.filter(o => o.type === 'Delivery')));
app.post('/operations/deliveries', (req, res) => res.status(201).json({ message: 'Delivery created' }));
app.post('/operations/deliveries/:id/validate', (req, res) => res.json({ message: 'Delivery validated (Stock decreased)' }));

// Transfers
app.get('/operations/transfers', (req, res) => res.json(operations.filter(o => o.type === 'Transfer')));
app.post('/operations/transfers', (req, res) => res.status(201).json({ message: 'Transfer created' }));
app.post('/operations/transfers/:id/validate', (req, res) => res.json({ message: 'Transfer validated (Stock moved)' }));

// Adjustments
app.get('/operations/adjustments', (req, res) => res.json(operations.filter(o => o.type === 'Adjustment')));
app.post('/operations/adjustments', (req, res) => res.status(201).json({ message: 'Adjustment created' }));
app.post('/operations/adjustments/:id/validate', (req, res) => res.json({ message: 'Adjustment validated (Stock synced)' }));

// ==========================================
// 6. STOCK LEDGER & QUANTS ENDPOINTS
// ==========================================
app.get('/stock/ledger', (req, res) => res.json(ledger));
app.get('/stock/quant', (req, res) => res.json(quants));

// ==========================================
// 7. PROFILE ENDPOINTS
// ==========================================
app.get('/profile', (req, res) => res.json(profileData));
app.put('/profile', (req, res) => {
  profileData = { ...profileData, ...req.body };
  res.json({ message: 'Profile updated', data: profileData });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`StockSense API Server is running on http://localhost:${PORT}`);
});
