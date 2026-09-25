import { useState, useMemo } from 'react';
import dataEmpresa from './data/empresa.json';
import dataImagenes from './data/imagenes.json';
import './App.css';

export default function App() {
  const { empresa, proyectos } = dataEmpresa;
  
  // Menú móvil
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Estados de filtrado y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [ordenFecha, setOrdenFecha] = useState('desc');
  const [filtroSector, setFiltroSector] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFirma, setFiltroFirma] = useState('todos'); // 'todos', 'serviu', 'elaborado'

  // Mapa de imágenes por ID
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

  const abrirEnMaps = (e, ubicacion) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Modal Lightbox
  const [proyectoModal, setProyectoModal] = useState(null);
  const [indiceFotoModal, setIndiceFotoModal] = useState(0);

  const abrirModal = (p) => {
    setProyectoModal(p);
    setIndiceFotoModal(0);
    document.body.style.overflow = 'hidden';
  };

  const cerrarModal = () => {
    setProyectoModal(null);
    setIndiceFotoModal(0);
    document.body.style.overflow = 'auto';
  };

  const fotosModal = proyectoModal ? obtenerImagenesProyecto(proyectoModal) : [];

  const tiposDisponibles = useMemo(() => {
    const tiposSet = new Set(proyectos.map((p) => p.tipo).filter(Boolean));
    return Array.from(tiposSet);
  }, [proyectos]);

  const extraerAnioInicio = (periodoStr) => {
    if (!periodoStr) return 0;
    const match = periodoStr.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Filtrado combinado
  const proyectosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return proyectos
      .filter((p) => {
        const matchSector = filtroSector === 'todos' || p.categoria === filtroSector;
        const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
        
        let matchFirma = true;
        if (filtroFirma === 'serviu') matchFirma = !!p.esServiu;
        if (filtroFirma === 'elaborado') matchFirma = !!p.elaboroProyecto;

        const matchTexto = 
          query === '' ||
          p.nombre.toLowerCase().includes(query) ||
          p.mandante.toLowerCase().includes(query) ||
          p.ubicacion.toLowerCase().includes(query) ||
          (p.proyecto && p.proyecto.toLowerCase().includes(query));

        return matchSector && matchTipo && matchFirma && matchTexto;
      })
      .sort((a, b) => {
        const anioA = extraerAnioInicio(a.periodo);
        const anioB = extraerAnioInicio(b.periodo);
        return ordenFecha === 'desc' ? anioB - anioA : anioA - anioB;
      });
  }, [proyectos, filtroSector, filtroTipo, filtroFirma, busqueda, ordenFecha]);

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-badge">Q&T</span>
          <span className="brand-text">{empresa.nombreCorto}</span>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <nav className={`nav-links ${menuAbierto ? 'nav-open' : ''}`}>
          <a href="#nosotros" onClick={() => setMenuAbierto(false)}>Nosotros</a>
          <a href="#obras" onClick={() => setMenuAbierto(false)}>Catálogo</a>
          <a
            href={`https://wa.me/${empresa.telefono.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="btn-whatsapp"
            onClick={() => setMenuAbierto(false)}
          >
            Cotizar Obra
          </a>
        </nav>
      </header>

      {/* Resumen Institucional y SERVIU / MINVU */}
      <section id="nosotros" className="stats-section">
        <div className="glass-panel main-intro-panel">
          <span className="section-tag">Trayectoria y Solidez</span>
          <h1 className="section-heading">{empresa.nombre}</h1>
          <p className="section-subtext">{empresa.presentacion}</p>
        </div>

        <div className="metrics-grid">
          {empresa.metricasClave.map((m, idx) => (
            <div key={idx} className="metric-box glass-panel">
              <span className="metric-number">{m.valor}</span>
              <span className="metric-label">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="minvu-panel glass-panel">
          <h3 className="minvu-title">Registros Vigentes Serviu / MINVU</h3>
          <div className="minvu-grid">
            {empresa.registrosMinvu.map((r) => (
              <div key={r.codigo} className="minvu-item">
                <span className="minvu-code">{r.codigo} - {r.descripcion}</span>
                <span className="minvu-cat">Categoría: {r.categoria}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catálogo con Filtros Avanzados */}
      <section id="obras" className="catalog-section">
        <div className="catalog-header">
          <span className="section-tag">Portafolio Integral</span>
          <h2 className="section-heading">Catálogo de Obras</h2>

          {/* Barra de Búsqueda y Orden */}
          <div className="catalog-controls-bar glass-panel">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por obra, mandante, descripción o dirección..."
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
                <option value="desc">Más recientes</option>
                <option value="asc">Más antiguas</option>
              </select>
            </div>
          </div>

          {/* Filtro Especial: Serviu / Proyecto Elaborado */}
          <div className="filter-zone glass-panel">
            <span className="filter-label">Alcance y Organismo:</span>
            <div className="filter-tabs">
              <button
                onClick={() => setFiltroFirma('todos')}
                className={`filter-btn ${filtroFirma === 'todos' ? 'active' : ''}`}
              >
                Todas las obras
              </button>
              <button
                onClick={() => setFiltroFirma('serviu')}
                className={`filter-btn ${filtroFirma === 'serviu' ? 'active' : ''}`}
              >
                🏛 Obras SERVIU / MINVU
              </button>
              <button
                onClick={() => setFiltroFirma('elaborado')}
                className={`filter-btn ${filtroFirma === 'elaborado' ? 'active' : ''}`}
              >
                📐 Proyecto y Diseño Elaborado
              </button>
            </div>
          </div>

          {/* Filtro Sector */}
          <div className="filter-zone glass-panel" style={{ marginTop: '12px' }}>
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
          <div className="filter-zone glass-panel" style={{ marginTop: '12px' }}>
            <span className="filter-label">Tipo de Obra:</span>
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

          <div className="results-counter">
            Mostrando {proyectosFiltrados.length} {proyectosFiltrados.length === 1 ? 'obra' : 'obras'}
          </div>
        </div>

        {/* Grilla de Tarjetas */}
        <div className="projects-grid">
          {proyectosFiltrados.map((p) => {
            const fotosCard = obtenerImagenesProyecto(p);
            return (
              <div
                key={p.id}
                className="project-card glass-panel"
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
                  <div className="card-badge-container">
                    <span className={`card-badge ${p.categoria}`}>
                      {p.categoria === 'publico' ? 'Público' : 'Privado'}
                    </span>
                    {p.esServiu && <span className="card-badge badge-serviu">SERVIU</span>}
                    {p.elaboroProyecto && <span className="card-badge badge-design">Diseño Q&T</span>}
                  </div>

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
                    {p.proyecto && (
                      <p className="card-scope-preview">
                        📋 {p.proyecto}
                      </p>
                    )}
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
          <div className="empty-results glass-panel">
            <p>No se encontraron obras con los filtros seleccionados.</p>
            <button
              className="btn-clear-filters"
              onClick={() => {
                setBusqueda('');
                setFiltroSector('todos');
                setFiltroTipo('todos');
                setFiltroFirma('todos');
              }}
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </section>

      {/* Modal Pantalla Completa con Detalle de Alcance */}
      {proyectoModal && (
        <div className="modal-backdrop" onClick={cerrarModal}>
          <div className="modal-window-fullscreen glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={cerrarModal}>&times;</button>

            <div className="modal-content-grid">
              {/* Galería Panorámica */}
              <div className="modal-gallery-fullscreen">
                <img
                  src={fotosModal[indiceFotoModal]}
                  alt={proyectoModal.nombre}
                  className="modal-photo-fullscreen"
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
                    
                    <div className="modal-thumbnails-strip">
                      {fotosModal.map((img, i) => (
                        <div
                          key={i}
                          className={`thumb-item ${i === indiceFotoModal ? 'active' : ''}`}
                          onClick={() => setIndiceFotoModal(i)}
                        >
                          <img src={img} alt="" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Ficha Técnica */}
              <div className="modal-info-fullscreen">
                <div>
                  <div className="info-badges" style={{ marginBottom: '14px' }}>
                    <span className={`badge-pill ${proyectoModal.categoria}`}>
                      {proyectoModal.categoria === 'publico' ? 'Obra Pública' : 'Obra Privada'}
                    </span>
                    {proyectoModal.tipo && (
                      <span className="badge-pill badge-type">{proyectoModal.tipo}</span>
                    )}
                    {proyectoModal.esServiu && (
                      <span className="badge-pill badge-serviu-pill">Marco SERVIU</span>
                    )}
                    {proyectoModal.elaboroProyecto && (
                      <span className="badge-pill badge-design-pill">Diseño y Proyecto Elaborado</span>
                    )}
                  </div>

                  <h2>{proyectoModal.nombre}</h2>

                  <div className="modal-specs-list">
                    {/* Parámetro de Proyecto / Qué se hizo */}
                    {proyectoModal.proyecto && (
                      <div className="spec-row highlight-spec">
                        <span className="spec-label">Alcance del Proyecto:</span>
                        <span className="spec-value">{proyectoModal.proyecto}</span>
                      </div>
                    )}

                    {/* Elaboración del proyecto */}
                    <div className="spec-row">
                      <span className="spec-label">Elaboración y Diseño Técnico:</span>
                      <span className="spec-value">
                        {proyectoModal.elaboroProyecto ? 'Sí, elaborado y proyectado por Q&T' : 'Ejecución de obra según bases de licitación'}
                      </span>
                    </div>

                    <div className="spec-row">
                      <span className="spec-label">Mandante:</span>
                      <span className="spec-value">{proyectoModal.mandante}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Ubicación:</span>
                      <span className="spec-value">📍 {proyectoModal.ubicacion}</span>
                    </div>
                    {proyectoModal.superficie && (
                      <div className="spec-row">
                        <span className="spec-label">Superficie:</span>
                        <span className="spec-value">📐 {proyectoModal.superficie}</span>
                      </div>
                    )}
                    <div className="spec-row">
                      <span className="spec-label">Período de ejecución:</span>
                      <span className="spec-value">{proyectoModal.periodo}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions-bar">
                  <button
                    className="btn-maps modal-maps-btn"
                    onClick={(e) => abrirEnMaps(e, proyectoModal.ubicacion)}
                  >
                    📍 Abrir en Google Maps
                  </button>
                </div>
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