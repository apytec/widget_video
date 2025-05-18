// Importación de hooks y librerías necesarias
import React, { useState, useRef, useEffect } from 'react';
import { AllWidgetProps } from 'jimu-core'; // Tipado para widgets en ArcGIS Experience Builder
import Hls from 'hls.js'; // Librería para reproducir streams .m3u8
import flvjs from 'flv.js'; // Librería para reproducir streams .flv
import './style.css'; // Estilos del widget

// Tipo de modo (por ahora solo 'stream')
type Mode = 'stream';

// Estados posibles del stream
enum StreamStatus {
  Idle = 'idle',     // Sin transmisión
  Live = 'live',     // Transmitiendo correctamente
  Error = 'error'    // Error al reproducir
}

// Componente principal del widget
const Widget: React.FC<AllWidgetProps<any>> = () => {
  // Estado para la URL actual del stream
  const [streamUrl, setStreamUrl] = useState('');

  // Estado para el input del usuario
  const [inputUrl, setInputUrl] = useState('');

  // Estado del stream (idle, live, error)
  const [status, setStatus] = useState<StreamStatus>(StreamStatus.Idle);

  // Referencia al elemento <video>
  const videoRef = useRef<HTMLVideoElement>(null);

  // Función al hacer clic en "Ingreso URL"
  const handleGo = () => {
    if (!inputUrl.trim()) return; // Si el input está vacío, no hace nada
    setStreamUrl(inputUrl.trim()); // Guarda la URL ingresada
    setInputUrl(''); // Limpia el input
    setStatus(StreamStatus.Live); // Cambia estado a "en vivo"
  };

  // Función para resetear el reproductor
  const reset = () => {
    setStreamUrl(''); // Borra la URL activa
    setStatus(StreamStatus.Idle); // Vuelve a estado inicial
  };

  // Hook para reproducir el stream cuando cambia la URL
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const video = videoRef.current;

    // Permite reproducir video de origen cruzado
    video.crossOrigin = 'anonymous';

    // Listeners para cambiar el estado según evento
    video.onplaying = () => setStatus(StreamStatus.Live);
    video.onerror = () => setStatus(StreamStatus.Error);

    let cleanup: (() => void) | undefined;

    // Intenta obtener el path de la URL para detectar la extensión
    let pathname: string;
    try {
      pathname = new URL(streamUrl).pathname.toLowerCase();
    } catch {
      console.error('URL inválida:', streamUrl);
      setStatus(StreamStatus.Error);
      return;
    }

    // Caso: formato FLV
    if (pathname.endsWith('.flv') && flvjs.isSupported()) {
      const mediaDataSource = { type: 'flv', url: streamUrl, isLive: true };
      const config = { stashInitialSize: 128 }; // Tamaño de buffer inicial
      const player = flvjs.createPlayer(mediaDataSource, config); // Crea reproductor FLV
      player.attachMediaElement(video); // Conecta el video
      player.load(); // Carga el stream
      player.on(flvjs.Events.ERROR, () => setStatus(StreamStatus.Error)); // Manejo de errores
      cleanup = () => { player.destroy(); }; // Limpieza al desmontar

    // Caso: formato HLS (.m3u8)
    } else if (pathname.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ maxMaxBufferLength: 30 }); // Configuración de buffer
        // Manejo de errores de HLS
        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('[HLS.js error]', data);
          setStatus(StreamStatus.Error);
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR)
              console.warn('Timeout de manifest, reintentando...');
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR)
              hls.recoverMediaError(); // Intenta recuperar
            else hls.destroy(); // Detiene si es otro error fatal
          }
        });
        hls.loadSource(streamUrl); // Carga la fuente HLS
        hls.attachMedia(video); // Conecta al video
        cleanup = () => { hls.destroy(); }; // Limpieza
      }
      // Caso especial: HLS soportado nativamente por el navegador
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else {
        console.error('HLS no soportado');
        setStatus(StreamStatus.Error);
      }

    // Caso: formato no soportado
    } else {
      console.error('Formato no soportado:', pathname);
      setStatus(StreamStatus.Error);
    }

    // Cleanup al desmontar o cambiar URL
    return () => {
      cleanup && cleanup();
    };
  }, [streamUrl]);

  // Render del componente
  return (
    <div className="widget-frame">
      {/* Banner de estado LIVE */}
      <div className="live-banner">
        <span className={`status-dot ${status}`}></span>
        LIVE
      </div>

      {/* Cabecera visible solo si no hay URL activa */}
      {!streamUrl && (
        <div className="frame-header">DIRICRIMI</div>
      )}

      <div className="embed-container">
        {/* Si no hay URL ingresada, muestra el formulario */}
        {!streamUrl ? (
          <div className="form-container">
            <div className="input-row">
              <input
                type="text"
                placeholder="URL"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
              />
              <button onClick={handleGo}>Ingreso URL</button>
            </div>
          </div>
        ) : (
          // Si hay una URL activa, muestra el video y botón para cambiarla
          <div className="content-area">
            <video
              ref={videoRef}
              controls
              autoPlay
              muted
              className="embed-video"
            />
            <button className="reset-btn" onClick={reset}>Cambiar URL</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Widget;
