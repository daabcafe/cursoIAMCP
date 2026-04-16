# Plan de implementación — Gestor de Tareas ICE

Documento de referencia para implementar el MVP en 8 tareas secuenciales.
Cada tarea indica qué archivos crear, qué debe hacer cada uno, las props/tipos exactos y cómo verificar que funciona antes de pasar a la siguiente.

Documentos fuente:
- `alcance-mvp-gestor-tareas-ice.md` — alcance funcional.
- `ux-gestor-tareas-ice.md` — secciones 10.1, 10.2 y 10.3 — arquitectura validada.

---

## Tarea 1. Scaffold del proyecto y dependencias

**Objetivo**: tener un proyecto Vite + React + TypeScript arrancando con Material UI y la estructura de carpetas vacía.

**Comandos**:

```bash
npm create vite@latest gestor-tareas-ice -- --template react-ts
cd gestor-tareas-ice
npm install
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

**Estructura de carpetas a crear** (vacías por ahora):

```
src/
├── types/
├── hooks/
├── services/
├── utils/
├── components/
│   ├── layout/
│   ├── tasks/
│   ├── modal/
│   └── ui/
```

**Limpieza de boilerplate**:
- Eliminar `src/App.css`, `src/index.css` y los assets de ejemplo de Vite.
- Dejar `App.tsx` con un `<CssBaseline />` de MUI y un texto placeholder.
- En `main.tsx` envolver `<App />` en `<ThemeProvider>` con el tema por defecto de MUI.

**Archivo `.env` en la raíz del proyecto**:

```
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

Añadir `.env` a `.gitignore`.

**Verificación**: `npm run dev` arranca sin errores, el navegador muestra el texto placeholder con la tipografía Roboto de MUI.

---

## Tarea 2. Tipos y utilidades puras

**Objetivo**: definir los contratos de datos y las funciones de cálculo que usará toda la app. Son módulos sin dependencia de React.

### Archivo `src/types/task.ts`

Exportar las siguientes interfaces:

```ts
export interface Task {
  id: string
  name: string
  description: string
  impact: number | null
  confidence: number | null
  ease: number | null
}

export interface IceValues {
  impact: number
  confidence: number
  ease: number
}
```

Notas:
- `iceScore` NO existe como campo de `Task`. Es un valor derivado.
- `id` se generará con `crypto.randomUUID()` en el momento de crear la tarea.
- `impact`, `confidence` y `ease` son `null` hasta que el usuario o la IA los asignen.

### Archivo `src/utils/iceUtils.ts`

Exportar dos funciones puras:

**`calculateIce`**
- Firma: `(impact: number | null, confidence: number | null, ease: number | null) => number | null`
- Si alguno de los tres valores es `null`, devuelve `null`.
- Si todos son numéricos, devuelve `impact * confidence * ease`.

**`sortByIce`**
- Firma: `(tasks: Task[]) => Task[]`
- Devuelve una copia del array ordenada por ICE score descendente.
- Las tareas con score `null` van al final.
- Internamente usa `calculateIce` para obtener el score de cada tarea.
- No muta el array original.

**Verificación**: importar ambos módulos en `App.tsx`, invocar `calculateIce(8, 7, 6)` y confirmar que devuelve `336` en consola. Invocar `sortByIce` con un array de prueba y confirmar el orden.

---

## Tarea 3. Estado en App.tsx y layout base

**Objetivo**: montar el estado central, las funciones de actualización y el grid de dos columnas que servirá de esqueleto para el resto de componentes.

### Archivo `src/App.tsx`

**Estado**:

```ts
const [tasks, setTasks] = useState<Task[]>([])
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
```

**Funciones de actualización** (definidas en el cuerpo del componente):

`addTask(name: string, description: string) => void`
- Crea un objeto `Task` con `id: crypto.randomUUID()`, los campos `name` y `description` recibidos, y `impact`, `confidence`, `ease` a `null`.
- Añade la tarea al final del array con `setTasks(prev => [...prev, newTask])`.

`updateIce(id: string, impact: number, confidence: number, ease: number) => void`
- Busca la tarea por `id` y actualiza sus tres campos ICE.
- `setTasks(prev => prev.map(t => t.id === id ? { ...t, impact, confidence, ease } : t))`.

