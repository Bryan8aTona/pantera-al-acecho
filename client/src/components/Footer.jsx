import './Footer.css';

// Créditos institucionales. Por ahora solo se usa al pie de la Home,
// pero queda como componente reutilizable por si más adelante se quiere
// en otras pantallas públicas.
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-cols">
        <div className="site-footer-col">
          <h3>Universidad</h3>
          <p>Copyright © Universidad Autónoma Metropolitana 2026</p>
        </div>

        <div className="site-footer-col">
          <h3>Responsables</h3>
          <p>Dra. María del Carmen Gómez Fuentes</p>
          <p>Dr. Jorge Cervantes Ojeda</p>
        </div>

        <div className="site-footer-col">
          <h3>Desarrollador</h3>
          <p>Bryan Tonatiuh Ochoa De La Cruz</p>
        </div>
      </div>

      <p className="site-footer-firma">Pantera al Acecho — Proyecto de Servicio Social</p>
    </footer>
  );
}
