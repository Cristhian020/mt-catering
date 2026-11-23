# Web de MT Catering

Web informativa de MT Catering con un formulario de cotización. Al enviarlo:

1. la cotización **llega a tu correo** (por medio de Web3Forms, gratis hasta 250 envíos al mes);
2. el cliente es **llevado a tu WhatsApp** con el resumen de la cotización ya escrito.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Página de inicio: portada, nosotros, servicios, cómo funciona, galería y contacto |
| `cotizar.html` | Formulario de cotización en 4 pasos |
| `js/config.js` | **Tus datos**: correo, WhatsApp, teléfono, dirección, redes. Es el único archivo que tienes que editar |
| `css/styles.css` | Diseño (colores, letras, tamaños) |
| `js/main.js` | Menú, animaciones y galería |
| `js/cotizar.js` | Funcionamiento del formulario |
| `img/` | Logo, ícono de la pestaña y fotos |

## Antes de publicar (5 minutos)

### 1. Recibir las cotizaciones en tu correo
1. Entra a <https://web3forms.com>.
2. Escribe el correo donde quieres recibir las cotizaciones y pulsa **Create Access Key**.
3. Te llega un correo con tu **Access Key**.
4. Abre `js/config.js` y pégala en `web3formsKey`, por ejemplo:
   ```js
   web3formsKey: 'a1b2c3d4-e5f6-....',
   ```

### 2. Tu número de WhatsApp
En `js/config.js`, en `whatsapp`, pon el número **con código de país, sin +, espacios ni guiones**.
Ejemplo para República Dominicana: `'18095551234'`.

### 3. Tus datos de contacto
En el mismo archivo cambia `telefono`, `correo`, `direccion`, `horario` y, si tienes, los enlaces de `instagram`, `facebook` y `linkedin` (los que dejes vacíos no se muestran).

### 4. (Opcional) Precio estimado
Si quieres que el formulario muestre un rango de precio aproximado, cambia `mostrarEstimado` a `true` y pon tu precio base por persona en `tarifaBase`. Mientras no tengas tarifas definidas, déjalo en `false`.

## Ver la web en tu computadora
Abre `index.html` con doble clic para verla. El envío al correo conviene probarlo con la web ya publicada (paso siguiente): haz una cotización de prueba y revisa que te llegue.

## Publicarla gratis en internet (Netlify)
1. Entra a <https://app.netlify.com/drop> y crea una cuenta gratuita.
2. Arrastra **la carpeta completa** `pagina web` a la página.
3. En unos segundos te da un enlace del tipo `https://nombre.netlify.app`.
4. Si compras un dominio (por ejemplo `mtcatering.com`), en Netlify puedes conectarlo en *Domain settings*.

Cada vez que cambies algo, vuelve a arrastrar la carpeta.

## Galería de eventos (subir fotos de tus eventos)
Cada evento es una **carpeta** dentro de `eventos/`, con la fecha y el nombre, por ejemplo `2026-11-15 Almuerzo Banco Popular`, y sus fotos adentro.

1. Crea la carpeta en tu computadora y mete las fotos (como salen del celular).
2. Entra a <https://github.com/Cristhian020/mt-catering/upload/main/eventos> y **arrastra la carpeta completa**.
3. Pulsa **Commit changes**.

En 2 o 3 minutos el evento aparece en la sección **Galería** de la web: el más reciente sale primero y en grande, y al tocarlo se abren todas sus fotos. Las fotos se achican solas para que la web cargue rápido. Instrucciones completas en [eventos/LEEME.md](eventos/LEEME.md).

Mientras no haya ningún evento, la galería muestra las fotos de muestra.

### Cómo se publica
Cada vez que se sube algo a GitHub, el proceso de `.github/workflows/publicar.yml` ejecuta `scripts/construir.mjs`, que prepara las fotos y publica la web en GitHub Pages. Puedes ver el progreso en la pestaña **Actions** del repositorio.

## Fotos
Las fotos de `img/fotos/` son de **Unsplash** y **Pexels** (licencias gratuitas, se pueden usar en webs comerciales; las de las tarjetas de servicios son `servicio-*.jpg`, de Pexels) y sirven de referencia. Lo ideal es cambiarlas por fotos de tus propios platos y servicios **usando el mismo nombre de archivo**, así no hay que tocar el código. Tamaño recomendado: unos 1600 px de ancho y menos de 400 KB.

## Herramientas que usa
- **GSAP** (animaciones al cargar y al hacer scroll)
- **GLightbox** (galería a pantalla completa)
- **Web3Forms** (envío del formulario al correo)
- **Google Fonts**: Cormorant Garamond y Manrope
