const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5556;

app.use(cors());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Escuchar en todas las interfaces de red (0.0.0.0) para permitir acceso desde la red local
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Servidor web iniciado!`);
    console.log(`👉 Puedes acceder desde esta PC en: http://localhost:${PORT}`);
    console.log(`👉 Tu familia puede acceder desde la red local usando tu IP de red: http://<TU_IP_LOCAL>:${PORT}`);
});
