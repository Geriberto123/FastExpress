const http = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, join, normalize } = require('node:path');

const root = normalize(join(__dirname, '..'));
const tipos = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' };

http.createServer(async (req, res) => {
  const ruta = new URL(req.url, 'http://localhost').pathname;
  const archivo = normalize(join(root, ruta === '/' ? 'index.html' : ruta));
  if (!archivo.startsWith(`${root}/`)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const contenido = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': tipos[extname(archivo)] ?? 'application/octet-stream' });
    res.end(contenido);
  } catch {
    res.writeHead(404).end();
  }
}).listen(5501, '127.0.0.1');