`openModal(id: string) => void`
- `setSelectedTaskId(id)`.

`closeModal() => void`
- `setSelectedTaskId(null)`.

**Variable derivada**:

```ts
const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null
```

**Layout** con `Grid` de MUI:

```tsx
<CssBaseline />
<Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
  {/* Navbar irá aquí — placeholder por ahora */}
  <Container maxWidth="xl" sx={{ mt: 2 }}>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        {/* TaskForm irá aquí — placeholder */}
      </Grid>
      <Grid item xs={12} md={8}>
        {/* TaskList irá aquí — placeholder */}
      </Grid>
    </Grid>
  </Container>
  {/* PriorityModal irá aquí — placeholder */}
</Box>
```

**Verificación**: la app muestra un layout de dos columnas en desktop y una sola columna en mobile. Los cuatro `useState` y funciones existen sin errores de TypeScript.

---

## Tarea 4. Navbar y componentes UI reutilizables

**Objetivo**: crear los bloques visuales atómicos que se reutilizarán en las tareas siguientes.

### Archivo `src/components/layout/Navbar.tsx`

**Props**:

```ts
interface NavbarProps {
  taskCount: number
}
```

**Composición MUI**:
- `AppBar` position `sticky` con color oscuro.
- `Toolbar` con:
  - `Typography` variant `h6`: "Gestor de Tareas ICE".
  - `Chip` con `label={taskCount + " tareas"}` alineado a la derecha.

**Conectar en App.tsx**: `<Navbar taskCount={tasks.length} />` antes del `Container`.

### Archivo `src/components/ui/IceField.tsx`

**Props**:

```ts
interface IceFieldProps {
  label: string            // "Impacto", "Confianza" o "Facilidad"
  value: number | null
  onChange: (value: number | null) => void
}
```

**Comportamiento**:
- `TextField` de MUI con `type="number"`, `inputProps={{ min: 1, max: 10 }}`.
- Si el valor está fuera del rango 1–10 o vacío, mostrar `error={true}` y `helperText="Valor entre 1 y 10"`.
- `onChange` parsea el valor a entero. Si es `NaN`, pasa `null`.
- `size="small"` para uso compacto.

### Archivo `src/components/ui/IceScoreDisplay.tsx`

**Props**:

```ts
interface IceScoreDisplayProps {
  impact: number | null
  confidence: number | null
  ease: number | null
}
```

**Comportamiento**:
- Llama a `calculateIce(impact, confidence, ease)`.
- Si el resultado es `null`, muestra "—" en gris.
- Si tiene valor, muestra el número en grande con `Typography` variant `h4` y color `primary`.
- Subtítulo "ICE Score" debajo en variant `caption`.

### Archivo `src/components/ui/EmptyState.tsx`

**Props**: ninguna.

**Comportamiento**:
- `Box` centrado con un `Typography` "Aún no hay tareas" y un subtítulo "Crea la primera tarea para empezar a priorizar con ICE".
- Icono opcional de MUI (`AssignmentOutlined`).

### Archivo `src/components/ui/LoadingOverlay.tsx`

**Props**: ninguna.

**Comportamiento**:
- `Box` centrado con `CircularProgress` y `Typography` "Consultando IA...".
- Se usa dentro del `PriorityModal`.

### Archivo `src/components/ui/ErrorAlert.tsx`

**Props**:

```ts
interface ErrorAlertProps {
  message: string
}
```

**Comportamiento**:
- `Alert` severity `error` con el mensaje recibido.

**Verificación**: renderizar cada componente en `App.tsx` con props hardcodeadas. Confirmar que `IceField` muestra error al escribir 0 o 11, que `IceScoreDisplay` muestra "—" con valores null y el score correcto con valores numéricos.

---

## Tarea 5. TaskForm — crear tareas

**Objetivo**: permitir al usuario crear tareas con nombre y descripción obligatorios.

### Archivo `src/components/tasks/TaskForm.tsx`

**Props**:

```ts
interface TaskFormProps {
  onAddTask: (name: string, description: string) => void
}
```

**Estado local**:

