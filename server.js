const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cria o diretório uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Mantém o nome original do arquivo
    cb(null, file.originalname);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Aceita apenas arquivos .stl
    if (path.extname(file.originalname).toLowerCase() === '.stl') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .stl são permitidos!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // Limite de 50MB
  }
});

// Rotas
app.post('/upload', upload.single('stlFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }
  console.log('Arquivo enviado:', req.file.filename);
  res.redirect('/');
});

app.get('/list-files', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) {
      console.error('Erro ao listar arquivos:', err);
      return res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
    
    const stlFiles = files.filter(f => path.extname(f).toLowerCase() === '.stl');
    console.log('Arquivos STL encontrados:', stlFiles);
    res.json(stlFiles);
  });
});

// Rota principal - CORRIGIDA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send('Arquivo muito grande. Máximo 50MB.');
    }
  }
  res.status(500).send('Erro interno do servidor.');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Diretório de uploads: ${uploadsDir}`);
});