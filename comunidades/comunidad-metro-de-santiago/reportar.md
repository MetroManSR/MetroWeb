<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reportar Problemas - MetroMan</title>
  <style>
    body { font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    select, textarea, button { width: 100%; padding: 10px; border: 1px solid #ddd; }
    button { background: #0066cc; color: white; border: none; cursor: pointer; }
    .report { border: 1px solid #eee; padding: 10px; margin-bottom: 10px; }
    .status { float: right; padding: 3px 8px; border-radius: 3px; }
    .pendiente { background: #ffeb3b; }
    .en_proceso { background: #2196f3; color: white; }
    .resuelto { background: #4caf50; color: white; }
  </style>
</head>
<body>
  <h1>Reportar Problema en el Metro</h1>
  
  <form id="reportForm">
    <div class="form-group">
      <label for="linea">Línea:</label>
      <select id="linea" required>
        <option value="">Seleccione una línea</option>
        <option value="1">Línea 1</option>
        <option value="2">Línea 2</option>
        <option value="3">Línea 3</option>
        <option value="4">Línea 4</option>
        <option value="4A">Línea 4A</option>
        <option value="5">Línea 5</option>
        <option value="5B">Línea 5B</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="problema">Tipo de Problema:</label>
      <select id="problema" required>
        <option value="">Seleccione un problema</option>
        <option value="Retraso">Retraso en el servicio</option>
        <option value="Avería">Avería en trenes</option>
        <option value="Infraestructura">Problema de infraestructura</option>
        <option value="Atención">Mala atención al cliente</option>
        <option value="Otro">Otro problema</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="descripcion">Descripción:</label>
      <textarea id="descripcion" rows="4" required></textarea>
    </div>
    
    <button type="submit">Enviar Reporte</button>
  </form>
  
  <h2>Últimos Reportes</h2>
  <div id="reportsList"></div>
  
  <script>
    document.getElementById('reportForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const button = e.target.querySelector('button');
      button.disabled = true;
      button.textContent = 'Enviando...';
      
      try {
        const response = await fetch('https://api.bloksel.com/metroCredentials/metro/reportar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linea: document.getElementById('linea').value,
            problema: document.getElementById('problema').value,
            descripcion: document.getElementById('descripcion').value
          })
        });
        
        if (response.ok) {
          alert('¡Reporte enviado con éxito!');
          e.target.reset();
          loadReports();
        } else {
          const error = await response.json();
          alert(`Error: ${error.error || 'Error desconocido'}`);
        }
      } catch (err) {
        alert('Error de conexión');
      } finally {
        button.disabled = false;
        button.textContent = 'Enviar Reporte';
      }
    });
    
    async function loadReports() {
      try {
        const response = await fetch('https://api.bloksel.com/metroCredentials/metro/reportes');
        const reports = await response.json();
        
        const container = document.getElementById('reportsList');
        container.innerHTML = reports.map(report => `
          <div class="report">
            <strong>Línea ${report.linea}</strong> - ${report.problema}
            <span class="status ${report.status}">${
              report.status.replace('_', ' ')
            }</span>
            <p>${report.descripcion || 'Sin descripción'}</p>
            <small>${new Date(report.created_at).toLocaleString()}</small>
          </div>
        `).join('');
      } catch (err) {
        console.error('Error al cargar reportes:', err);
      }
    }
    
    loadReports();
  </script>
</body>
</html>
