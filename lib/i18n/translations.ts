export type Language = 'es' | 'en';

const es = {
  // === COMMON ===
  'common.cancel': 'Cancelar',
  'common.confirm': 'Confirmar',
  'common.delete': 'Eliminar',
  'common.save': 'Guardar',
  'common.copy': 'Copiar',
  'common.copied': 'Copiado',
  'common.share': 'Compartir',
  'common.back': 'Volver',
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.create': 'Crear',
  'common.creating': 'Creando...',
  'common.add': 'Agregar',
  'common.adding': 'Agregando...',

  // === ACCESS PAGE ===
  'access.tagline': 'Listas compartidas, sin cuentas.',
  'access.subtitle':
    'Crea un espacio, recibe 5 palabras, comparte con quien quieras. Mismo espacio al instante.',
  'access.useCase1':
    'La lista de la compra compartida entre tú, tu pareja y la suegra. Sin grupos de WhatsApp.',
  'access.useCase2':
    'El plan del viaje con amigos. Sin ese hilo de 200 mensajes.',
  'access.useCase3':
    'Lo que falta en la nevera. Aunque tu compañero de piso llegue al súper y solo compre pizza.',
  'access.illustrationAlt':
    'Gallina 1 crea una lista, comparte 5 palabras, gallina 2 accede al mismo espacio',
  'access.howItWorks': 'Cómo funciona',
  'access.step1Title': 'Crea tu espacio',
  'access.step1Desc':
    'Un click. Recibes 5 palabras únicas que son tu cuenta. Sin email, sin contraseña.',
  'access.step2Title': 'Vuelve cuando quieras',
  'access.step2Desc':
    'Introduce tus 5 palabras en cualquier dispositivo y están todas tus listas.',
  'access.step3Title': 'Comparte el espacio',
  'access.step3Desc':
    'Dale las mismas 5 palabras a tu pareja, compañero de piso o quien quieras. Entran al mismo espacio exacto. Mismas listas, en tiempo real. Sin invitaciones, sin cuentas adicionales.',
  'access.warningTitle': 'Guarda tus palabras',
  'access.warningDesc':
    'Si las pierdes no hay recuperación posible. Guarda tus palabras al crear el espacio o hazte una foto de la pantalla.',
  'access.privacy': 'Tus datos están seguros y son privados',

  // === DASHBOARD ===
  'dashboard.help': 'Ayuda',
  'dashboard.helpTitle': '¿Cómo funciona?',
  'dashboard.settings': 'Configuración',
  'dashboard.logout': 'Salir',
  'dashboard.myLists': 'Mis Listas',
  'dashboard.listSingular': 'LISTA',
  'dashboard.listPlural': 'LISTAS',
  'dashboard.prevPage': 'Anterior',
  'dashboard.nextPage': 'Siguiente',
  'dashboard.page': 'Página {{current}} de {{total}}',
  'dashboard.coffee': '¿Te está siendo útil Pollo?',
  'dashboard.buyMeCoffee': '☕ Invítame a un café',
  'dashboard.logoutTitle': 'Salir',
  'dashboard.logoutMessage': '¿Realmente quieres salir de tus listas?',
  'dashboard.logoutConfirm': 'Salir',
  'dashboard.logoutCancel': 'Quedarse',
  'dashboard.listCreated': 'Lista "{{name}}" creada',
  'dashboard.errorCreate': 'Error al crear lista',
  'dashboard.listDeleted': 'Lista eliminada',
  'dashboard.errorDelete': 'Error al eliminar lista',

  // === LIST PAGE ===
  'list.back': 'Volver',
  'list.todoCount': '{{count}} POR HACER',
  'list.emptyTitle': 'No hay elementos en esta lista',
  'list.emptyDesc': 'Agrega el primero usando el formulario arriba',
  'list.pending': '{{count}} PENDIENTES',
  'list.completed': '{{count}} / {{total}} COMPLETADOS',
  'list.itemAdded': 'Item agregado',
  'list.errorAdd': 'Error al agregar item',
  'list.errorUpdate': 'Error al actualizar item',
  'list.itemDeleted': 'Item eliminado',
  'list.errorDelete': 'Error al eliminar item',

  // === SETTINGS PAGE ===
  'settings.title': 'CONFIGURACIÓN',
  'settings.subtitle': 'Gestiona tu espacio',
  'settings.back': 'Volver',
  'settings.loading': 'Cargando...',

  // === CREATE WORKSPACE FORM ===
  'createWorkspace.title': 'Crear Espacio',
  'createWorkspace.desc':
    'Te damos 5 palabras mágicas. Con ellas accedes, y también puedes compartir el espacio con quien quieras.',
  'createWorkspace.creating': 'Creando...',
  'createWorkspace.create': 'Crear',
  'createWorkspace.ready': 'Tu espacio está listo',
  'createWorkspace.readyDesc': 'Guarda estas palabras — son tu llave',
  'createWorkspace.ticket5words': 'tus 5 palabras mágicas',
  'createWorkspace.photo': 'Hazte una foto de esta pantalla',
  'createWorkspace.yourAccess': 'Tu acceso',
  'createWorkspace.yourAccessDesc': 'Úsalas para volver siempre',
  'createWorkspace.shareTitle': 'Compártelas',
  'createWorkspace.shareDesc': 'Mismo espacio al instante',
  'createWorkspace.saveWords': 'Guardar mis palabras',
  'createWorkspace.done': 'Listo',
  'createWorkspace.enterSaved': 'Ya las guardé, entrar',
  'createWorkspace.warningTitle': 'Un momento',
  'createWorkspace.warningDesc':
    'Si las pierdes no hay recuperación posible',
  'createWorkspace.yourWords': 'tus palabras',
  'createWorkspace.saveBefore': 'Guardar palabras antes de entrar',
  'createWorkspace.enterWithout': 'Entrar sin guardar',
  'createWorkspace.backBtn': 'Volver',
  'createWorkspace.errorCreate': 'Error al crear workspace',
  'createWorkspace.errorUnknown': 'Error desconocido',
  'createWorkspace.wordsCopied': 'Palabras copiadas',
  'createWorkspace.errorCopy': 'Error al copiar',
  'createWorkspace.shareMsg':
    'Aquí tienes las palabras para entrar a nuestro espacio en Pollo:\n\n{{passphrase}}\n\n{{url}}',
  'createWorkspace.msgCopied': 'Mensaje copiado — pégalo donde quieras',
  'createWorkspace.backupDownloaded': 'Backup descargado',
  'createWorkspace.backupError': 'Error al descargar el backup',

  // === ACCESS WORKSPACE FORM ===
  'accessWorkspace.title': 'Acceder',
  'accessWorkspace.desc': 'Introduce tus 5 palabras para acceder.',
  'accessWorkspace.placeholder':
    'palabra palabra palabra palabra palabra',
  'accessWorkspace.verifying': 'Verificando...',
  'accessWorkspace.access': 'Acceder',
  'accessWorkspace.successToast': 'Acceso exitoso',
  'accessWorkspace.rateLimitError':
    'Demasiados intentos. Intenta de nuevo en 15 minutos.',
  'accessWorkspace.invalidError': 'Passphrase inválida',
  'accessWorkspace.unknownError': 'Error desconocido',

  // === PASSPHRASE MANAGER ===
  'passphraseManager.title': 'Tus Palabras de Acceso',
  'passphraseManager.notAvailable': 'Palabras no disponibles',
  'passphraseManager.notFoundAlert':
    '⚠️ No encontramos tus palabras de acceso. Esto ocurre cuando cierras la sesión o refrescas la página.',
  'passphraseManager.notFoundDesc':
    'Para acceder nuevamente, utiliza las palabras que guardaste en tu archivo de backup (pollo-backup-*.txt).',
  'passphraseManager.subtitle':
    '5 palabras mágicas para entrar a tu espacio',
  'passphraseManager.label': 'Passphrase',
  'passphraseManager.hide': 'Ocultar',
  'passphraseManager.show': 'Mostrar',
  'passphraseManager.copied': 'Copiado',
  'passphraseManager.copy': 'Copiar',
  'passphraseManager.wordsCopied': 'Palabras copiadas al portapapeles',
  'passphraseManager.errorCopy': 'Error al copiar',

  // === LISTS GRID ===
  'listsGrid.newList': 'Nueva lista',
  'listsGrid.listNamePlaceholder': 'Nombre de la lista...',
  'listsGrid.errorCreate': 'Error al crear lista',

  // === LIST CARD ===
  'listCard.todoLabel': 'POR HACER',
  'listCard.completedLabel': 'COMPLETADOS',
  'listCard.moreItems': '+{{count}} más...',
  'listCard.deleteTitle': 'Eliminar lista',
  'listCard.deleteMessage':
    '¿Eliminar "{{name}}"? Esta acción no se puede deshacer.',
  'listCard.deleteConfirm': 'Eliminar',
  'listCard.deleteCancel': 'Cancelar',

  // === CREATE LIST FORM ===
  'createList.title': 'Crear Nueva Lista',
  'createList.placeholder': 'Nombre de la lista (ej: Supermercado)',
  'createList.emptyError':
    'El nombre de la lista no puede estar vacío',
  'createList.errorCreate': 'Error al crear lista',
  'createList.creating': 'Creando...',
  'createList.create': 'Crear',
  'createList.cancel': 'Cancelar',

  // === ADD ITEM FORM ===
  'addItem.placeholder': 'Agregar item...',
  'addItem.adding': 'Agregando...',
  'addItem.add': 'Agregar',
  'addItem.emptyError': 'El nombre del item no puede estar vacío',
  'addItem.addError': 'Error al agregar item',

  // === ITEM LIST ===
  'itemList.noItems': 'No hay items aún',
  'itemList.addFirst': 'Agrega tu primer item arriba',
  'itemList.toDo': 'Por Hacer ({{count}})',
  'itemList.completed': 'Completados ({{count}})',

  // === ITEM CARD ===
  'itemCard.doubleClickEdit': 'Doble-click para editar',
  'itemCard.deleteTitle': 'Eliminar item',
  'itemCard.deleteMessage':
    '¿Eliminar "{{name}}"? Esta acción no se puede deshacer.',
  'itemCard.deleteConfirm': 'Eliminar',
  'itemCard.deleteCancel': 'Cancelar',

  // === HOW IT WORKS MODAL ===
  'howItWorks.title': 'Cómo funciona',
  'howItWorks.s1Title': 'Tus 5 palabras son tu cuenta',
  'howItWorks.s1Subtitle': 'Sin registro. Sin email. Sin contraseña.',
  'howItWorks.s1p1':
    'Cuando creas un espacio, Pollo genera 5 palabras aleatorias únicas para ti.',
  'howItWorks.s1p2':
    'Esas palabras son tu cuenta. Para volver a entrar, introdúcelas en la pantalla de acceso — desde cualquier dispositivo, en cualquier momento.',
  'howItWorks.s1p3':
    'Si las pierdes, no hay recuperación posible. Guárdalas bien.',
  'howItWorks.s1enterLabel': 'Entrar',
  'howItWorks.s1enterDesc': 'Escribe tus 5 palabras',
  'howItWorks.s1accessLabel': 'Accedes',
  'howItWorks.s1accessDesc': 'A todas tus listas',
  'howItWorks.s2Title': 'Compartir es igual de fácil',
  'howItWorks.s2Subtitle': 'Sin invitaciones. Sin permisos. Sin cuentas.',
  'howItWorks.s2p1':
    'Dale tus 5 palabras a tu pareja, compañero de piso o quien quieras. Cuando las introduzcan, acceden al mismo espacio que tú — las mismas listas, en tiempo real.',
  'howItWorks.s2p2':
    'Ideal para la lista de la compra, tareas del hogar, o cualquier cosa que gestiones con alguien.',
  'howItWorks.s2youLabel': 'Tú',
  'howItWorks.s2youDesc': 'Compartes las palabras',
  'howItWorks.s2themLabel': 'Ellos',
  'howItWorks.s2themDesc': 'Mismo espacio al instante',
  'howItWorks.s3Title': 'Guarda tus palabras',
  'howItWorks.s3Subtitle': 'Sin recuperación si las pierdes.',
  'howItWorks.s3p1':
    'Descarga el backup al crear el espacio, o recupéralo en cualquier momento desde Configuración.',
  'howItWorks.s3p2':
    'Guárdalo en la nube (Drive, iCloud) o hazte una foto de las palabras.',
  'howItWorks.s4Title': 'Instálala como app',
  'howItWorks.s4Subtitle': 'Sin descargas. Sin tienda de apps.',
  'howItWorks.s4p1': 'Pollo funciona como una app nativa desde el navegador. Puedes instalarla en la pantalla de inicio de tu móvil:',
  'howItWorks.s4ios': 'Pulsa el botón compartir (el cuadrado con flecha hacia arriba) y luego "Añadir a pantalla de inicio".',
  'howItWorks.s4android': 'Pulsa el menú (tres puntos arriba a la derecha) y luego "Instalar aplicación" o "Añadir a pantalla de inicio".',
  'howItWorks.s4p2': 'Se abre a pantalla completa, sin barra del navegador. Como una app de verdad.',

  // === LEGAL PAGE ===
  'legal.title': 'Privacidad y condiciones',
  'legal.back': 'Volver',
  'legal.privacyTitle': 'Privacidad',
  'legal.privacyP1': 'Pollo no recoge datos personales. No hay cuentas, no hay emails, no hay nombres. No sabemos quién eres y así es como debe ser.',
  'legal.privacyP2': 'La única cookie que usamos es la de sesión, estrictamente necesaria para que la app funcione. No hay cookies de analytics, de publicidad ni de terceros.',
  'legal.privacyP3': 'Las direcciones IP se registran temporalmente para protección contra fuerza bruta y se eliminan automáticamente en 24 horas.',
  'legal.dataTitle': 'Tus datos',
  'legal.dataP1': 'Las únicas cosas que se almacenan en nuestro servidor son: tus listas, tus items, y un hash de tu passphrase. Nada más.',
  'legal.dataP2': 'Tu passphrase nunca se almacena en texto plano. Solo se guardan derivados criptográficos (bcrypt + HMAC) que no permiten recuperar las palabras originales.',
  'legal.dataP3': 'Si pierdes tu passphrase, pierdes el acceso. No podemos recuperarlo porque no tenemos forma de saber que era tuyo.',
  'legal.trackingTitle': 'Tracking',
  'legal.trackingP1': 'Cero. No hay Google Analytics, ni pixels de Facebook, ni herramientas de tracking de ningún tipo. No se envían datos a terceros.',
  'legal.openSourceTitle': 'Código abierto',
  'legal.openSourceP1': 'El código fuente completo está disponible en GitHub. Puedes verificar todo lo que se dice aquí leyendo el código.',
  'legal.licenseTitle': 'Licencia',
  'legal.licenseP1': 'MIT — usa, modifica y distribuye libremente.',
  'legal.authorTitle': 'Autor',
  'legal.authorP1': 'Hecho por patatapython.',
} as const;

