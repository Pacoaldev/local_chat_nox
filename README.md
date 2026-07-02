# Local Chat UI for LM Studio 🏡🤖

Una interfaz web moderna, ligera y privada para conectar con tu servidor local de **LM Studio**. 
Diseñada específicamente para permitir que cualquier persona en tu red local (como tu familia) pueda chatear con tu Inteligencia Artificial desde sus teléfonos o computadoras, sin necesidad de exponer puertos a Internet.

## Características ✨

- **Privacidad total**: Se conecta directamente a la API de LM Studio dentro de tu red local.
- **Diseño Premium**: Interfaz moderna con *glassmorphism* y modo oscuro.
- **Soporte Markdown**: Renderiza listas, código y texto enriquecido correctamente usando `marked.js`.
- **Efecto de Escritura**: Animaciones fluidas ("typing indicator") mientras la IA genera la respuesta.
- **Auto-Configuración**: Detecta automáticamente la IP de tu servidor si se ejecuta en la misma máquina.

## Requisitos Previos 📋

1. **LM Studio**: Instalado en tu PC principal.
2. **Node.js**: Instalado para ejecutar el servidor web ligero.

## Instalación y Uso 🚀

### 1. Configurar LM Studio
1. Abre LM Studio y carga un modelo de tu preferencia.
2. Ve a la pestaña **Local Server**.
3. Asegúrate de configurar el puerto en **`5555`** (o ajusta la configuración desde la interfaz web si usas otro puerto).
4. **IMPORTANTE**: Activa la opción **"CORS"** (Cross-Origin Resource Sharing) en LM Studio. Si no lo haces, la interfaz web no podrá recibir los mensajes.
5. Inicia el servidor haciendo clic en "Start Server".

### 2. Iniciar la Interfaz Web
Abre una terminal en esta carpeta y ejecuta:

```bash
npm install
npm start
```

### 3. Conectarse desde otros dispositivos (Smartphones, Laptops)
El servidor web se iniciará en el puerto **`5556`**. 
Para acceder desde cualquier dispositivo conectado a la misma red WiFi:

1. Averigua la IP local de tu computadora host (por ejemplo, usando `ipconfig` en Windows).
2. Entra en el navegador a: `http://<TU_IP_LOCAL>:5556` (Ejemplo: `http://192.168.1.130:5556`).

## Auto-arranque en Windows (Opcional) ⚙️
Si quieres que esta web esté siempre disponible sin tener que dejar la terminal abierta, crea un archivo `.vbs` en tu carpeta de inicio (`Win+R` -> `shell:startup`):

```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node ""C:\Ruta\Exacta\A\Este\Proyecto\server.js""", 0, false
```
Esto iniciará el servidor de forma silenciosa e invisible cada vez que enciendas tu PC. Solo tendrás que acordarte de encender el servidor de LM Studio cuando quieras chatear.
