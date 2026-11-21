/*
 * Prepara la web para publicarla (lo ejecuta GitHub Actions cada vez que se sube algo):
 *  1. Copia la web a la carpeta _site.
 *  2. Lee la carpeta eventos/: cada subcarpeta es un evento, por ejemplo
 *       eventos/2026-11-15 Almuerzo Banco Popular/foto1.jpg, foto2.jpg ...
 *     De ahí saca la fecha y el nombre del evento, achica las fotos para que carguen rápido
 *     y prepara una portada (la foto llamada "portada", o si no hay, la primera).
 *  3. Crea _site/data/eventos.json, que la galería de la página de inicio lee sola.
 *
 * Para probarlo a mano:  node scripts/construir.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_site');
const NO_COPIAR = new Set(['_site', '.git', '.github', '.claude', 'scripts', 'eventos', 'node_modules', '.gitignore']);
const ES_FOTO = /\.(jpe?g|png|webp)$/i;

/* ---------- 1. Copiar la web ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const name of fs.readdirSync(ROOT)) {
  if (NO_COPIAR.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

/* ---------- 2. Herramienta para achicar fotos (ImageMagick) ---------- */
function buscarMagick() {
  const candidatos = process.platform === 'win32' ? ['magick'] : ['magick', 'convert'];
  for (const bin of candidatos) {
    try { execFileSync(bin, ['-version'], { stdio: 'ignore' }); return bin; } catch { /* no está */ }
  }
  return null;
}
const magick = buscarMagick();
if (!magick) console.warn('Aviso: ImageMagick no está instalado; las fotos se copian sin achicar.');

function slug(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'evento';
}

function fechaDeGit(rel) {
  try {
    return execFileSync('git', ['log', '--diff-filter=A', '--format=%cI', '--', rel],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n').pop() || '';
  } catch { return ''; }
}

function fechaLocal(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function leerNombreCarpeta(nombre) {
  let fecha = '';
  let titulo = nombre;
  const m = nombre.match(/^(\d{4})[-_.](\d{2})[-_.](\d{2})[\s_.-]*/);
  if (m) { fecha = `${m[1]}-${m[2]}-${m[3]}`; titulo = nombre.slice(m[0].length); }
  titulo = titulo.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
  return { fecha, titulo: titulo || 'Evento' };
}

function procesar(origen, destino, maximo) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  if (magick) {
    execFileSync(magick, [origen, '-auto-orient', '-background', 'white', '-flatten',
      '-resize', `${maximo}x${maximo}>`, '-strip', '-quality', '80', '-interlace', 'Plane', destino]);
  } else {
    fs.copyFileSync(origen, destino);
  }
}

/* ---------- 3. Procesar los eventos ---------- */
const eventos = [];
const dirEventos = path.join(ROOT, 'eventos');
const slugs = new Set();

if (fs.existsSync(dirEventos)) {
  for (const carpeta of fs.readdirSync(dirEventos, { withFileTypes: true })) {
    if (!carpeta.isDirectory()) continue;
    const dir = path.join(dirEventos, carpeta.name);
    const archivos = fs.readdirSync(dir).filter((f) => ES_FOTO.test(f))
      .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    if (!archivos.length) continue;

    const { fecha: fechaNombre, titulo } = leerNombreCarpeta(carpeta.name);
    const relCarpeta = path.relative(ROOT, dir).split(path.sep).join('/');
    const subida = fechaDeGit(relCarpeta) || fechaLocal(fs.statSync(dir).mtime);

    let id = slug(carpeta.name);
    let n = 2;
    while (slugs.has(id)) id = `${slug(carpeta.name)}-${n++}`;
    slugs.add(id);

    const portadaArchivo = archivos.find((f) => /^portada\./i.test(f)) || archivos[0];
    const fotos = [];
    let numero = 1;
    for (const archivo of archivos) {
      const origen = path.join(dir, archivo);
      const ext = magick ? '.jpg' : path.extname(archivo).toLowerCase();
      const rel = `img/eventos/${id}/${String(numero).padStart(2, '0')}${ext}`;
      try {
        procesar(origen, path.join(OUT, rel), 1600);
      } catch (e) {
        console.warn(`No se pudo procesar ${relCarpeta}/${archivo}: ${e.message}`);
        continue;
      }
      fotos.push(rel);
      if (archivo === portadaArchivo) {
        const relPortada = `img/eventos/${id}/portada${ext}`;
        try { procesar(origen, path.join(OUT, relPortada), 900); } catch { /* usa la grande */ }
        fotos.portada = fs.existsSync(path.join(OUT, relPortada)) ? relPortada : rel;
        // La portada va primero en el álbum
        fotos.unshift(fotos.pop());
      }
      numero++;
    }
    if (!fotos.length) continue;

    eventos.push({
      id,
      titulo,
      fecha: fechaNombre || subida.slice(0, 10),
      portada: fotos.portada || fotos[0],
      fotos: [...fotos],
      orden: fechaNombre || subida
    });
  }
}

eventos.sort((a, b) => (a.orden < b.orden ? 1 : a.orden > b.orden ? -1 : 0));
fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'data', 'eventos.json'),
  JSON.stringify(eventos.map(({ orden, ...resto }) => resto), null, 2));

console.log(`Web preparada en _site con ${eventos.length} evento(s).`);
for (const ev of eventos) console.log(` · ${ev.fecha}  ${ev.titulo}  (${ev.fotos.length} fotos)`);
