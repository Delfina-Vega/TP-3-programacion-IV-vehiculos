// Componente reutilizable para campos de formulario (etiqueta + control + mensaje de error)
export function Campo({ id, etiqueta, error, children, ...props }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children ?? <input id={id} {...props} />}
      {error && <p className="error">{error}</p>}
    </div>
  );
}