```ts
const [name, setName] = useState('')
const [description, setDescription] = useState('')
const [errors, setErrors] = useState<{ name?: string; description?: string }>({})
```

**Composición MUI**:
- `Card` con `CardContent`:
  - `Typography` variant `h6`: "Nueva tarea".
  - `TextField` fullWidth para nombre con error condicional.
  - `TextField` fullWidth multiline (3 rows) para descripción con error condicional.
  - `Button` variant `contained`: "Guardar tarea".

**Lógica del submit**:
1. Validar que `name.trim()` y `description.trim()` no estén vacíos.
2. Si hay errores, establecer `setErrors` con los mensajes correspondientes ("El nombre es obligatorio", "La descripción es obligatoria") y no continuar.
3. Si es válido, llamar a `onAddTask(name.trim(), description.trim())`.
4. Limpiar `name`, `description` y `errors`.

**Conectar en App.tsx**: reemplazar el placeholder de la columna izquierda por `<TaskForm onAddTask={addTask} />`.

**Verificación**: crear una tarea y confirmar en React DevTools o `console.log` que el array `tasks` contiene la tarea nueva con `impact`, `confidence` y `ease` a `null`. Intentar guardar con campos vacíos y confirmar que aparecen los mensajes de error.

---

## Tarea 6. TaskList, TaskCard y TaskCardIceEditor

**Objetivo**: mostrar las tareas ordenadas por score y permitir edición manual inline de los campos ICE.

### Archivo `src/components/tasks/TaskList.tsx`

**Props**:

```ts
interface TaskListProps {
  tasks: Task[]
  onUpdateIce: (id: string, impact: number, confidence: number, ease: number) => void
  onOpenModal: (id: string) => void
}
```

**Comportamiento**:
- Derivar lista ordenada: `const sorted = useMemo(() => sortByIce(tasks), [tasks])`.
- Si `sorted.length === 0`, renderizar `<EmptyState />`.
- Si hay tareas, renderizar un `Stack spacing={2}` con un `TaskCard` por tarea.
- Encabezado `Typography` variant `h6`: "Tareas priorizadas".

### Archivo `src/components/tasks/TaskCard.tsx`

**Props**:

```ts
interface TaskCardProps {
  task: Task
  onUpdateIce: (id: string, impact: number, confidence: number, ease: number) => void
  onOpenModal: (id: string) => void
}
```

**Composición MUI**:
- `Card` con `CardContent`:
  - `Typography` variant `subtitle1` bold: `task.name`.
  - `Typography` variant `body2` color `text.secondary`: `task.description`.
  - `TaskCardIceEditor` pasando los campos ICE actuales y `onUpdateIce`.
  - `IceScoreDisplay` con `impact`, `confidence`, `ease` de la tarea.
- `CardActions`:
  - `Button` variant `contained` color `primary`: "Calcular ICE con IA" → llama a `onOpenModal(task.id)`.

**Layout interno**: usar `Grid` o `Stack direction="row"` para colocar el editor ICE a la izquierda y el score a la derecha.

### Archivo `src/components/tasks/TaskCardIceEditor.tsx`

**Props**:

```ts
interface TaskCardIceEditorProps {
  taskId: string
  impact: number | null
  confidence: number | null
  ease: number | null
  onUpdateIce: (id: string, impact: number, confidence: number, ease: number) => void
}
```

**Estado local**:

```ts
const [localImpact, setLocalImpact] = useState<number | null>(impact)
const [localConfidence, setLocalConfidence] = useState<number | null>(confidence)
const [localEase, setLocalEase] = useState<number | null>(ease)
```

Sincronizar con props usando `useEffect` cuando cambien los valores externos (por ejemplo, después de confirmar desde el modal).

**Composición**:
- Tres `IceField` en fila para Impacto, Confianza y Facilidad.
- `Button` size `small` variant `outlined`: "Aplicar" → solo habilitado si los tres valores son números entre 1 y 10 → llama a `onUpdateIce(taskId, localImpact!, localConfidence!, localEase!)`.

**Conectar en App.tsx**: reemplazar el placeholder de la columna derecha por `<TaskList tasks={tasks} onUpdateIce={updateIce} onOpenModal={openModal} />`.