const en: Record<keyof typeof es, string> = {
  // === COMMON ===
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'common.copy': 'Copy',
  'common.copied': 'Copied',
  'common.share': 'Share',
  'common.back': 'Back',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.create': 'Create',
  'common.creating': 'Creating...',
  'common.add': 'Add',
  'common.adding': 'Adding...',

  // === ACCESS PAGE ===
  'access.tagline': 'Shared lists, no accounts.',
  'access.subtitle':
    'Create a space, get 5 words, share with anyone. Same space instantly.',
  'access.useCase1':
    'The grocery list shared between you, your partner and the in-laws. No WhatsApp groups.',
  'access.useCase2':
    'The trip plan with friends. Without that 200-message thread.',
  'access.useCase3':
    "What's missing in the fridge. Even if your roommate goes to the store and only buys pizza.",
  'access.illustrationAlt':
    'Chicken 1 creates a list, shares 5 words, chicken 2 accesses the same space',
  'access.howItWorks': 'How it works',
  'access.step1Title': 'Create your space',
  'access.step1Desc':
    'One click. You get 5 unique words that are your account. No email, no password.',
  'access.step2Title': 'Come back anytime',
  'access.step2Desc':
    'Enter your 5 words on any device and all your lists are there.',
  'access.step3Title': 'Share the space',
  'access.step3Desc':
    'Give the same 5 words to your partner, roommate or anyone you want. They enter the exact same space. Same lists, in real time. No invitations, no extra accounts.',
  'access.warningTitle': 'Save your words',
  'access.warningDesc':
    'If you lose them there is no recovery possible. Save your words when creating the space or take a screenshot.',
  'access.privacy': 'Your data is safe and private',

  // === DASHBOARD ===
  'dashboard.help': 'Help',
  'dashboard.helpTitle': 'How does it work?',
  'dashboard.settings': 'Settings',
  'dashboard.logout': 'Sign out',
  'dashboard.myLists': 'My Lists',
  'dashboard.listSingular': 'LIST',
  'dashboard.listPlural': 'LISTS',
  'dashboard.prevPage': 'Previous',
  'dashboard.nextPage': 'Next',
  'dashboard.page': 'Page {{current}} of {{total}}',
  'dashboard.coffee': 'Is Pollo useful to you?',
  'dashboard.buyMeCoffee': '☕ Buy me a coffee',
  'dashboard.logoutTitle': 'Sign out',
  'dashboard.logoutMessage': 'Do you really want to leave your lists?',
  'dashboard.logoutConfirm': 'Sign out',
  'dashboard.logoutCancel': 'Stay',
  'dashboard.listCreated': 'List "{{name}}" created',
  'dashboard.errorCreate': 'Error creating list',
  'dashboard.listDeleted': 'List deleted',
  'dashboard.errorDelete': 'Error deleting list',

  // === LIST PAGE ===
  'list.back': 'Back',
  'list.todoCount': '{{count}} TO DO',
  'list.emptyTitle': 'No items in this list',
  'list.emptyDesc': 'Add the first one using the form above',
  'list.pending': '{{count}} PENDING',
  'list.completed': '{{count}} / {{total}} COMPLETED',
  'list.itemAdded': 'Item added',
  'list.errorAdd': 'Error adding item',
  'list.errorUpdate': 'Error updating item',
  'list.itemDeleted': 'Item deleted',
  'list.errorDelete': 'Error deleting item',

  // === SETTINGS PAGE ===
  'settings.title': 'SETTINGS',
  'settings.subtitle': 'Manage your space',
  'settings.back': 'Back',
  'settings.loading': 'Loading...',

  // === CREATE WORKSPACE FORM ===
  'createWorkspace.title': 'Create Space',
  'createWorkspace.desc':
    'We give you 5 magic words. Use them to access, and also to share the space with anyone you want.',
  'createWorkspace.creating': 'Creating...',
  'createWorkspace.create': 'Create',
  'createWorkspace.ready': 'Your space is ready',
  'createWorkspace.readyDesc': 'Save these words — they are your key',
  'createWorkspace.ticket5words': 'your 5 magic words',
  'createWorkspace.photo': 'Take a screenshot of this screen',
  'createWorkspace.yourAccess': 'Your access',
  'createWorkspace.yourAccessDesc': 'Use them to always come back',
  'createWorkspace.shareTitle': 'Share them',
  'createWorkspace.shareDesc': 'Same space instantly',
  'createWorkspace.saveWords': 'Save my words',
  'createWorkspace.done': 'Done',
  'createWorkspace.enterSaved': 'I saved them, enter',
  'createWorkspace.warningTitle': 'Wait a moment',
  'createWorkspace.warningDesc':
    'If you lose them there is no recovery possible',
  'createWorkspace.yourWords': 'your words',
  'createWorkspace.saveBefore': 'Save words before entering',
  'createWorkspace.enterWithout': 'Enter without saving',
  'createWorkspace.backBtn': 'Back',
  'createWorkspace.errorCreate': 'Error creating workspace',
  'createWorkspace.errorUnknown': 'Unknown error',
  'createWorkspace.wordsCopied': 'Words copied',
  'createWorkspace.errorCopy': 'Error copying',
  'createWorkspace.shareMsg':
    'Here are the words to enter our shared space in Pollo:\n\n{{passphrase}}\n\n{{url}}',
  'createWorkspace.msgCopied': 'Message copied — paste it wherever you want',
  'createWorkspace.backupDownloaded': 'Backup downloaded',
  'createWorkspace.backupError': 'Error downloading backup',

  // === ACCESS WORKSPACE FORM ===
  'accessWorkspace.title': 'Access',
  'accessWorkspace.desc': 'Enter your 5 words to access.',
  'accessWorkspace.placeholder': 'word word word word word',
  'accessWorkspace.verifying': 'Verifying...',
  'accessWorkspace.access': 'Access',
  'accessWorkspace.successToast': 'Access successful',
  'accessWorkspace.rateLimitError':
    'Too many attempts. Try again in 15 minutes.',
  'accessWorkspace.invalidError': 'Invalid passphrase',
  'accessWorkspace.unknownError': 'Unknown error',

  // === PASSPHRASE MANAGER ===
  'passphraseManager.title': 'Your Access Words',
  'passphraseManager.notAvailable': 'Words not available',
  'passphraseManager.notFoundAlert':
    '⚠️ We could not find your access words. This happens when you close the session or refresh the page.',
  'passphraseManager.notFoundDesc':
    'To access again, use the words you saved in your backup file (pollo-backup-*.txt).',
  'passphraseManager.subtitle':
    '5 magic words to enter your space',
  'passphraseManager.label': 'Passphrase',
  'passphraseManager.hide': 'Hide',
  'passphraseManager.show': 'Show',
  'passphraseManager.copied': 'Copied',
  'passphraseManager.copy': 'Copy',
  'passphraseManager.wordsCopied': 'Words copied to clipboard',
  'passphraseManager.errorCopy': 'Error copying',

  // === LISTS GRID ===
  'listsGrid.newList': 'New list',
  'listsGrid.listNamePlaceholder': 'List name...',
  'listsGrid.errorCreate': 'Error creating list',

  // === LIST CARD ===
  'listCard.todoLabel': 'TO DO',
  'listCard.completedLabel': 'COMPLETED',
  'listCard.moreItems': '+{{count}} more...',
  'listCard.deleteTitle': 'Delete list',
  'listCard.deleteMessage':
    'Delete "{{name}}"? This action cannot be undone.',
  'listCard.deleteConfirm': 'Delete',
  'listCard.deleteCancel': 'Cancel',

  // === CREATE LIST FORM ===
  'createList.title': 'Create New List',
  'createList.placeholder': 'List name (e.g. Groceries)',
  'createList.emptyError': 'List name cannot be empty',
  'createList.errorCreate': 'Error creating list',
  'createList.creating': 'Creating...',
  'createList.create': 'Create',
  'createList.cancel': 'Cancel',

  // === ADD ITEM FORM ===
  'addItem.placeholder': 'Add item...',
  'addItem.adding': 'Adding...',
  'addItem.add': 'Add',
  'addItem.emptyError': 'Item name cannot be empty',
  'addItem.addError': 'Error adding item',

  // === ITEM LIST ===
  'itemList.noItems': 'No items yet',
  'itemList.addFirst': 'Add your first item above',
  'itemList.toDo': 'To Do ({{count}})',
  'itemList.completed': 'Completed ({{count}})',

  // === ITEM CARD ===
  'itemCard.doubleClickEdit': 'Double-click to edit',
  'itemCard.deleteTitle': 'Delete item',
  'itemCard.deleteMessage':
    'Delete "{{name}}"? This action cannot be undone.',
  'itemCard.deleteConfirm': 'Delete',
  'itemCard.deleteCancel': 'Cancel',

  // === HOW IT WORKS MODAL ===
  'howItWorks.title': 'How it works',
  'howItWorks.s1Title': 'Your 5 words are your account',
  'howItWorks.s1Subtitle': 'No registration. No email. No password.',
  'howItWorks.s1p1':
    'When you create a space, Pollo generates 5 unique random words for you.',
  'howItWorks.s1p2':
    'Those words are your account. To log back in, enter them on the access screen — from any device, at any time.',
  'howItWorks.s1p3':
    'If you lose them, there is no recovery possible. Keep them safe.',
  'howItWorks.s1enterLabel': 'Log in',
  'howItWorks.s1enterDesc': 'Enter your 5 words',
  'howItWorks.s1accessLabel': 'Access',
  'howItWorks.s1accessDesc': 'All your lists',
  'howItWorks.s2Title': 'Sharing is just as easy',
  'howItWorks.s2Subtitle': 'No invitations. No permissions. No accounts.',
  'howItWorks.s2p1':
    'Give your 5 words to your partner, roommate or anyone you want. When they enter them, they access the same space as you — the same lists, in real time.',
  'howItWorks.s2p2':
    'Ideal for the grocery list, household chores, or anything you manage with someone.',
  'howItWorks.s2youLabel': 'You',
  'howItWorks.s2youDesc': 'Share the words',
  'howItWorks.s2themLabel': 'Them',
  'howItWorks.s2themDesc': 'Same space instantly',
  'howItWorks.s3Title': 'Save your words',
  'howItWorks.s3Subtitle': 'No recovery if you lose them.',
  'howItWorks.s3p1':
    'Download the backup when creating the space, or retrieve it at any time from Settings.',
  'howItWorks.s3p2':
    'Store it in the cloud (Drive, iCloud) or take a photo of the words.',
  'howItWorks.s4Title': 'Install it as an app',
  'howItWorks.s4Subtitle': 'No downloads. No app store.',
  'howItWorks.s4p1': 'Pollo works as a native app from your browser. You can install it on your phone\'s home screen:',
  'howItWorks.s4ios': 'Tap the share button (the square with an upward arrow) then "Add to Home Screen".',
  'howItWorks.s4android': 'Tap the menu (three dots in the top right) then "Install app" or "Add to Home Screen".',
  'howItWorks.s4p2': 'It opens full screen, no browser bar. Like a real app.',

  // === LEGAL PAGE ===
  'legal.title': 'Privacy & terms',
  'legal.back': 'Back',
  'legal.privacyTitle': 'Privacy',
  'legal.privacyP1': 'Pollo does not collect personal data. No accounts, no emails, no names. We do not know who you are and that is how it should be.',
  'legal.privacyP2': 'The only cookie we use is the session cookie, strictly necessary for the app to work. No analytics cookies, no advertising cookies, no third-party cookies.',
  'legal.privacyP3': 'IP addresses are temporarily logged for brute force protection and automatically deleted within 24 hours.',
  'legal.dataTitle': 'Your data',
  'legal.dataP1': 'The only things stored on our server are: your lists, your items, and a hash of your passphrase. Nothing else.',
  'legal.dataP2': 'Your passphrase is never stored in plaintext. Only cryptographic derivatives (bcrypt + HMAC) are kept, which cannot be used to recover the original words.',
  'legal.dataP3': 'If you lose your passphrase, you lose access. We cannot recover it because we have no way of knowing it was yours.',
  'legal.trackingTitle': 'Tracking',
  'legal.trackingP1': 'None. No Google Analytics, no Facebook pixels, no tracking tools of any kind. No data is sent to third parties.',
  'legal.openSourceTitle': 'Open source',
  'legal.openSourceP1': 'The full source code is available on GitHub. You can verify everything stated here by reading the code.',
  'legal.licenseTitle': 'License',
  'legal.licenseP1': 'MIT — use, modify and distribute freely.',
  'legal.authorTitle': 'Author',
  'legal.authorP1': 'Made by patatapython.',
};

export const translations: Record<Language, Record<string, string>> = { es, en };
