const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir ficheiros estáticos do frontend
app.use(express.static(path.join(__dirname, '../Frontend/public')));

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/public/index.html'));
});

app.get('/user.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/public/user.html'));
});

// Middleware para autenticar o token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, 'SEU_SEGREDO_JWT', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Endpoint /userinfo
app.get('/userinfo', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT name, email, phone, address FROM customers WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.sendStatus(404);
    res.json(result.rows[0]); // Retorna todos os dados que foram solicitados
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter utilizador' });
  }
});

// Corrigido: proteger com authenticateToken
app.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    // Buscar utilizador autenticado
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Senha atual incorreta.' });
    }
    // Atualize a senha do usuário
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE customers SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error('Erro ao mudar senha:', err);
    res.status(500).json({ message: 'Erro ao mudar senha.' });
  }
});

// Ligação à base de dados PostgreSQL
const db = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'BD_Braves',
  password: '1234567',
  port: 5432
});

db.connect()
  .then(() => console.log('🟢 Conectado ao PostgreSQL'))
  .catch(err => console.error('🔴 Erro ao conectar:', err.message));

// Endpoint: Registar utilizador
app.post('/register', async (req, res) => {
  const { name, email, password, phone, address, gender } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta.' });
  }

  try {
    const check = await db.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(409).json({ message: 'E-mail já registado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO customers (name, email, password, phone, address, gender)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, email, hashedPassword, phone, address, gender]
    );

    res.status(201).json({ message: 'Registado com sucesso', user: result.rows[0] });

  } catch (error) {
    console.error('Erro ao registar:', error);
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
});

// Login de utilizador no backend
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica se o utilizador existe na base de dados
    const result = await db.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];

    // Verifica se a senha está correta
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    // Gera o token JWT com a informação do usuário (e se ele é admin)
    const token = jwt.sign(
      { id: user.id, isAdmin: user.is_admin },  // Adiciona o status de admin no token
      'SEU_SEGREDO_JWT'
    );

    res.json({
      token,
      name: user.name,
      isAdmin: user.is_admin // Retorna se o usuário é admin ou não
    });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// Exemplo no backend - products.routes.js
app.get('/products', async (req, res) => {
  try {
    const produtos = await Product.findAll(); // ou Product.findAll({ where: ... })
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar produtos.' });
  }
});


// Endpoint para editar dados do utilizador
app.put('/update-user', authenticateToken, async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const result = await db.query(
      'UPDATE customers SET name = $1, phone = $2, address = $3 WHERE id = $4 RETURNING *',
      [name, phone, address, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    res.json({ message: 'Dados atualizados com sucesso', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar dados do utilizador' });
  }
});


// Finalizar compra e criar fatura
app.post('/checkout', async (req, res) => {
  const { userId, cartItems } = req.body;

  try {
    const total = cartItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

    const invoice = await Invoice.create({ customer_id: userId, total });

    for (const item of cartItems) {
      await InvoiceItem.create({
        invoice_id: invoice.id,
        product_id: item.id,
        quantity: item.quantidade,
        price: item.preco
      });
    }

    res.status(201).json({ message: 'Compra finalizada com sucesso!' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao finalizar compra.' });
  }
});


// Hash da senha admin por segurança
bcrypt.hash('admin123', 10).then(console.log);

// Iniciar o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor ativo: http://localhost:${port}`);
});
