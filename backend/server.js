import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { userSchema, productSchema, otpSchema } from './schema';
const app = express();
app.use(cors());
app.use(express.json());
const JWT_SECRET = 'stocksense-super-secret-key-2026';
// In-Memory Database (for demonstration)
let products = [
    { id: '1', name: 'Steel Rods', sku: 'ST-001', category: 'Raw Material', uom: 'kg', initialStock: 1500 }
];
let operations = [];
let users = [];
// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================
app.post('/auth/signup', (req, res) => {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    users.push({ ...parsed.data, id: Date.now().toString() });
    res.status(201).json({ message: 'User created successfully' });
});
app.post('/auth/login', (req, res) => {
    const parsed = userSchema.pick({ email: true, password: true }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    // In real app, verify password hash
    const token = jwt.sign({ email: parsed.data.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: 'Login successful' });
});
app.post('/auth/reset/request', (req, res) => {
    // Send OTP to email logic here
    res.json({ message: 'OTP sent to email' });
});
app.post('/auth/reset/verify', (req, res) => {
    const parsed = otpSchema.pick({ email: true, otp: true }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    res.json({ message: 'OTP verified' });
});
app.post('/auth/reset/confirm', (req, res) => {
    const parsed = otpSchema.pick({ email: true, newPassword: true }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    res.json({ message: 'Password has been reset successfully' });
});
// ==========================================
// 2. PRODUCT ENDPOINTS
// ==========================================
app.get('/products', (req, res) => {
    res.json(products);
});
app.post('/products', (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.format() });
    const newProduct = { id: Date.now().toString(), ...parsed.data };
    products.push(newProduct);
    res.status(201).json(newProduct);
});
app.get('/products/:id/stock', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product)
        return res.status(404).json({ error: 'Product not found' });
    res.json({ id: product.id, stock: product.initialStock, locations: [{ name: 'Main Store', qty: product.initialStock }] });
});
// ==========================================
// 3. SERVER-SENT EVENTS (SSE) STREAMING
// ==========================================
app.get('/dashboard/stream', (req, res) => {
    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Send initial data immediately
    const sendData = () => {
        const kpis = {
            totalProducts: products.length,
            lowStock: products.filter(p => p.initialStock < 50).length,
            pendingReceipts: operations.filter(o => o.type === 'Receipt' && o.status !== 'Done').length || 12,
            pendingDeliveries: operations.filter(o => o.type === 'Delivery' && o.status !== 'Done').length || 34,
            internalTransfers: operations.filter(o => o.type === 'Transfer' && o.status !== 'Done').length || 8,
            timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(kpis)}\n\n`);
    };
    sendData();
    // Stream updates every 5 seconds to simulate live dashboard
    const intervalId = setInterval(sendData, 5000);
    // Clean up when client disconnects
    req.on('close', () => {
        clearInterval(intervalId);
    });
});
app.get('/notifications/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    let alertCount = 0;
    const sendAlert = () => {
        alertCount++;
        const alert = {
            id: alertCount,
            message: `Stock alert! ${products[0]?.name || 'Item'} is running low.`,
            severity: 'warning',
            timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(alert)}\n\n`);
    };
    // Stream a notification every 15 seconds
    const intervalId = setInterval(sendAlert, 15000);
    req.on('close', () => {
        clearInterval(intervalId);
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`StockSense API Server is running on http://localhost:${PORT}`);
    console.log(`- Dashboard SSE Stream: http://localhost:${PORT}/dashboard/stream`);
    console.log(`- Notifications SSE Stream: http://localhost:${PORT}/notifications/stream`);
});
