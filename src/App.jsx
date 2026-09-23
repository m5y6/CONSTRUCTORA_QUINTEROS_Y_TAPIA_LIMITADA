import { useState, useEffect, useMemo } from 'react';
import dataEmpresa from './data/empresa.json';
import dataImagenes from './data/imagenes.json';
import './App.css';

export default function App() {
  const { empresa, proyectos } = dataEmpresa;
  
  // Estados de filtrado y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [ordenFecha, setOrdenFecha] = useState('desc'); // 'desc' = más reciente primero, 'asc' = más antigua
  const [filtroSector, setFiltroSector] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Mapa de imágenes por ID de proyecto
  const mapaImagenes = useMemo(() => {
    const mapa = {};
    dataImagenes.forEach((item) => {
      mapa[item.proyectoId] = item.imagenes;
    });
    return mapa;
  }, []);

  const obtenerImagenesProyecto = (proyecto) => {
    return mapaImagenes[proyecto.id] && mapaImagenes[proyecto.id].length > 0
      ? mapaImagenes[proyecto.id]
      : [proyecto.imagen];
  };

  // Función para abrir la dirección directamente en Google Maps
  const abrirEnMaps = (e, ubicacion) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Carrusel Hero: selección inicial al azar
  const [indiceHero, setIndiceHero] = useState(0);
  const [indiceFotoHero, setIndiceFotoHero] = useState(0);
  const [animandoHero, setAnimandoHero] = useState(false);

  useEffect(() => {
    if (proyectos.length > 0) {
      const azar = Math.floor(Math.random() * proyectos.length);
      setIndiceHero(azar);
    }
  }, [proyectos]);

  const proyectoActual = proyectos[indiceHero] || proyectos[0];
  const fotosActuales = obtenerImagenesProyecto(proyectoActual);

  useEffect(() => {
    setIndiceFotoHero(0);
    if (fotosActuales.length <= 1) return;

    const timer = setInterval(() => {
      setIndiceFotoHero((prev) => (prev + 1) % fotosActuales.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [indiceHero, fotosActuales.length]);

  const cambiarProyecto = (direccion) => {
    setAnimandoHero(true);
    setTimeout(() => {
      if (direccion === 'sig') {
        setIndiceHero((prev) => (prev + 1) % proyectos.length);
      } else {
        setIndiceHero((prev) => (prev - 1 + proyectos.length) % proyectos.length);
      }
      setAnimandoHero(false);
    }, 250);
  };

  // Modal / Lightbox
  const [proyectoModal, setProyectoModal] = useState(null);
  const [indiceFotoModal, setIndiceFotoModal] = useState(0);

  const abrirModal = (p) => {
    setProyectoModal(p);
    setIndiceFotoModal(0);
  };

  const cerrarModal = () => {
    setProyectoModal(null);
    setIndiceFotoModal(0);
  };

  const fotosModal = proyectoModal ? obtenerImagenesProyecto(proyectoModal) : [];

  // Lista de tipos de obras únicos para botones
  const tiposDisponibles = useMemo(() => {
    const tiposSet = new Set(proyectos.map((p) => p.tipo).filter(Boolean));
    return Array.from(tiposSet);
  }, [proyectos]);

  // Auxiliar para extraer el año de inicio para el ordenamiento
  const extraerAnioInicio = (periodoStr) => {
    if (!periodoStr) return 0;
    const match = periodoStr.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Filtrado múltiple + Búsqueda por texto + Orden cronológico
  const proyectosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return proyectos
      .filter((p) => {
        const matchSector = filtroSector === 'todos' || p.categoria === filtroSector;
        const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
        
        const matchTexto = 
          query === '' ||
          p.nombre.toLowerCase().includes(query) ||
          p.mandante.toLowerCase().includes(query) ||
          p.ubicacion.toLowerCase().includes(query);

        return matchSector && matchTipo && matchTexto;
      })
      .sort((a, b) => {
        const anioA = extraerAnioInicio(a.periodo);
        const anioB = extraerAnioInicio(b.periodo);
        return ordenFecha === 'desc' ? anioB - anioA : anioA - anioB;
      });
  }, [proyectos, filtroSector, filtroTipo, busqueda, ordenFecha]);

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-badge">Q&T</span>
          <span className="brand-text">{empresa.nombreCorto}</span>
        </div>
        <nav className="nav-links">
          <a href="#destacado">Destacado</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#obras">Catálogo</a>
          <a
            href={`https://wa.me/${empresa.telefono.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="btn-whatsapp"
          >
            Cotizar Obra
          </a>
        </nav>
      </header>

      {/* Hero Carrusel */}
      <section id="destacado" className="hero-carousel-section">
        <div className="carousel-wrapper">
          <div className={`carousel-image-layer ${animandoHero ? 'fade-out' : 'fade-in'}`}>
            <img
              src={fotosActuales[indiceFotoHero]}
              alt={proyectoActual.nombre}
              className="carousel-main-image"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?q=80&w=1200';
              }}
            />
            <div className="carousel-overlay" />
          </div>

          <button
            className="carousel-arrow arrow-left"
            onClick={() => cambiarProyecto('ant')}
            aria-label="Obra anterior"
          >
            &#10094;
          </button>
          <button
            className="carousel-arrow arrow-right"
            onClick={() => cambiarProyecto('sig')}
            aria-label="Siguiente obra"
          >
            &#10095;
          </button>

          <div className="carousel-info-card">
            <div className="info-badges">
              <span className={`badge-pill ${proyectoActual.categoria}`}>
                {proyectoActual.categoria === 'publico' ? 'Obra Pública' : 'Obra Privada'}
              </span>
              {proyectoActual.tipo && (
                <span className="badge-pill badge-type">{proyectoActual.tipo}</span>
              )}
              {fotosActuales.length > 1 && (
                <span className="badge-photos">
                  Foto {indiceFotoHero + 1} / {fotosActuales.length}
                </span>
              )}
            </div>

            <h1 className="carousel-title">{proyectoActual.nombre}</h1>
            <p className="carousel-mandante">Mandante: {proyectoActual.mandante}</p>
            <p className="carousel-location">📍 {proyectoActual.ubicacion}</p>
            {proyectoActual.superficie && (
              <p className="carousel-surface">📐 Superficie: {proyectoActual.superficie}</p>
            )}

            <div className="carousel-footer-line">
              <span className="carousel-date">{proyectoActual.periodo}</span>
              <button className="btn-expand" onClick={() => abrirModal(proyectoActual)}>
                Ver Detalles ↗
              </button>
              <button
                className="btn-maps"
                onClick={(e) => abrirEnMaps(e, proyectoActual.ubicacion)}
              >
                📍 Ver en Google Maps
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Resumen Institucional y MINVU */}
      <section id="nosotros" className="stats-section">
        <div className="stats-container">
          <div className="section-header">
            <span className="section-tag">Trayectoria y Solidez</span>
            <h2 className="section-heading">{empresa.nombre}</h2>
            <p className="section-subtext">{empresa.presentacion}</p>
          </div>

          <div className="metrics-grid">
            {empresa.metricasClave.map((m, idx) => (
              <div key={idx} className="metric-box">
                <span className="metric-number">{m.valor}</span>
                <span className="metric-label">{m.label}</span>
              </div>
            ))}
          </div>

          <div className="minvu-panel">
            <h3 className="minvu-title">Registros Vigentes MINVU</h3>
            <div className="minvu-grid">
              {empresa.registrosMinvu.map((r) => (
                <div key={r.codigo} className="minvu-item">
                  <span className="minvu-code">{r.codigo} - {r.descripcion}</span>
                  <span className="minvu-cat">Categoría: {r.categoria}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo con Buscador, Filtros y Orden por Fecha */}
      <section id="obras" className="catalog-section">
        <div className="catalog-header">
          <span className="section-tag">Portafolio Integral</span>
          <h2 className="section-heading">Catálogo de Obras</h2>

          {/* Barra de Búsqueda y Orden Cronológico */}
          <div className="catalog-controls-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por obra, mandante o dirección (ej. Bomberos, Melipilla, Serrano)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button className="search-clear" onClick={() => setBusqueda('')}>
                  &times;
                </button>
              )}
            </div>

            <div className="sort-dropdown-wrapper">
              <label htmlFor="sortDate" className="sort-label">Ordenar:</label>
              <select
                id="sortDate"
                className="sort-select"
                value={ordenFecha}
                onChange={(e) => setOrdenFecha(e.target.value)}
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguas primero</option>
              </select>
            </div>
          </div>

          {/* Filtro Sector */}
          <div className="filter-group">
            <span className="filter-label">Sector:</span>
            <div className="filter-tabs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'publico', label: 'Obras Públicas' },
                { id: 'privado', label: 'Obras Privadas' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFiltroSector(tab.id)}
                  className={`filter-btn ${filtroSector === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Tipo de Obra */}
          <div className="filter-group" style={{ marginTop: '10px' }}>
            <span className="filter-label">Tipo:</span>
            <div className="filter-tabs">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`filter-btn ${filtroTipo === 'todos' ? 'active' : ''}`}
              >
                Todos los tipos
              </button>
              {tiposDisponibles.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`filter-btn ${filtroTipo === tipo ? 'active' : ''}`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="results-counter">
            Mostrando {proyectosFiltrados.length} {proyectosFiltrados.length === 1 ? 'obra' : 'obras'}
          </div>
        </div>

        {/* Grilla de Proyectos */}
        <div className="projects-grid">
          {proyectosFiltrados.map((p) => {
            const fotosCard = obtenerImagenesProyecto(p);
            return (
              <div
                key={p.id}
                className="project-card"
                onClick={() => abrirModal(p)}
              >
                <div className="card-thumb">
                  <img
                    src={fotosCard[0]}
                    alt={p.nombre}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?q=80&w=800';
                    }}
                  />
                  <span className={`card-badge ${p.categoria}`}>
                    {p.categoria === 'publico' ? 'Público' : 'Privado'}
                  </span>
                  {fotosCard.length > 1 && (
                    <span className="card-counter">+{fotosCard.length} fotos</span>
                  )}
                </div>

                <div className="card-body">
                  <div>
                    <div className="card-type-row">
                      <span className="card-type-tag">{p.tipo}</span>
                      {p.superficie && <span className="card-surface-tag">📐 {p.superficie}</span>}
                    </div>
                    <h3 className="card-title">{p.nombre}</h3>
                    <p className="card-client">{p.mandante}</p>
                    <p className="card-meta">📍 {p.ubicacion}</p>
                  </div>

                  <div className="card-footer">
                    <span>{p.periodo}</span>
                    <span className="card-link">Ver detalles &rarr;</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {proyectosFiltrados.length === 0 && (
          <div className="empty-results">
            <p>No se encontraron obras con los términos o filtros seleccionados.</p>
            <button
              className="btn-clear-filters"
              onClick={() => {
                setBusqueda('');
                setFiltroSector('todos');
                setFiltroTipo('todos');
              }}
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </section>

      {/* Modal / Lightbox con Botón de Google Maps */}
      {proyectoModal && (
        <div className="modal-backdrop" onClick={cerrarModal}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={cerrarModal}>&times;</button>

            <div className="modal-gallery">
              <img
                src={fotosModal[indiceFotoModal]}
                alt={proyectoModal.nombre}
                className="modal-photo"
              />
              {fotosModal.length > 1 && (
                <>
                  <button
                    className="modal-nav prev"
                    onClick={() => setIndiceFotoModal((prev) => (prev - 1 + fotosModal.length) % fotosModal.length)}
                  >
                    &#10094;
                  </button>
                  <button
                    className="modal-nav next"
                    onClick={() => setIndiceFotoModal((prev) => (prev + 1) % fotosModal.length)}
                  >
                    &#10095;
                  </button>
                  <div className="modal-dots">
                    {fotosModal.map((_, i) => (
                      <span
                        key={i}
                        className={`dot ${i === indiceFotoModal ? 'active' : ''}`}
                        onClick={() => setIndiceFotoModal(i)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="modal-info">
              <div className="info-badges" style={{ marginBottom: '10px' }}>
                <span className={`badge-pill ${proyectoModal.categoria}`}>
                  {proyectoModal.categoria === 'publico' ? 'Obra Pública' : 'Obra Privada'}
                </span>
                {proyectoModal.tipo && (
                  <span className="badge-pill badge-type">{proyectoModal.tipo}</span>
                )}
              </div>
              <h2>{proyectoModal.nombre}</h2>
              <p><strong>Mandante:</strong> {proyectoModal.mandante}</p>
              <p><strong>Ubicación:</strong> {proyectoModal.ubicacion}</p>
              {proyectoModal.superficie && <p><strong>Superficie:</strong> {proyectoModal.superficie}</p>}
              <p><strong>Período de ejecución:</strong> {proyectoModal.periodo}</p>

              <div className="modal-actions">
                <button
                  className="btn-maps modal-maps-btn"
                  onClick={(e) => abrirEnMaps(e, proyectoModal.ubicacion)}
                >
                  📍 Ir a Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p className="footer-title">{empresa.nombre} — RUT: {empresa.rut}</p>
        <p className="footer-meta">{empresa.direccion} | Fono: {empresa.telefono}</p>
        <p className="footer-copy">© {new Date().getFullYear()} Constructora Quinteros y Tapia Limitada.</p>
      </footer>
    </div>
  );
}