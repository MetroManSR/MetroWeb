---
layout: default
title: "Comunidad Metro de Santiago"
language: es
---

# **Bienvenido/a a la Comunidad No Oficial del Metro de Santiago**  

### **🔗 Únete a la Conversación**  
¡Conéctate con otros amantes del metro! Usa estos enlaces: 

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; margin: 30px 0; place-items: center;">
  <a href="https://discord.gg/z7AfQZZaGD" class="social-circle">
    <img src="https://github.com/user-attachments/assets/f9fa4e5f-248f-4247-b1f5-a258c5ac192d" alt="Discord">
  </a>
  <a href="https://chat.whatsapp.com/H1ECcZwlVxZFpwmG85GxCB" class="social-circle">
    <img src="https://github.com/user-attachments/assets/5c1cbea1-5048-4e16-b3ae-3ad0d6b50f80" alt="WhatsApp">
  </a>
  <a href="https://www.reddit.com/r/metrosantiago/s/S9wvlFkjjF" class="social-circle">
    <img src="https://github.com/user-attachments/assets/94a232e7-2777-40d0-9f00-a9f13da717e7" alt="Reddit">
  </a>
  <a href="https://t.me/metrosantiago" class="social-circle">
    <img src="https://github.com/user-attachments/assets/c6fbdcfb-6cbd-4e56-86eb-6298783fafa1" alt="Telegram">
  </a>
</div>

<style>
  .social-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid #ff0000;
    overflow: hidden; /* This clips the image to the circle */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
    background: transparent;
  }
  
  .social-circle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 0, 0, 0.1);
    transform: scale(0);
    transition: transform 0.3s ease;
    z-index: 1;
  }
  
  .social-circle:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(255, 0, 0, 0.2);
    border-color: #ff3333;
  }
  
  .social-circle:active {
    transform: translateY(0) scale(0.95);
  }
  
  .social-circle:hover::before {
    transform: scale(1);
  }
  
  .social-circle img {
    width: 100%; /* Image will fill container but maintain aspect ratio */
    height: 100%;
    object-fit: cover; /* This will crop the image to fill the circle */
    transition: transform 0.3s ease;
  }
  
  .social-circle:hover img {
    transform: scale(1.1);
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(255, 0, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
  }
  
  .social-circle:focus {
    outline: none;
    animation: pulse 0.75s;
  }
</style>

Un espacio para pasajeros frecuentes y fans del metro de Santiago. Aquí encontrarás actualizaciones, discusiones y recursos sobre la red de transporte y trenes urbanos.  

### **🌟 Qué Ofrecemos**  
- **Información en tiempo real**: Estado de las líneas, alertas de servicio y noticias oficiales.  
- **Discusión y comunidad**: Comparte tips, experiencias o temas no relacionados en canales dedicados.  
- **Recompensas por participación**: Gana reconocimiento según tu actividad en el servidor.  

### **⚠️ Importante**  
```diff  
- NO ESTAMOS ASOCIADOS A METRO S.A.  
```  
Somos una comunidad **independiente** sin vínculo oficial con la empresa.  

**Si representas a Metro S.A. y necesitas contactar al desarrollador del bot**, escribe a `metromanrrss`.  
### **🌐 Enlaces Oficiales del Metro de Santiago**  
- [Sitio web](https://www.metro.cl)  
- [Facebook](https://www.facebook.com/Metrostgo/)  
- [Instagram](https://www.instagram.com/metrodesantiago/)  
- [Twitter/X](https://twitter.com/metrodesantiago)  

**¡Te esperamos para compartir y aprender juntos!** 🚇  
```