**Verificación**:
1. Crear 3 tareas desde el formulario.
2. Editar manualmente los campos ICE de la primera tarea: Impacto 8, Confianza 7, Facilidad 6 → pulsar "Aplicar".
3. Confirmar que el ICE Score muestra 336.
4. Editar la segunda tarea con valores más altos y confirmar que sube al primer puesto de la lista.
5. Confirmar que la tercera tarea sin ICE queda al final con score "—".

---

## Tarea 7. geminiService y useIceAi

**Objetivo**: implementar la capa de integración con la API de Gemini y el hook que gestiona el ciclo async de sugerencia.

### Archivo `src/services/geminiService.ts`

**Función exportada**:

```ts
export async function fetchIceSuggestion(description: string): Promise<IceValues>
```

**Implementación**:
1. Leer la API key desde `import.meta.env.VITE_GEMINI_API_KEY`.
2. Construir el endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`.
3. Enviar un `POST` con `fetch` y el siguiente body:

```json
{
  "contents": [{
    "parts": [{
      "text": "Dado el siguiente descripción de tarea: \"${description}\"\n\nAsigna valores de Impacto, Confianza y Facilidad en una escala de 1 a 10 para calcular la prioridad ICE.\n\nResponde SOLO con un JSON válido con este formato exacto:\n{\"impact\": N, \"confidence\": N, \"ease\": N}\n\nSin explicaciones adicionales."
    }]
  }]
}
```

4. Parsear la respuesta: extraer el texto de `response.candidates[0].content.parts[0].text`.
5. Limpiar el texto de posibles backticks markdown y parsear con `JSON.parse`.
6. Validar que los tres campos son números entre 1 y 10. Si no, lanzar error.
7. Devolver el objeto `IceValues` tipado.
8. Si `fetch` falla o la respuesta no es parseable, lanzar un `Error` descriptivo.

**Seguridad**: la API key se lee de variable de entorno y no se hardcodea. El `.env` ya está en `.gitignore` desde la Tarea 1.

### Archivo `src/hooks/useIceAi.ts`

**Interfaz del hook**:

```ts
interface UseIceAiReturn {
  status: 'idle' | 'loading' | 'success' | 'error'
  suggestion: IceValues | null
  error: string | null
  fetchSuggestion: (description: string) => Promise<void>
  reset: () => void
}

export function useIceAi(): UseIceAiReturn
```

**Estado interno**:

```ts
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
const [suggestion, setSuggestion] = useState<IceValues | null>(null)
const [error, setError] = useState<string | null>(null)
```

**`fetchSuggestion(description)`**:
1. `setStatus('loading')`, `setError(null)`, `setSuggestion(null)`.
2. Llamar a `fetchIceSuggestion(description)` dentro de un try/catch.
3. En caso de éxito: `setSuggestion(result)`, `setStatus('success')`.
4. En caso de error: `setError(err.message)`, `setStatus('error')`.

**`reset()`**: vuelve al estado `idle` con `suggestion` y `error` a null.

**Verificación**: importar el hook en un componente temporal, llamar a `fetchSuggestion` con una descripción de prueba y confirmar en consola que devuelve tres valores numéricos entre 1 y 10. Probar con API key vacía y confirmar que el status cambia a `error`.

---

## Tarea 8. PriorityModal — flujo completo IA + confirmación

**Objetivo**: cerrar el flujo end-to-end: abrir modal → consultar IA → revisar y ajustar → confirmar → la lista se reordena.

### Archivo `src/components/modal/PriorityModal.tsx`

**Props**:

```ts
interface PriorityModalProps {
  task: Task | null
  onUpdateIce: (id: string, impact: number, confidence: number, ease: number) => void
  onClose: () => void
}
```

**Estado local**:

```ts
const [localImpact, setLocalImpact] = useState<number | null>(null)
const [localConfidence, setLocalConfidence] = useState<number | null>(null)
const [localEase, setLocalEase] = useState<number | null>(null)
```

**Integración con useIceAi**:

```ts
const { status, suggestion, error, fetchSuggestion, reset } = useIceAi()
```

**Efecto al abrir** (`useEffect` que depende de `task`):
- Si `task` no es null, llamar a `fetchSuggestion(task.description)`.
- Si `task` es null, llamar a `reset()` e inicializar los valores locales a null.

**Efecto al recibir sugerencia** (`useEffect` que depende de `suggestion`):
- Si `suggestion` no es null, rellenar `localImpact`, `localConfidence` y `localEase` con los valores sugeridos.

**Composición MUI**:

```
Dialog open={task !== null} onClose={onClose} maxWidth="sm" fullWidth
  DialogTitle: "Revisar prioridad sugerida por IA"
  DialogContent:
    - Resumen de la tarea: Typography con task.name y task.description.
    - Divider.
    - Si status === 'loading': LoadingOverlay.
    - Si status === 'error': ErrorAlert con el mensaje de error + Button "Reintentar" que vuelve a llamar a fetchSuggestion.
    - Si status === 'success' o valores locales editados manualmente:
      - Tres IceField para Impacto, Confianza y Facilidad conectados al estado local.
      - IceScoreDisplay con los valores locales (recalcula en vivo con calculateIce).
      - Typography caption: "Rango válido: 1 a 10. Puedes ajustar antes de confirmar."
  DialogActions:
    - Button variant "outlined": "Cancelar" → llama a onClose.
    - Button variant "contained": "Confirmar prioridad"
      - Deshabilitado si algún valor local es null o está fuera de rango 1–10.
      - Al pulsar: onUpdateIce(task.id, localImpact!, localConfidence!, localEase!) y después onClose().
