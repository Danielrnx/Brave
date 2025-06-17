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

// Endpoint para devolver o nome do utilizador autenticado
app.get('/userinfo', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT name FROM customers WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.sendStatus(404);
    res.json({ name: result.rows[0].name });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter utilizador' });
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

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }
    // Gera token JWT com o id do utilizador
    const token = jwt.sign({ id: user.id }, 'SEU_SEGREDO_JWT');
    res.json({ token, name: user.name, is_Admin: user.is_admin }); // <-- devolve isAdmin
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// Hash da senha admin por segurança
bcrypt.hash('admin123', 10).then(console.log);

// Iniciar o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor ativo: http://localhost:${port}`);
});
