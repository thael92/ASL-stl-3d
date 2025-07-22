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
    // Mantém o nome original do arquivo com timestamp para evitar conflitos
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    cb(null, `${nameWithoutExt}_${timestamp}${extension}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Aceita apenas arquivos STL
    if (file.mimetype === 'application/octet-stream' || 
        file.originalname.toLowerCase().endsWith('.stl')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos STL são permitidos!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // Limite de 50MB por arquivo
  }
});

// Middleware para parsing JSON
app.use(express.json());

// Rota para upload de múltiplos arquivos STL
app.post('/api/upload', upload.array('stlFiles', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado' 
      });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      path: `/uploads/${file.filename}`,
      uploadDate: new Date().toISOString()
    }));

    console.log('Arquivos enviados com sucesso:', uploadedFiles);

    res.json({
      success: true,
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor durante o upload'
    });
  }
});

// Rota para listar todos os arquivos STL salvos
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.toLowerCase().endsWith('.stl'))
      .map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename: filename,
          originalName: filename.replace(/_\d+\.stl$/, '.stl'), // Remove timestamp
          size: stats.size,
          path: `/uploads/${filename}`,
          uploadDate: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)); // Mais recentes primeiro

    res.json({
      success: true,
      files: files
    });

  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar arquivos'
    });
  }
});

// Rota para deletar um arquivo específico
app.delete('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }

    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar arquivo'
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 50MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Muitos arquivos. Máximo: 10 arquivos por vez'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'Erro interno do servidor'
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});