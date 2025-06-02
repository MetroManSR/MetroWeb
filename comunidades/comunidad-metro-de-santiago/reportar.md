Si encuentras un error favor reportar a MetroMan en una de las Redes de la Comunidad Metro de Santiago. 

<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reportar Problemas - MetroMan</title>
  <style>
    body { font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    select, input, button { width: 100%; padding: 10px; border: 1px solid #ddd; }
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
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      color: white;
    }
  
    .line-btn:hover {
      opacity: 0.9;
    }

    
    .report-form { display: none; margin-top: 20px; }
    .active-line { 
      display: block;
      padding: 10px;
      margin-bottom: 15px;
      font-weight: bold;
      text-align: center;
      background: #f5f5f5;
      border-radius: 5px;
    }
    
    /* Quantity input */
    .quantity-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .quantity-group input {
      width: 80px;
      text-align: center;
    }
    
    /* Loading spinner */
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Unselect button */
    .unselect-btn {
      background: #f44336;
      margin-top: 10px;
      padding: 8px;
      font-size: 0.9em;
    }
    
    /* Report summary */
    .report-summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    /* Status indicators */
.line-status {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}
.status-good { 
  background: #4CAF50;
  content: '✓';
}
.status-warning { 
  background: #FFC107;
  color: black;
}
.status-bad { 
  background: #F44336; 
}
  </style>
</head>
<body>
  <h1>Reportar Problema en el Metro</h1>
  
  <div class="active-line" id="activeLineDisplay">Seleccione una línea</div>
  
  <div class="line-buttons">
    <div class="line-btn line-1" data-line="1"></div>
    <div class="line-btn line-2" data-line="2"></div>
    <div class="line-btn line-3" data-line="3"></div>
    <div class="line-btn line-4" data-line="4"></div>
    <div class="line-btn line-4A" data-line="4A"></div>
    <div class="line-btn line-5" data-line="5"></div>
    <div class="line-btn line-5B" data-line="6"></div>
  </div>
  
  <form id="reportForm" class="report-form">
    <input type="hidden" id="linea" value="">
    
    <div class="form-group">
      <label for="problema">Tipo de Problema:</label>
      <select id="problema" required>
        <option value="">Seleccione un problema</option>
        <option value="Retraso">Retraso en el servicio</option>
        <option value="Colapso">Estaciones Colapsadas</option>
        <option value="Lleno">Trenes Llenos</option>
        <option value="Parcial">Servicio Interrumpido</option>
        <option value="Cierre Estación">Estación Cerrada</option>
        <option value="Combinación Suspendida">Combinación Suspendida</option>
        <option value="Corte de Energía">Corte de Energía en las Vías</option>
        <option value="Apagón">Apagón, Estaciones a oscuras</option>
        <option value="Avería Tren">Avería de Tren</option>
        <option value="Avería Vía">Avería en la Vía</option>
      </select>
    </div>
    
    <button type="submit" id="submitBtn">
      <span id="submitText">Enviar Reporte</span>
    </button>
    
    <button type="button" class="unselect-btn" id="unselectBtn">Deseleccionar Línea</button>
  </form>
  
  <h2>Últimos Reportes</h2>
  <div id="reportsList"></div>
  
  <script>
    // Initialize with no line selected
    let selectedLine = null;
    let isLoading = false;
    
    // Update quantity label based on problem type
    const problemaSelect = document.getElementById('problema');
    
    
 /*   problemaSelect.addEventListener('change', () => {
      const problemType = problemaSelect.value;
      if (problemType === 'Colapso' || problemType === 'Cierre Estación') {
        cantidadLabel.textContent = 'estación(es)';
      } else if (problemType === 'Lleno' || problemType === 'Avería Tren') {
        cantidadLabel.textContent = 'tren(es)';
      } else if (problemType === 'Avería Vía' || problemType === 'Corte de Energía') {
        cantidadLabel.textContent = 'sección(es)';
      } else {
        cantidadLabel.textContent = 'incidente(s)';
      }
    });*/
    
    // Add click handlers to line buttons
    document.querySelectorAll('.line-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectLine(btn.dataset.line);
      });
    });
    
    // Unselect line button
    document.getElementById('unselectBtn').addEventListener('click', () => {
      unselectLine();
    });
    
    function selectLine(line) {
      selectedLine = line;
      document.getElementById('linea').value = selectedLine;
      document.getElementById('activeLineDisplay').textContent = `Reportando problema en Línea ${selectedLine}`;
      document.getElementById('reportForm').style.display = 'block';
      
      // Highlight selected button
      document.querySelectorAll('.line-btn').forEach(b => {
        b.style.opacity = '0.7';
        b.style.border = '2px solid transparent';
      });
      
      const selectedBtn = document.querySelector(`.line-btn[data-line="${line}"]`);
      selectedBtn.style.opacity = '1';
      selectedBtn.style.border = '2px solid black';
      
      // Load reports for this line
      loadReports(selectedLine);
    }
    
    function unselectLine() {
      selectedLine = null;
      document.getElementById('linea').value = '';
      document.getElementById('activeLineDisplay').textContent = 'Seleccione una línea';
      document.getElementById('reportForm').style.display = 'none';
      document.getElementById('reportForm').reset();
      
      // Reset all line buttons
      document.querySelectorAll('.line-btn').forEach(b => {
        b.style.opacity = '1';
        b.style.border = '2px solid transparent';
      });
      
      // Load all reports
      loadReports();
    }
    
    // Form submission
    document.getElementById('reportForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (isLoading) return;
      
      const button = e.target.querySelector('button');
      const submitText = document.getElementById('submitText');
      
      button.disabled = true;
      submitText.textContent = '';
      document.getElementById('submitBtn').innerHTML = '<div class="spinner"></div>';
      isLoading = true;
      
      try {
        const response = await fetch('https://api.bloksel.com/metroCredentials/reportar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linea: document.getElementById('linea').value,
            problema: document.getElementById('problema').value,
        /*    cantidad: document.getElementById('cantidad').value,*/
            descripcion: `${document.getElementById('problema').value} (${document.getElementById('cantidad').value} ${cantidadLabel.textContent.split('(')[0].trim()})`
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
        document.getElementById('submitBtn').innerHTML = '<span id="submitText">Enviar Reporte</span>';
        isLoading = false;
      }
    });
    
    async function loadReports(line = null) {
      const container = document.getElementById('reportsList');
      container.innerHTML = '<p>Cargando reportes...</p>';
      
      try {
        const response = await fetch('https://api.bloksel.com/metroCredentials/reportes');
        const data = await response.json();
        
        // Handle both direct array response and object with reports property
        let reports = Array.isArray(data) ? data : (data.reports || []);
        
        if (line) {
          reports = reports.filter(r => r.linea === line);
        }
        
        // Group reports by type
        const reportSummary = {};
        reports.forEach(report => {
          const problemType = report.problema || report.problem || 'Otro';
          if (!reportSummary[problemType]) {
            reportSummary[problemType] = {
              count: 0,
              lastDate: null
            };
          }
          reportSummary[problemType].count++;
          
          const reportDate = report.created_at ? new Date(report.created_at) : null;
          if (reportDate && (!reportSummary[problemType].lastDate || reportDate > reportSummary[problemType].lastDate)) {
            reportSummary[problemType].lastDate = reportDate;
          }
        });
        
        // Convert to Chile timezone
        const formatChileTime = (date) => {
          if (!date) return 'Fecha no disponible';
          return date.toLocaleString('es-CL', {
            timeZone: 'America/Santiago',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        };
        
        // Display reports
        if (reports.length === 0) {
          container.innerHTML = '<p>No hay reportes para esta línea</p>';
        } else {
          container.innerHTML = `
            <div class="report">
              <h3>Resumen de Reportes</h3>
              ${Object.entries(reportSummary).map(([problem, data]) => `
                <div class="report-summary">
                  <span><strong>${problem}:</strong> ${data.count} reporte(s)</span>
                  <span>Último: ${formatChileTime(data.lastDate)}</span>
                </div>
              `).join('')}
            </div>
            
            <h3>Reportes Recientes</h3>
            ${reports.slice(0, 5).map(report => `
              <div class="report">
                <strong>Línea ${report.linea}</strong> - ${report.problema || report.problem || 'Sin tipo'}
                <span class="status ${report.status || 'pendiente'}">${
                  (report.status || 'pendiente').replace('_', ' ')
                }</span>
                <p>${report.descripcion || report.description || 'Sin detalles'}</p>
                <small>${formatChileTime(report.created_at ? new Date(report.created_at) : null)}</small>
              </div>
            `).join('')}
          `;
        }
      } catch (err) {
        console.error('Error al cargar reportes:', err);
        container.innerHTML = '<p>Error al cargar los reportes. Intente nuevamente.</p>';
      }
    }
    
async function updateLineStatuses() {
  try {
    const response = await fetch('https://api.bloksel.com/metroCredentials/reportes');
    const data = await response.json();
    const reports = Array.isArray(data) ? data : (data.reports || []);
    
    document.querySelectorAll('.line-btn').forEach(btn => {
      const line = btn.dataset.line;
      const lineReports = reports.filter(r => r.linea === line && r.status !== 'resuelto');
      const statusEl = document.createElement('div');
      statusEl.className = 'line-status';
      
      if (lineReports.length === 0) {
        statusEl.className += ' status-good';
        statusEl.textContent = '✓'; // Checkmark for good status
      } else if (lineReports.length < 3) {
        statusEl.className += ' status-warning';
        statusEl.textContent = '!'; // Exclamation for warning
      } else {
        statusEl.className += ' status-bad';
        statusEl.textContent = '✗'; // X mark for bad status
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
    
    // Function to set background images for buttons
    function setButtonBackgrounds() {
      document.querySelectorAll('.line-btn').forEach(btn => {
        const line = btn.dataset.line;
        btn.style.backgroundImage = `url('https://upload.wikimedia.org/wikipedia/commons/thumb/${getLineImagePath(line)}')`;
        btn.style.backgroundSize = 'contain';
        btn.style.backgroundRepeat = 'no-repeat';
        btn.style.backgroundPosition = 'center';
      });
    }

    function getLineImagePath(line) {
      switch(line) {
        case '1': return '3/38/Santiago_de_Chile_L1.svg/600px-Santiago_de_Chile_L1.svg.png';
        case '2': return 'd/de/Santiago_de_Chile_L2.svg/600px-Santiago_de_Chile_L2.svg.png';
        case '3': return '9/9f/Santiago_de_Chile_L3.svg/599px-Santiago_de_Chile_L3.svg.png';
        case '4': return 'b/bb/Santiago_de_Chile_L4.svg/600px-Santiago_de_Chile_L4.svg.png';
        case '4A': return 'a/ac/Santiago_de_Chile_L4A.svg/599px-Santiago_de_Chile_L4A.svg.png';
        case '5': return '1/1e/Santiago_de_Chile_L5.svg/600px-Santiago_de_Chile_L5.svg.png';
        case '6': return '2/22/Santiago_de_Chile_L6.svg/600px-Santiago_de_Chile_L6.svg.png';
        default: return '';
      }
    }
    
    // Initial load
    setButtonBackgrounds();
    updateLineStatuses();
    loadReports();
  </script>
</body>
</html>
