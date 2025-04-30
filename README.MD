# BOT-WHATSAPP Node.JS

## Descripción

Esta API permite interactuar con WhatsApp utilizando la librería `whatsapp-web.js`. Ofrece funcionalidades para iniciar sesión, enviar mensajes, gestionar grupos, obtener resultados de la lotería de Medellín y enviar mensajes programados (proximamente) a listas de grupos.

## Instalación 👀

Para poner en marcha este proyecto, sigue los pasos a continuación:

1.  Asegúrate de tener [Node.js](https://nodejs.org/) y [npm](https://www.npmjs.com/) instalados en tu sistema. Puedes verificarlos ejecutando `node -v` y `npm -v` en tu terminal.

2.  **Instalar dependencias del sistema para whatsapp-web.js:**
    * **En Ubuntu (para despliegue en producción):** Necesitas instalar algunas librerías necesarias para el funcionamiento del binario de Chrome que utiliza `whatsapp-web.js`. Abre una terminal y ejecuta:
        ```bash
        sudo apt update
        sudo apt install libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libpango-1.0-0 libpangocairo-1.0-0 libasound2t64 --yes
        ```
    * **En otros sistemas operativos (como Windows o macOS) o para desarrollo en Ubuntu:** Estos paquetes específicos de Ubuntu generalmente no son necesarios.

3.  **Instalar Tesseract OCR (el programa):** Este bot utiliza Tesseract para reconocimiento óptico de caracteres (OCR). Es crucial entender que Tesseract es un **programa independiente** que se instala a nivel de tu sistema operativo, no es una librería de Node.js que se instale directamente con `npm install`. La librería de Node.js que usa este bot es un "envoltorio" que simplemente llama a este programa Tesseract instalado.

    La instalación de Tesseract a menudo requiere permisos de administrador porque instala archivos en directorios del sistema (como `C:\Program Files` en Windows). Además, para poder ejecutar el comando `tesseract` desde cualquier ubicación en tu terminal, el directorio donde se instaló Tesseract debe estar añadido a la **variable de entorno PATH** de tu sistema. La mayoría de los métodos de instalación manejan esto, pero es importante verificar.

    También necesitarás los **datos de idioma** (`.traineddata`) para los idiomas que quieres reconocer (como español `spa` e inglés `eng`). Estos archivos se guardan en la carpeta `tessdata` de la instalación de Tesseract y suelen incluirse o ser seleccionables durante el proceso de instalación.

    Elige el método de instalación según tu sistema operativo:

    * **En Ubuntu:** Abre una terminal y ejecuta los siguientes comandos para instalar Tesseract y los datos de idioma español e inglés (puedes agregar otros paquetes `tesseract-ocr-<codigo_idioma>` si los necesitas):
        ```bash
        sudo apt update
        sudo apt install tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng --yes
        ```

    * **En Windows:** La forma más recomendada es usar un gestor de paquetes desde la línea de comandos. **Asegúrate de ejecutar tu Símbolo del sistema (CMD) o PowerShell como Administrador** para evitar problemas de permisos como "Acceso denegado".

        * **Con Winget (Windows 10/11):**
            ```cmd
            winget install TesseractOCR.TesseractOCR
            ```
            Sigue las indicaciones del instalador que aparecerá. Winget normalmente maneja el PATH y los idiomas básicos.
        * **Con Chocolatey (si lo tienes instalado):**
            ```cmd
            choco install tesseract-ocr
            ```
            Chocolatey instalará Tesseract y añadirá la ruta al PATH.
        * **Desde el instalador oficial (.exe):**
            1.  Descarga el instalador para tu arquitectura (32-bit o 64-bit) desde la página de [releases de Tesseract en GitHub](https://github.com/tesseract-ocr/tesseract/releases).
            2.  **Ejecuta el archivo descargado `tesseract-ocr-*-setup-*.exe` como Administrador** (clic derecho -> "Ejecutar como administrador").
            3.  Durante la instalación, asegúrate de **seleccionar los idiomas** que necesitas instalar.
            4.  Verifica que la opción "Add tesseract to path" (o similar) esté marcada si está disponible, o considera añadir la ruta de instalación (ej: `C:\Program Files\Tesseract-OCR`) a la variable de entorno PATH manualmente después de la instalación.

    * **Verifica la instalación de Tesseract:** Abre una **nueva** terminal (CMD, PowerShell o Bash, ejecutada normalmente si ya instalaste como administrador) y ejecuta:
        ```bash
        tesseract --version
        ```
        Si la instalación fue exitosa y el PATH está configurado, verás la versión instalada. Si no lo reconoce, revisa la variable PATH de tu sistema.

4.  **Clona el repositorio e instala las dependencias de Node.js:** Clona este repositorio y navega al directorio del proyecto. Luego ejecuta el siguiente comando:
    ```bash
    git clone <URL_DE_TU_REPOSITORIO>
    cd <nombre_del_directorio_del_proyecto>
    npm install
    ```

5.  **Prepara la base de datos:** Ejecuta el siguiente comando para configurar la base de datos (ajusta según tu configuración de base de datos en el proyecto):
    ```bash
    npm run db:prepare
    ```

6.  **Ejecuta el servidor:** Finalmente, inicia el bot con el comando:
    ```bash
    npm run dev
    ```

¡Listo! El bot debería estar funcionando. Asegúrate de haber configurado correctamente las variables de entorno u archivos de configuración necesarios para tu bot (como credenciales de WhatsApp, configuración de base de datos, etc.).

Para poner en marcha este proyecto, sigue los pasos a continuación:

1.  Asegúrate de tener [Node.js](https://nodejs.org/) y [npm](https://www.npmjs.com/) instalados en tu sistema. Puedes verificarlos ejecutando `node -v` y `npm -v` en tu terminal.

2.  **Instalar dependencias del sistema:**
    * **En Ubuntu (para despliegue en producción):** Necesitas instalar algunas librerías necesarias para el funcionamiento del binario de Chrome que utiliza `whatsapp-web.js`. Abre una terminal y ejecuta:
        ```bash
        sudo apt update
        sudo apt install libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libpango-1.0-0 libpangocairo-1.0-0 libasound2t64 --yes
        ```
    * **En otros sistemas operativos (como Windows o macOS) o para desarrollo en Ubuntu:** Estos paquetes específicos de Ubuntu generalmente no son necesarios.

3.  **Instalar Tesseract OCR:** Este bot utiliza Tesseract para reconocimiento óptico de caracteres (OCR). Debes instalar el programa Tesseract en tu sistema.

    * **En Ubuntu:** Abre una terminal y ejecuta los siguientes comandos para instalar Tesseract y los datos de idioma español e inglés (puedes agregar otros si los necesitas):
        ```bash
        sudo apt update
        sudo apt install tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng --yes
        ```
    * **En Windows:** La forma más recomendada es usar un gestor de paquetes desde la línea de comandos:
        * **Con Winget (Windows 10/11):** Abre el Símbolo del sistema (CMD) o PowerShell y ejecuta:
            ```cmd
            winget install TesseractOCR.TesseractOCR
            ```
            Sigue las indicaciones del instalador.
        * **Con Chocolatey (si lo tienes instalado):** Abre el Símbolo del sistema (CMD) como administrador y ejecuta:
            ```cmd
            choco install tesseract-ocr
            ```
            Sigue las indicaciones de Chocolatey.
        * **Desde el instalador oficial (.exe):** Descarga el instalador desde las [releases de Tesseract en GitHub](https://github.com/tesseract-ocr/tesseract/releases) y ejecútalo manualmente o desde CMD navegando hasta la carpeta de descarga y ejecutando el `.exe` (ej: `tesseract-ocr-w64-setup-X.Y.Z.exe`). Asegúrate de seleccionar los idiomas que necesitas durante la instalación.

    * **Verifica la instalación de Tesseract:** Abre una nueva terminal (CMD, PowerShell o Bash) y ejecuta:
        ```bash
        tesseract --version
        ```
        Debería mostrar la versión instalada. Si no lo reconoce, asegúrate de que el directorio de instalación de Tesseract esté añadido a la variable de entorno PATH de tu sistema.

4.  **Clona el repositorio e instala las dependencias de Node.js:** Clona este repositorio y navega al directorio del proyecto. Luego ejecuta el siguiente comando:
    ```bash
    git clone <URL_DE_TU_REPOSITORIO>
    cd <nombre_del_directorio_del_proyecto>
    npm install
    ```

5.  **Prepara la base de datos:** Ejecuta el siguiente comando para configurar la base de datos (ajusta según tu configuración de base de datos en el proyecto):
    ```bash
    npm run db:prepare
    ```

6.  **Ejecuta el servidor:** Finalmente, inicia el bot con el comando:
    ```bash
    npm run dev
    ```

¡Listo! El bot debería estar funcionando. Asegúrate de haber configurado correctamente las variables de entorno u archivos de configuración necesarios para tu bot (como credenciales de WhatsApp, configuración de base de datos, etc.).



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


## Notas Adicionales

* La sesión de WhatsApp se gestiona utilizando `whatsapp-web.js` con autenticación local.
* Los mensajes programados se ejecutan cada 2 minutos (configurable en `services/cronService.js`).
* La lista de grupos para los mensajes programados se gestiona a través de la tabla `grupos_destino` en la base de datos, accesible mediante los endpoints `/grupos`.
* Las plantillas de mensajes se almacenan en la tabla `templateMensajes` y se gestionan mediante los endpoints `/templates` y `/templates/new`.
* Se utiliza un servicio de scraping (`scraperService`) para obtener el número ganador de la lotería de Medellín.
* La lógica para el envío de mensajes de WhatsApp se encuentra en `whatsappClient.js`.
* El servicio de cron se encarga de la ejecución programada de tareas (`cronService.js`).

# Notas de desarrollo

Objeto msg que devuelve la libreria, por ejemplo cuando es un mensaje de tipo imagen...
```
Message {
  _data: {
    id: {
      fromMe: false,
      remote: '120363049554179074@g.us',
      id: '971A065CB3269D647E33F68F15CB3817',
      participant: '584263268707@c.us',
      _serialized: 'false_120363049554179074@g.us_971A065CB3269D647E33F68F15CB3817_584263268707@c.us'
    },
    viewed: false,
    body: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAIAMBIgACEQEDEQH/xAAvAAEBAAMBAQAAAAAAAAAAAAAABAEDBQIGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD5kAF/rs4s4evs01JTPuhjzsx14SRrnRmYAAf/xAAlEAACAgIBAgYDAAAAAAAAAAABAgAEAxESITEFExUiMFEjQWL/2gAIAQEAAT8A+D06wF5EDUHhllhsARqFhQdrFq5WOgJadfIRPuV2IyKA3TjGfNy0QdbgC/rXaXPaUaVvzAsenGZGJU/UwAtkXZlxGbNsdtyopxMyt3Mz9G4ykAcy/wAxrthu7Q3M+weUezmyHbNMVvNiO0b4f//EABsRAQACAgMAAAAAAAAAAAAAAAEAAhASICEx/9oACAECAQE/AMW6skA2CKIq+sDVHj//xAAcEQEAAgIDAQAAAAAAAAAAAAABAAIRURASICH/2gAIAQMBAT8A4r9qMc9bW0QEwaJZzVN+f//Z',
    type: 'image',
    t: 1745513593,
    notifyName: 'aleisagodma',
    from: '120363049554179074@g.us',
    to: '584145057588@c.us',
    author: '584263268707@c.us',
    ack: 1,
    invis: false,
    isNewMsg: true,
    star: false,
    kicNotified: false,
    recvFresh: true,
    caption: '🥳🥳🥳 ATENCIÓN ATENCIÓN LLEVATE 3 BLUSITAS POR 10$. SON TALLA UNICA (S Y M) TENEMOS VARIEDAD DE COLORES. INF AL PRIVADOOO...',
    interactiveAnnotations: [],
    deprecatedMms3Url: 'https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m234/AQM1kNSqbtW9EegW2-gt5CAIl2mQb5sr4TJuF59UFcvuWDq0duOs4h4bFa5xXBmbUi7CBsRYzlSLC06QtywIxXErvTWedsdgE-farE0mdA?ccb=9-4&oh=01_Q5Aa1QHryABQfGnYfVvjxiPtnXPLxI8_O0yYhBYZ0XY_V8pUtw&oe=6831CB3C&_nc_sid=e6ed6c&mms3=true',
    directPath: '/o1/v/t62.7118-24/f2/m234/AQM1kNSqbtW9EegW2-gt5CAIl2mQb5sr4TJuF59UFcvuWDq0duOs4h4bFa5xXBmbUi7CBsRYzlSLC06QtywIxXErvTWedsdgE-farE0mdA?ccb=9-4&oh=01_Q5Aa1QHryABQfGnYfVvjxiPtnXPLxI8_O0yYhBYZ0XY_V8pUtw&oe=6831CB3C&_nc_sid=e6ed6c',
    mimetype: 'image/jpeg',
    filehash: 't+uDXjBTzzAD5iTSqyFWEnTT9F1CmopbN344PumXsUk=',
    encFilehash: 'iMsytKmKBL5HPiVOmw3T29ZV4l7o+kpfaN+ouPyeylE=',
    size: 31475,
    mediaKey: 'ADrDCRJdxQWvOIGQhvWKMhcAt2nC4ZjEV0x+AdEWO88=',
    mediaKeyTimestamp: 1745513260,
    isViewOnce: false,
    width: 486,
    height: 1080,
    staticUrl: '',
    scanLengths: [ 4005, 13367, 5873, 8230 ],
    scansSidecar: {},
    isFromTemplate: false,
    pollInvalidated: false,
    isSentCagPollCreation: false,
    latestEditMsgKey: null,
    latestEditSenderTimestampMs: null,
    mentionedJidList: [],
    groupMentions: [],
    isEventCanceled: false,
    eventInvalidated: false,
    statusMentioned: false,
    isVcardOverMmsDocument: false,
    isForwarded: false,
    hasReaction: false,
    parentMsgKey: {
      fromMe: false,
      remote: '120363049554179074@g.us',
      id: '36E266247E101094C380F9636A11792B',
      participant: '584263268707@c.us',
      _serialized: 'false_120363049554179074@g.us_36E266247E101094C380F9636A11792B_584263268707@c.us'
    },
    associationType: 'MEDIA_ALBUM',
    viewMode: 'MEDIA_ALBUM',
    messageSecret: {
      '0': 136,
      '1': 87,
      '2': 152,
      '3': 217,
      '4': 194,
      '5': 210,
      '6': 120,
      '7': 31,
      '8': 67,
      '9': 79,
      '10': 188,
      '11': 167,
      '12': 41,
      '13': 253,
      '14': 53,
      '15': 122,
      '16': 228,
      '17': 125,
      '18': 194,
      '19': 181,
      '20': 234,
      '21': 128,
      '22': 83,
      '23': 218,
      '24': 46,
      '25': 51,
      '26': 242,
      '27': 112,
      '28': 179,
      '29': 11,
      '30': 191,
      '31': 194
    },
    productHeaderImageRejected: false,
    lastPlaybackProgress: 0,
    isDynamicReplyButtonsMsg: false,
    isCarouselCard: false,
    parentMsgId: null,
    callSilenceReason: null,
    isVideoCall: false,
    callDuration: null,
    callParticipants: null,
    isMdHistoryMsg: false,
    stickerSentTs: 0,
    isAvatar: false,
    lastUpdateFromServerTs: 0,
    invokedBotWid: null,
    bizBotType: null,
    botResponseTargetId: null,
    botPluginType: null,
    botPluginReferenceIndex: null,
    botPluginSearchProvider: null,
    botPluginSearchUrl: null,
    botPluginSearchQuery: null,
    botPluginMaybeParent: false,
    botReelPluginThumbnailCdnUrl: null,
    botMessageDisclaimerText: null,
    botMsgBodyType: null,
    reportingTokenInfo: { reportingToken: [Object], version: 1, reportingTag: [Object] },
    requiresDirectConnection: null,
    bizContentPlaceholderType: null,
    hostedBizEncStateMismatch: false,
    senderOrRecipientAccountTypeHosted: false,
    placeholderCreatedWhenAccountIsHosted: false,
    links: []
  },
  mediaKey: 'ADrDCRJdxQWvOIGQhvWKMhcAt2nC4ZjEV0x+AdEWO88=',
  id: {
    fromMe: false,
    remote: '120363049554179074@g.us',
    id: '971A065CB3269D647E33F68F15CB3817',
    participant: '584263268707@c.us',
    _serialized: 'false_120363049554179074@g.us_971A065CB3269D647E33F68F15CB3817_584263268707@c.us'
  },
  ack: 1,
  hasMedia: true,
  body: '🥳🥳🥳 ATENCIÓN ATENCIÓN LLEVATE 3 BLUSITAS POR 10$. SON TALLA UNICA (S Y M) TENEMOS VARIEDAD DE COLORES. INF AL PRIVADOOO...',
  type: 'image',
  timestamp: 1745513593,
  from: '120363049554179074@g.us',
  to: '584145057588@c.us',
  author: '584263268707@c.us',
  deviceType: 'android',
  isForwarded: false,
  forwardingScore: 0,
  isStatus: false,
  isStarred: false,
  broadcast: undefined,
  fromMe: false,
  hasQuotedMsg: false,
  hasReaction: false,
  duration: undefined,
  location: undefined,
  vCards: [],
  inviteV4: undefined,
  mentionedIds: [],
  groupMentions: [],
  orderId: undefined,
  token: undefined,
  isGif: false,
  isEphemeral: undefined,
  links: []
}
```