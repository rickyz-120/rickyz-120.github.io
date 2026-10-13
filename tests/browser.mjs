// Abre um Chromium para os testes. Tenta o do Playwright; se não iniciar, usa o Edge ou o Chrome instalados.
// Os argumentos ativam o WebGL por software (SwiftShader) no modo headless.
import { chromium } from 'playwright';

export const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export async function launch(opts = {}) {
  const channels = [process.env.PW_CHANNEL, undefined, 'msedge', 'chrome'].filter((c, i, a) => a.indexOf(c) === i);
  let last;
  for (const channel of channels) {
    try { return await chromium.launch({ args: GL_ARGS, ...(channel ? { channel } : {}), ...opts }); }
    catch (e) { last = e; }
  }
  throw last;
}
