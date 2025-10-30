'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Terminal, FileText, Repeat } from 'lucide-react';

export default function RecuperarSesionPage() {
  const [pasoActual, setPasoActual] = useState(0);
  const [mostrarComandos, setMostrarComandos] = useState(false);

  const pasos = [
    {
      titulo: 'Detener Worker Local',
      descripcion: 'Asegúrate de que NO tengas el worker corriendo en tu PC',
      icono: '⛔',
      verificacion: 'Presiona "Ya verifiqué" cuando confirmes que el worker local está apagado',
      esVerificacion: true
    },
    {
      titulo: 'Limpiar Sesión Antigua',
      descripcion: 'Elimina la sesión antigua (auth_info) para forzar QR nuevo',
      icono: '🗑️',
      comando: `# PowerShell (Haz click para copiar):
cd C:\\Users\\Usuario\\ai-app\\ahorro365-baileys-worker
Remove-Item -Recurse -Force auth_info -ErrorAction SilentlyContinue
Write-Host "auth_info eliminado" -ForegroundColor Green`,
      subcomando: `# Git Bash (alternativa):
cd ~/ai-app/ahorro365-baileys-worker
rm -rf auth_info
echo "auth_info eliminado"`,
      terminal: 'powershell'
    },
    {
      titulo: 'Iniciar Worker con QR Nuevo',
      descripcion: 'Corre el worker local y espera a ver el QR en la terminal',
      icono: '🚀',
      comando: `# PowerShell:
cd C:\\Users\\Usuario\\ai-app\\ahorro365-baileys-worker
$env:PORT='3004'
$env:FORCE_NEW_SESSION='true'
npm run dev`,
      terminal: 'powershell',
      nota: '⚠️ Deberías ver un QR impreso en la terminal. Déjalo corriendo.'
    },
    {
      titulo: 'Escanear QR con WhatsApp',
      descripcion: 'Abre WhatsApp en tu teléfono y escanea el QR',
      icono: '📱',
      instrucciones: [
        '1. Abre WhatsApp en tu teléfono',
        '2. Menú (☰) → Dispositivos vinculados',
        '3. Toca "Vincular dispositivo"',
        '4. Escanea el QR que aparece en tu terminal',
        '5. Espera a ver "✅ Conectado a WhatsApp!"'
      ],
      nota: 'El terminal debe mostrar "✅ Conectado a WhatsApp!"'
    },
    {
      titulo: 'Verificar Conexión Local',
      descripcion: 'Confirma que tu PC se conectó correctamente',
      icono: '✅',
      comandos: [
        {
          nombre: 'PowerShell: Verificar que auth_info existe',
          comando: `dir C:\\Users\\Usuario\\ai-app\\ahorro365-baileys-worker\\auth_info`,
          terminal: 'powershell'
        },
        {
          nombre: 'Git Bash: Verificar que auth_info existe',
          comando: `ls -la ~/ai-app/ahorro365-baileys-worker/auth_info`,
          terminal: 'gitbash'
        }
      ],
      nota: 'Debes ver archivos como: creds.json, session-*.json, pre-key-*.json, app-state-*.json'
    },
    {
      titulo: 'Comprimir Sesión Local',
      descripcion: 'Crea un archivo .tgz con tu sesión',
      icono: '📦',
      comando: `# PowerShell:
cd C:\\Users\\Usuario\\ai-app\\ahorro365-baileys-worker
tar -czf authinfo.tgz auth_info
Write-Host "authinfo.tgz creado" -ForegroundColor Green`,
      subcomando: `# Git Bash:
cd ~/ai-app/ahorro365-baileys-worker
tar -czf authinfo.tgz auth_info
echo "authinfo.tgz creado"`,
      terminal: 'powershell',
      nota: 'Confirma que existe el archivo authinfo.tgz'
    },
    {
      titulo: 'Conectar a Fly.io con SFTP',
      descripcion: 'Abre una conexión SFTP para subir archivos a Fly',
      icono: '🔗',
      comando: `# PowerShell (copia y pega todo de una vez):
C:\\Users\\Usuario\\.fly\\bin\\flyctl.exe sftp shell -a ahorro365-baileys-worker`,
      terminal: 'powershell',
      nota: 'Verás un símbolo » cuando estés dentro de SFTP'
    },
    {
      titulo: 'Subir Archivo a Fly.io',
      descripcion: 'Copia tu authinfo.tgz al servidor de Fly',
      icono: '⬆️',
      comando: `# Dentro del prompt SFTP » escribe estas 3 líneas (una por una):

cd /app
put "C:/Users/Usuario/ai-app/ahorro365-baileys-worker/authinfo.tgz" /app/authinfo2.tgz
ls -l /app

# Debes ver "authinfo2.tgz" en la lista
# Para salir, presiona Ctrl+C`,
      terminal: 'sftp',
      nota: 'IMPORTANTE: Debes estar dentro de SFTP (prompt »)'
    },
    {
      titulo: 'Descomprimir Sesión en Fly.io',
      descripcion: 'Extrae los archivos JSON y cópialos al volumen persistente',
      icono: '📂',
      comando: `# PowerShell (todo de una vez, copia y pega):
C:\\Users\\Usuario\\.fly\\bin\\flyctl.exe ssh console -a ahorro365-baileys-worker -C "sh -lc 'cd /app && mkdir -p new_auth && tar -xzf /app/authinfo2.tgz -C /app/new_auth && cp -f /app/new_auth/auth_info/*.json /app/auth_info/ && rm -rf /app/new_auth /app/authinfo2.tgz && ls -l /app/auth_info | head -20'"`,
      terminal: 'powershell',
      nota: 'Debes ver archivos JSON listados: creds.json, pre-key-*.json, etc.'
    },
    {
      titulo: 'Reiniciar Worker en Fly.io',
      descripcion: 'Reinicia la máquina para que use la nueva sesión',
      icono: '🔄',
      comando: `# PowerShell:
C:\\Users\\Usuario\\.fly\\bin\\flyctl.exe machines restart 3287e393be3e85 -a ahorro365-baileys-worker`,
      terminal: 'powershell',
      nota: 'Espera 10-20 segundos después de reiniciar'
    },
    {
      titulo: 'Verificar Conexión en Fly.io',
      descripcion: 'Confirma que Fly.io está conectado a WhatsApp',
      icono: '🌐',
      acciones: [
        {
          tipo: 'url',
          texto: 'Abrir Health Check',
          url: 'https://ahorro365-baileys-worker.fly.dev/health'
        },
        {
          tipo: 'url',
          texto: 'Abrir Status',
          url: 'https://ahorro365-baileys-worker.fly.dev/status'
        }
      ],
      nota: 'Status debe mostrar: "connected": true'
    }
  ];

  const handleCopyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setMostrarComandos(false);
    setTimeout(() => setMostrarComandos(true), 100);
  };

  const pasoSiguiente = () => {
    if (pasoActual < pasos.length - 1) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  const paso = pasos[pasoActual];
  const esUltimo = pasoActual === pasos.length - 1;
  const esPrimero = pasoActual === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🔄 Recuperar Sesión de WhatsApp</h1>
              <p className="text-gray-600">Guía paso a paso para reconectar desde cero</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Paso</div>
              <div className="text-2xl font-bold text-blue-600">
                {pasoActual + 1} / {pasos.length}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start mb-6">
            <div className="text-6xl mr-4">{paso.icono}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{paso.titulo}</h2>
              <p className="text-gray-600 text-lg">{paso.descripcion}</p>
            </div>
          </div>

          {/* Verification Step */}
          {paso.esVerificacion ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
              <p className="text-gray-800 mb-4">{paso.verificacion}</p>
              <button
                onClick={pasoSiguiente}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Ya verifiqué, continuar
              </button>
            </div>
          ) : (
            <>
              {/* Instructions (for step 3) */}
              {paso.instrucciones && (
                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-green-900 mb-3">Sigue estos pasos:</h3>
                  <ul className="space-y-2">
                    {paso.instrucciones.map((inst, idx) => (
                      <li key={idx} className="text-green-800 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* URL Actions (for step 10) */}
              {paso.acciones && paso.acciones.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                  <div className="space-y-3">
                    {paso.acciones.map((accion, idx) => (
                      <a
                        key={idx}
                        href={accion.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-white hover:bg-blue-100 border border-blue-300 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-blue-900 font-medium">{accion.texto}</span>
                          <span className="text-blue-600">→</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Terminal Indicator */}
              {(paso.comando || paso.comandos) && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  {paso.terminal === 'powershell' && (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>Ejecuta en <span className="font-mono bg-gray-100 px-2 py-1 rounded">PowerShell</span></span>
                    </>
                  )}
                  {paso.terminal === 'gitbash' && (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>Ejecuta en <span className="font-mono bg-gray-100 px-2 py-1 rounded">Git Bash</span></span>
                    </>
                  )}
                  {paso.terminal === 'sftp' && (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>Dentro de <span className="font-mono bg-gray-100 px-2 py-1 rounded">SFTP</span> (prompt »)</span>
                    </>
                  )}
                </div>
              )}

              {/* Single Command */}
              {paso.comando && (
                <div className="bg-gray-900 rounded-lg p-6 mb-6 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-green-400 font-mono text-sm">$ {paso.terminal}</span>
                    <button
                      onClick={() => handleCopyCommand(paso.comando!, 0)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      📋 Copiar todo
                    </button>
                  </div>
                  <pre className="text-green-300 text-sm overflow-x-auto whitespace-pre-wrap font-mono">{paso.comando}</pre>
                  {paso.subcomando && (
                    <>
                      <div className="border-t border-gray-700 my-4"></div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-cyan-400 font-mono text-sm">$ Git Bash (alternativa)</span>
                        <button
                          onClick={() => handleCopyCommand(paso.subcomando!, 1)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          📋 Copiar todo
                        </button>
                      </div>
                      <pre className="text-cyan-300 text-sm overflow-x-auto whitespace-pre-wrap font-mono">{paso.subcomando}</pre>
                    </>
                  )}
                </div>
              )}

              {/* Multiple Commands (for step 5) */}
              {paso.comandos && paso.comandos.length > 0 && (
                <div className="space-y-4">
                  {paso.comandos.map((cmd, idx) => (
                    <div key={idx} className="bg-gray-900 rounded-lg p-6 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-400 font-mono text-sm">{cmd.terminal === 'powershell' ? '$ PowerShell' : '$ Git Bash'}</span>
                        <button
                          onClick={() => handleCopyCommand(cmd.comando, idx)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          📋 Copiar
                        </button>
                      </div>
                      <pre className="text-green-300 text-sm overflow-x-auto whitespace-pre-wrap font-mono">{cmd.comando}</pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Note */}
              {paso.nota && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                  <p className="text-amber-900">{paso.nota}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between">
            <button
              onClick={pasoAnterior}
              disabled={esPrimero}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                esPrimero
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              ← Anterior
            </button>

            <div className="flex gap-3">
              {paso.esVerificacion ? null : (
                <button
                  onClick={pasoSiguiente}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  {esUltimo ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      ¡Completado!
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Consejo rápido</h3>
              <p className="text-blue-800 text-sm">
                Si tienes dudas sobre algún comando, haz clic en "📋 Copiar" y pégalo exactamente como se muestra.
                Si algo no funciona, vuelve al paso anterior o verifica que estés usando la terminal correcta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
