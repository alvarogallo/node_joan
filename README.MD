# BOT-WHATSAPP

## Descripción

Esta API permite interactuar con WhatsApp utilizando la librería `whatsapp-web.js`. Ofrece funcionalidades para iniciar sesión, enviar mensajes, gestionar grupos, obtener resultados de la lotería de Medellín y enviar mensajes programados a listas de grupos.

# Notas 
- si ves librerias depercated seguro tengan que ver con las dependencias de Puppeteer, ignoralas si no se resuelven con un npm update
- los mensajes que llegan todos se toman y se reenvian a una api externa, La url de la misma puedes cambiarla en el fichero de whtasappClient.js en la linea 48

## Funcionalidades (Endpoints)

### Autenticación

* `/login` (GET): Inicia sesión en WhatsApp y devuelve un código QR en base64 si es necesario.

### Envío de Mensajes

* `/send` (POST): Envía un mensaje de texto a un número de teléfono.
    * **Cuerpo:** `{"numero": "número", "message": "mensaje"}`

### Gestión de Grupos

* `/groups` (GET): Obtiene la lista de grupos de WhatsApp.
* `/participants` (POST): Obtiene la lista de participantes de un grupo por nombre.
    * **Cuerpo:** `{"groupName": "nombre del grupo"}`
* `/groups` (POST): Agrega un nuevo grupo destino para mensajes programados.
    * **Cuerpo:** `{"nombre": "nombre opcional", "wid": "ID del grupo"}`
* `/groups/:id` (DELETE): Elimina un grupo destino por su ID.

### Gestión de Plantillas de Mensajes

* `/templates` (GET): Obtiene la lista de plantillas de mensajes guardadas.
* `/templates/new` (POST): Crea una nueva plantilla de mensaje.
    * **Cuerpo:** `{"nombre": "nombre de la plantilla", "mensaje": "contenido del mensaje con #placeholders"}`

### Lotería de Medellín

* `/loteriaMedellin` (GET): Obtiene el número ganador de la lotería de Medellín y lo envía usando una plantilla de mensaje (opcionalmente, se puede especificar el nombre de la plantilla por query param `mensaje`).

### Mensajes Programados

* **Automatizado:** Envía un mensaje con el resultado de la lotería de Medellín cada 2 minutos (configurable) a una lista de grupos configurados en la base de datos.

## Tecnologías Utilizadas

* [Node.js](https://nodejs.org/)
* [whatsapp-web.js](https://wwebjs.dev/)
* [Express.js](https://expressjs.com/)
* [node-cron](https://www.npmjs.com/package/node-cron)
* [Knex.js](http://knexjs.org/)
* [SQLite](https://www.sqlite.org/)
* [qrcode](https://www.npmjs.com/package/qrcode)

## Configuración

1.  Asegúrate de tener [Node.js](https://nodejs.org/) y [npm](https://www.npmjs.com/) instalados.
2.  Clona el repositorio o crea un nuevo proyecto e instala las dependencias:
    ```bash
    npm install whatsapp-web.js qrcode qrcode-terminal express node-cron knex sqlite3 --save
    # o
    yarn add whatsapp-web.js qrcode qrcode-terminal express node-cron knex sqlite3
    ```
3.  Configura la base de datos SQLite y Knex.js (ver archivo `knexfile.js`).
4.  Ejecuta las migraciones de la base de datos para crear las tablas:
    ```bash
    npx knex migrate:latest --knexfile knexfile.js
    ```
5.  Opcionalmente, ejecuta las semillas para poblar la base de datos con datos iniciales:
    ```bash
    npx knex seed:run --knexfile knexfile.js
    ```

## Uso

1.  Inicia el servidor: `npm start` o `node index.js`.
2.  Utiliza una herramienta como Postman o curl para interactuar con los endpoints.
3.  No olvides correr las migraciones y semillas para actualizar la base de datos.

## Notas Adicionales

* La sesión de WhatsApp se gestiona utilizando `whatsapp-web.js` con autenticación local.
* Los mensajes programados se ejecutan cada 2 minutos (configurable en `services/cronService.js`).
* La lista de grupos para los mensajes programados se gestiona a través de la tabla `grupos_destino` en la base de datos, accesible mediante los endpoints `/groups`.
* Las plantillas de mensajes se almacenan en la tabla `templateMensajes` y se gestionan mediante los endpoints `/templates` y `/templates/new`.
* Se utiliza un servicio de scraping (`scraperService`) para obtener el número ganador de la lotería de Medellín.
* La lógica para el envío de mensajes de WhatsApp se encuentra en `whatsappClient.js`.
* El servicio de cron se encarga de la ejecución programada de tareas (`cronService.js`).