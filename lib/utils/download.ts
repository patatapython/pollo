/**
 * Utilidades unificadas para descargar archivos y copiar contenido.
 * Soporta iOS Safari, Android Chrome, y navegadores de escritorio.
 */

/**
 * Detectar si estamos en un dispositivo móvil / iOS Safari
 */
function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Escapar caracteres XML/SVG especiales
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera el contenido del archivo de backup/recuperación
 */
export function generateBackupContent(passphrase: string): string {
  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pollolist.app';

  return `═══════════════════════════════════════════════════════════
  POLLO - KIT DE RECUPERACIÓN DE ACCESO
═══════════════════════════════════════════════════════════

Fecha de creación: ${today}

TUS PALABRAS DE ACCESO (PASSPHRASE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ${passphrase}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANTE - LEE ESTO CON ATENCIÓN:

- Estas 5 palabras son la ÚNICA forma de acceder a tu espacio
- NO se pueden recuperar si las pierdes
- Guarda este archivo en 2 lugares diferentes (nube + local)
- NO compartas estas palabras públicamente
- Puedes compartir con personas de confianza (compañeros, familia)

═══════════════════════════════════════════════════════════

CÓMO FUNCIONA:

1. Para acceder a tu espacio:
   -> Ve a la aplicación
   -> Introduce estas 5 palabras exactamente como aparecen
   -> ¡Listo! Accederás a todas tus listas

2. Para compartir tu espacio con alguien:
   -> Comparte estas palabras con esa persona
   -> Ella las introduce al acceder
   -> Ambos verán las mismas listas (ideal para compañeros de piso)

3. Si pierdes estas palabras:
   -> NO podrás recuperar el acceso
   -> Tendrás que crear un nuevo espacio desde cero
   -> Por eso es CRÍTICO guardar este archivo

═══════════════════════════════════════════════════════════

RECOMENDACIONES DE SEGURIDAD:

-> Guarda este archivo en Google Drive, Dropbox o iCloud
-> Haz una copia en tu ordenador local
-> Envía una copia a tu email personal
-> Considera imprimirlo y guardarlo físicamente
-> Si compartes con alguien, hazlo por mensaje privado

═══════════════════════════════════════════════════════════

Para acceder: ${appUrl}

¡Disfruta de Pollo!

═══════════════════════════════════════════════════════════
`;
}

/**
 * Descargar archivo usando Web Share API (móvil) o fallback con Blob (escritorio).
 * En iOS Safari, usa window.open como fallback ya que el patrón createElement('a').click()
 * no funciona en ese navegador.
 */
export async function downloadBackupFile(passphrase: string): Promise<void> {
  const content = generateBackupContent(passphrase);
  const filename = `pollo-backup-${new Date().getTime()}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const file = new File([blob], filename, { type: 'text/plain' });

  // 1. Intentar Web Share API (funciona nativo en móvil)
  if (isMobile() && navigator.share) {
    try {
      await navigator.share({
        title: 'Pollo - Kit de Recuperación',
        text: content,
        files: [file],
      });
      return;
    } catch (err) {
      // Si el usuario cancela el share, o files no es soportado,
      // intentar share sin files
      if (err instanceof Error && err.name !== 'AbortError') {
        try {
          await navigator.share({
            title: 'Pollo - Kit de Recuperación',
            text: content,
          });
          return;
        } catch {
          // Fall through to other methods
        }
      } else {
        // User cancelled, don't try other methods
        return;
      }
    }
  }

  // 2. Fallback iOS: abrir en nueva pestaña (Safari no soporta download attr)
  if (isIOS()) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Cleanup after a delay to let the tab open
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  // 3. Fallback escritorio / Android Chrome: createElement('a').click()
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copiar texto al portapapeles con fallback para navegadores antiguos
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Intentar Clipboard API moderna
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: textarea + execCommand (para contextos sin permisos de clipboard)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Generar una imagen SVG con el passphrase para guardar en galería
 */
export function downloadRecoveryImage(passphrase: string): void {
  const escapedPassphrase = escapeXml(passphrase);

  const svg = `<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="250" fill="#f8f5f0"/>
  <rect x="20" y="20" width="360" height="210" rx="12" fill="white" stroke="#d4c9b8" stroke-width="2"/>
  <text x="200" y="65" font-size="24" font-weight="bold" text-anchor="middle" fill="#3d2e1f" font-family="serif">POLLO</text>
  <line x1="60" y1="85" x2="340" y2="85" stroke="#d4c9b8" stroke-width="1"/>
  <text x="200" y="115" font-size="11" text-anchor="middle" fill="#8b7355" font-family="sans-serif">PALABRAS DE ACCESO</text>
  <text x="200" y="150" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle" fill="#3d2e1f">${escapedPassphrase}</text>
  <line x1="60" y1="175" x2="340" y2="175" stroke="#d4c9b8" stroke-width="1"/>
  <text x="200" y="205" font-size="10" text-anchor="middle" fill="#8b7355" font-family="sans-serif">Guarda esta imagen en un lugar seguro</text>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });

  if (isIOS()) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pollo-recovery-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
