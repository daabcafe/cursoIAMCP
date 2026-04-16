# Alcance funcional MVP

App web en React, sin backend ni persistencia, para curso corto.

Cada tarea incluye:
- Nombre (obligatorio).
- Descripción (obligatoria).
- Impacto, Confianza y Facilidad (editables, escala 1 a 10).
- ICE Score calculado como Impacto x Confianza x Facilidad.

Funcionalidades:
1. Crear y listar tareas en memoria de sesión.
2. Editar manualmente los tres campos ICE por tarea.
3. Botón "Calcular ICE con IA" por tarea que envía la descripción a la API de Gemini y rellena Impacto, Confianza y Facilidad.
4. Validar que cada campo ICE esté entre 1 y 10 antes de calcular.
5. Recalcular ICE tras edición manual o respuesta de IA.
6. Ordenar tareas por puntuación ICE de mayor a menor.
7. Mostrar estados básicos: cargando y error de API.

Fuera de alcance:
- Autenticación.
- Base de datos.
- Persistencia local/remota.
- Funciones avanzadas (etiquetas, fechas, adjuntos, colaboración).

Criterio de éxito:
Flujo completo crear tarea -> editar o autocompletar ICE con Gemini -> calcular -> ordenar por puntuación.
