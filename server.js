const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Upload de arquivos STL
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

app.post('/upload', upload.single('stlFile'), (req, res) => {
  res.redirect('/');
});

// Listar arquivos STL
app.get('/list-files', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) return res.status(500).send('Erro ao listar arquivos');
    res.json(files.filter(file => path.extname(file).toLowerCase() === '.stl'));
  });
});

app.listen(PORT, () => console.log(`Servidor rodando: http://localhost:${PORT}`));