```

**Conectar en App.tsx**: reemplazar el placeholder del modal por:

```tsx
<PriorityModal
  task={selectedTask}
  onUpdateIce={updateIce}
  onClose={closeModal}
/>
```

**Verificación — flujo end-to-end completo**:
1. Crear una tarea con nombre "Reducir churn" y descripción "Mejorar emails de activación para reducir abandono en el periodo de prueba".
2. Pulsar "Calcular ICE con IA" en la tarjeta.
3. Confirmar que el modal se abre y muestra "Consultando IA...".
4. Esperar a que la IA responda y confirmar que los tres campos se rellenan con valores entre 1 y 10.
5. Modificar manualmente el valor de Impacto a 9 y confirmar que el ICE Score se recalcula en vivo.
6. Pulsar "Confirmar prioridad".
7. Confirmar que el modal se cierra, la tarjeta muestra el score actualizado y la lista se reordena.
8. Repetir con una segunda tarea y confirmar que la de mayor score queda arriba.
9. Probar el flujo de error: quitar la API key del `.env`, reiniciar, pulsar "Calcular ICE con IA" y confirmar que el modal muestra el error con opción de reintentar.

---

## Resumen de dependencias entre tareas

```
T1 Scaffold
 └─ T2 Tipos + utils
      ├─ T3 Estado + layout        (paralelo con T7)
      │    └─ T4 Navbar + ui/
      │         └─ T5 TaskForm
      │              └─ T6 TaskList + TaskCard + TaskCardIceEditor
      │                   └─ T8 PriorityModal (necesita T6 + T7)
      └─ T7 geminiService + useIceAi
```

## Archivos totales a crear

| Tarea | Archivos nuevos |
|-------|----------------|
| T1 | Proyecto Vite, `.env`, `.gitignore` actualizado |
| T2 | `src/types/task.ts`, `src/utils/iceUtils.ts` |
| T3 | `src/App.tsx` (reescrito) |
| T4 | `src/components/layout/Navbar.tsx`, `src/components/ui/IceField.tsx`, `src/components/ui/IceScoreDisplay.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/LoadingOverlay.tsx`, `src/components/ui/ErrorAlert.tsx` |
| T5 | `src/components/tasks/TaskForm.tsx` |
| T6 | `src/components/tasks/TaskList.tsx`, `src/components/tasks/TaskCard.tsx`, `src/components/tasks/TaskCardIceEditor.tsx` |
| T7 | `src/services/geminiService.ts`, `src/hooks/useIceAi.ts` |
| T8 | `src/components/modal/PriorityModal.tsx` |

**Total: 15 archivos de código fuente** + configuración del proyecto.
