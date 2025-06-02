# Reportar Problemas - MetroMan

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
    
    /* Line buttons styles */
    .line-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 20px 0;
    }
    .line-btn {
      padding: 15px 5px;
      text-align: center;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      position: relative;
      border: 2px solid transparent;
    }
    .line-btn:hover {
      opacity: 0.9;
    }
    /* Line colors */
    .line-1 { background: #e30613; color: white; }
    .line-2 { background: #0097a9; color: white; }
    .line-3 { background: #f9c000; color: black; }
    .line-4 { background: #6c3483; color: white; }
    .line-4A { background: #00a14e; color: white; }
    .line-5 { background: #f58220; color: black; }
    .line-5B { background: #8bc34a; color: black; }
    
    /* Status indicators */
    .line-status {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .status-good { background: #4CAF50; }
    .status-warning { background: #FFC107; }
    .status-bad { background: #F44336; }
    
    .report-form { display: none; margin-top: 20px; }
    .active-line { 
      display: block;
      padding: 10px;
      margin-bottom: 15px;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Reportar Problema en el Metro</h1>
  
  <div class="active-line" id="activeLineDisplay"></div>
  
  <div class="line-buttons">
    <div class="line-btn line-1" data-line="1">Línea 1</div>
    <div class="line-btn line-2" data-line="2">Línea 2</div>
    <div class="line-btn line-3" data-line="3">Línea 3</div>
    <div class="line-btn line-4" data-line="4">Línea 4</div>
    <div class="line-btn line-4A" data-line="4A">Línea 4A</div>
    <div class="line-btn line-5" data-line="5">Línea 5</div>
    <div class="line-btn line-5B" data-line="5B">Línea 5B</div>
  </div>
  
  <form id="reportForm" class="report-form">
    <input type="hidden" id="linea" value="">
    
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
    // Initialize with default line selected
    let selectedLine = null;
    
    // Add click handlers to line buttons
    document.querySelectorAll('.line-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedLine = btn.dataset.line;
        document.getElementById('linea').value = selectedLine;
        document.getElementById('activeLineDisplay').textContent = `Reportando problema en Línea ${selectedLine}`;
        document.getElementById('reportForm').style.display = 'block';
        
        // Highlight selected button
        document.querySelectorAll('.line-btn').forEach(b => b.style.opacity = '0.7');
        btn.style.opacity = '1';
        btn.style.border = '2px solid black';
        
        // Load reports for this line
        loadReports(selectedLine);
      });
    });
    
    // Form submission
    document.getElementById('reportForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const button = e.target.querySelector('button');
      button.disabled = true;
      button.textContent = 'Enviando...';
      
      try {
        const response = await fetch('https://api.bloksel.com/metroCredentials/reportar', {
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
          loadReports(selectedLine);
          updateLineStatuses();
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
    
    async function loadReports(line = null) {
      try {
        const response = await fetch('https://api.bloksel.com/metroCredentials/reportes');
        let reports = await response.json();
        
        if (line) {
          reports = reports.filter(r => r.linea === line);
        }
        
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
    
    // Update line status indicators
    async function updateLineStatuses() {
      try {
        const response = await fetch('https://api.bloksel.com/metroCredentials/reportes');
        const reports = await response.json();
        
        document.querySelectorAll('.line-btn').forEach(btn => {
          const line = btn.dataset.line;
          const lineReports = reports.filter(r => r.linea === line && r.status !== 'resuelto');
          const statusEl = document.createElement('div');
          statusEl.className = 'line-status';
          
          if (lineReports.length === 0) {
            statusEl.className += ' status-good';
            statusEl.textContent = '✓';
          } else if (lineReports.length < 3) {
            statusEl.className += ' status-warning';
            statusEl.textContent = lineReports.length;
          } else {
            statusEl.className += ' status-bad';
            statusEl.textContent = lineReports.length;
          }
          
          // Remove existing status if any
          const existingStatus = btn.querySelector('.line-status');
          if (existingStatus) {
            btn.removeChild(existingStatus);
          }
          
          btn.appendChild(statusEl);
        });
      } catch (err) {
        console.error('Error al actualizar estados:', err);
      }
    }
    
    // Initial load
    updateLineStatuses();
    loadReports();
  </script>
</body>
</html>
