# BOT-WHATSAPP Node.JS

## Descripción

Esta API permite interactuar con WhatsApp utilizando la librería `whatsapp-web.js`. Ofrece funcionalidades para iniciar sesión, enviar mensajes, gestionar grupos, obtener resultados de la lotería de Medellín y enviar mensajes programados (proximamente) a listas de grupos.

## Instalación Rápida 🚀

Para poner en marcha este proyecto, sigue estos pasos:

1.  **Preparación Inicial:**
    * Asegúrate de tener [Node.js](https://nodejs.org/) y [npm](https://www.npmjs.com/) instalados (`node -v`, `npm -v`).
    * **En Ubuntu (para despliegue):** Instala dependencias del sistema para `whatsapp-web.js`:
        ```bash
        sudo apt update && sudo apt install libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libpango-1.0-0 libpangocairo-1.0-0 libasound2t64 --yes
        ```

2.  **Instalar Tesseract OCR (Programa de Sistema):**
    Tesseract es necesario para el OCR. **Debes instalar el programa a nivel de sistema.** La librería Node.js lo usa internamente.

    * **En Ubuntu:**
        ```bash
        sudo apt update && sudo apt install tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng --yes
        ```
    * **En Windows:**
        * **Opción Recomendada (CMD/PowerShell - Ejecutar como Administrador):**
            * Con Winget: `winget install TesseractOCR.TesseractOCR`
            * Con Chocolatey: `choco install tesseract-ocr`
        * **Opción Manual (Instalador - Ejecutar como Administrador):**
            * Descarga el .exe: [https://github.com/tesseract-ocr/tesseract/releases/download/5.5.0/tesseract-ocr-w64-setup-5.5.0.20241111.exe](https://github.com/tesseract-ocr/tesseract/releases/download/5.5.0/tesseract-ocr-w64-setup-5.5.0.20241111.exe)
            * Ejecuta el .exe **como Administrador**. Selecciona el idioma español.
        * **Verifica la instalación:** Abre una nueva terminal y ejecuta `tesseract --version`.

3.  **Configurar Idioma Español (si falta):**
    Si después de instalar Tesseract, el español (`spa.traineddata`) no funciona o falta en la carpeta `tessdata` de tu instalación de Tesseract en el sistema, puedes copiarlo manualmente usando un script.
    * Asegúrate de tener `spa.traineddata` y colócalo en la carpeta `./data/` en la raíz de este proyecto.
    * **🚨 ¡IMPORTANTE! Este paso requiere ejecutar la terminal como Administrador (Windows) o usar Sudo (Ubuntu).**

    * **En Windows (CMD/PowerShell - Ejecutar como Administrador):**
        ```bash
        npm run ocr:config:win
        ```
    * **En Ubuntu (Terminal normal):**
      PROXIMAMENTE:
    *(Estos scripts asumen rutas de instalación estándar de Tesseract. Puede que necesites ajustarlos si tu instalación es diferente.)*

4.  **Configurar Proyecto:**
    * Clona el repositorio (si no lo hiciste): `git clone <URL_DE_TU_REPOSITORIO>`
    * Navega al directorio: `cd <nombre_del_directorio_del_proyecto>`
    * Instala dependencias Node.js: `npm install`
    * Prepara la base de datos: `npm run db:prepare`

5.  **Ejecutar Bot:**
    * Inicia el servidor: `npm run dev`

Asegúrate de configurar las variables de entorno o archivos de configuración necesarios para tu bot.



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