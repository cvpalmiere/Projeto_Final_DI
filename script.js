const $ = (id) => document.getElementById(id);

const CHAVE_MATERIAS = 'mochila_materias_v6';
const CHAVE_SUGESTOES = 'mochila_sugestoes';

let fontSize = parseInt(localStorage.getItem('mochila_font')) || 16;
let materias = carregarMaterias();
let filtroSemestre = 'todos';
let busca = '';

let materiaAtual = null;
let cadernoAtual = null;
let paginaIndex = 0;
let toastTimer = null;
let saveTimer = null;
let selecaoSalva = null;
let arraste = null;
let zTop = 20;
let slideAtual = 0;
let seqId = 0;

const paginaAtual = () => cadernoAtual?.paginas[paginaIndex];
const novoId = () => Date.now() * 1000 + (seqId++ % 1000);
const limitar = (v, min, max) => Math.round(Math.max(min, Math.min(v, max)));

function carregarMaterias() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_MATERIAS)) || [];
    dados.forEach((m) => {
      m.cadernos ||= [];
      m.cadernos.forEach((c) => {
        c.semestre = String(c.semestre).replace(/^(\d+) Semestre$/, '$1º Semestre');
      });
    });
    return dados;
  } catch {
    return [];
  }
}

function esc(texto) {
  const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texto ?? '').replace(/[&<>"']/g, (c) => mapa[c]);
}

function sanitizar(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const raiz = doc.body.firstElementChild;
  raiz.querySelectorAll('script,style,iframe,object,embed,link,meta,form,base').forEach((n) => n.remove());
  raiz.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (a.name.toLowerCase().startsWith('on') || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
    });
  });
  return raiz.innerHTML;
}

function salvar() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(CHAVE_MATERIAS, JSON.stringify(materias));
    const badge = $('save-status');
    if (badge) badge.textContent = 'Salvo';
    return true;
  } catch {
    showToast('Limite de armazenamento atingido', true);
    return false;
  }
}

function agendarSalvamento() {
  const badge = $('save-status');
  if (badge) badge.textContent = 'Salvando...';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(salvar, 500);
}

window.addEventListener('beforeunload', () => {
  if (saveTimer) salvar();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveTimer) salvar();
});

function showToast(msg, alerta = false) {
  let toast = $('toast-banner');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-banner';
    toast.className = 'toast-banner no-print';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.toggle('toast-alert', alerta);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function syncThemeAria() {
  const dark = document.documentElement.classList.contains('dark');
  document.querySelectorAll('.theme-switch').forEach((b) => b.setAttribute('aria-pressed', String(dark)));
}

function applySavedPreferences() {
  document.documentElement.classList.toggle('dark', localStorage.getItem('mochila_theme') !== 'light');
  document.documentElement.style.fontSize = fontSize + 'px';
  syncThemeAria();
}

function changeFontSize(dir) {
  fontSize = dir === 0 ? 16 : Math.min(22, Math.max(14, fontSize + dir * 2));
  localStorage.setItem('mochila_font', fontSize);
  document.documentElement.style.fontSize = fontSize + 'px';
}

function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('mochila_theme', dark ? 'dark' : 'light');
  syncThemeAria();
}

function handleLogin(e) {
  e.preventDefault();
  const email = $('login-email')?.value.trim();
  if (email) {
    localStorage.setItem('mochila_user', email);
    window.location.href = 'dashboard.html';
  }
}

function sair() {
  localStorage.removeItem('mochila_user');
}

function showSlide(indice) {
  const slides = document.querySelectorAll('.carousel-slide');
  if (!slides.length) return;
  slideAtual = (indice + slides.length) % slides.length;
  slides.forEach((s, i) => {
    s.hidden = i !== slideAtual;
  });
  document.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.setAttribute('aria-current', String(i === slideAtual));
  });
}

function moveCarousel(dir) {
  showSlide(slideAtual + dir);
}

function goToSlide(indice) {
  showSlide(indice);
}

function initCarousel() {
  const carousel = $('carousel');
  if (!carousel) return;
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveCarousel(-1);
    if (e.key === 'ArrowRight') moveCarousel(1);
  });
  showSlide(0);
}

function maskPhone(input) {
  const d = input.value.replace(/\D/g, '').slice(0, 11);
  let v = d;
  if (d.length > 10) v = `(${d.slice(0, 2)}) ${d.slice(2, 7)} ${d.slice(7)}`;
  else if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, 6)} ${d.slice(6)}`;
  else if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  else if (d.length) v = `(${d}`;
  input.value = v;
}

function validarNome(nome) {
  if (nome.length < 3) return 'Informe seu nome com pelo menos 3 letras.';
  if (!/^[\p{L}' -]+$/u.test(nome)) return 'Use apenas letras e espaços no nome.';
  return '';
}

function validarTelefone(digitos) {
  if (digitos.length < 10 || digitos.length > 11) return 'Informe o telefone com DDD, por exemplo (11) 91234 5678.';
  if (/^0/.test(digitos)) return 'O DDD informado não é válido.';
  if (digitos.length === 11 && digitos[2] !== '9') return 'Celulares com 11 dígitos começam com 9 depois do DDD.';
  return '';
}

function validarSugestao(texto) {
  if (texto.length < 10) return 'Escreva uma sugestão com pelo menos 10 caracteres.';
  return '';
}

function initContact() {
  [['contato-nome', 'erro-nome'], ['contato-telefone', 'erro-telefone'], ['contato-sugestao', 'erro-sugestao']].forEach(([campo, erro]) => {
    $(campo)?.addEventListener('input', () => {
      $(erro).textContent = '';
      $(campo).setAttribute('aria-invalid', 'false');
    });
  });
}

function handleContactSubmit(e) {
  e.preventDefault();
  const nome = $('contato-nome').value.trim();
  const telefone = $('contato-telefone').value.replace(/\D/g, '');
  const sugestao = $('contato-sugestao').value.trim();
  const checagens = [
    ['contato-nome', 'erro-nome', validarNome(nome)],
    ['contato-telefone', 'erro-telefone', validarTelefone(telefone)],
    ['contato-sugestao', 'erro-sugestao', validarSugestao(sugestao)]
  ];
  let primeiro = null;
  checagens.forEach(([campo, erro, msg]) => {
    $(erro).textContent = msg;
    $(campo).setAttribute('aria-invalid', String(Boolean(msg)));
    if (msg && !primeiro) primeiro = $(campo);
  });
  if (primeiro) {
    primeiro.focus();
    showToast('Revise os campos destacados', true);
    return;
  }
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_SUGESTOES)) || [];
    lista.push({ id: novoId(), nome, telefone, sugestao, data: new Date().toISOString() });
    localStorage.setItem(CHAVE_SUGESTOES, JSON.stringify(lista));
  } catch {
    showToast('Não foi possível guardar a sugestão', true);
    return;
  }
  $('form-contato').reset();
  showToast('Sugestão enviada com sucesso');
}

function garantirPaginas(caderno) {
  if (!caderno.paginas?.length) caderno.paginas = [{ id: novoId(), conteudo: '', notas: [], imagens: [], marcada: false }];
  caderno.paginas.forEach((p) => {
    p.notas ||= [];
    p.imagens ||= [];
    p.marcada = Boolean(p.marcada);
  });
}

function renderDashboard() {
  const container = $('materias-container');
  if (!container) return;

  const select = $('caderno-materia');
  if (select) {
    select.innerHTML = materias.length
      ? materias.map((m) => `<option value="${m.id}" class="bg-surface text-on-accent">${esc(m.nome)}</option>`).join('')
      : '<option value="" class="bg-surface text-on-accent">Crie uma matéria primeiro</option>';
    if ($('btn-add-caderno')) $('btn-add-caderno').disabled = !materias.length;
  }

  document.querySelectorAll('.semester-btn').forEach((btn) => {
    const ativo = btn.dataset.semestre === filtroSemestre;
    btn.setAttribute('aria-pressed', String(ativo));
    btn.className = ativo
      ? 'semester-btn px-3.5 py-2 rounded-lg bg-primary text-on-primary font-black text-xs uppercase tracking-wider transition'
      : 'semester-btn px-3 py-2 rounded-lg border-2 border-accent font-bold text-xs hover:bg-accent transition';
  });

  const totalCadernos = materias.reduce((acc, m) => acc + m.cadernos.length, 0);
  if ($('counter-box')) {
    $('counter-box').textContent = `${materias.length} ${materias.length === 1 ? 'Matéria' : 'Matérias'} | ${totalCadernos} ${totalCadernos === 1 ? 'Caderno' : 'Cadernos'}`;
  }

  if (!materias.length) {
    container.innerHTML = `
      <div class="alert-banner p-8 text-center">
        <span class="inline-block bg-danger text-on-primary text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">Aviso</span>
        <p class="text-base font-black mb-1">Sua mochila está vazia</p>
        <p class="text-sm opacity-85">Crie sua primeira matéria no formulário ao lado para começar a adicionar cadernos.</p>
      </div>`;
    return;
  }

  let visiveis = 0;
  container.innerHTML = materias.map((m) => {
    const bateMateria = !busca || m.nome.toLowerCase().includes(busca);
    const filtrados = m.cadernos.filter((c) =>
      (filtroSemestre === 'todos' || c.semestre === filtroSemestre) &&
      (!busca || bateMateria || c.titulo.toLowerCase().includes(busca))
    );

    if (busca && !bateMateria && !filtrados.length) return '';
    visiveis++;

    const cards = filtrados.length
      ? `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${filtrados.map((c) => {
          garantirPaginas(c);
          const n = c.paginas.length;
          return `
            <div class="notebook-cover p-5 rounded-xl flex flex-col justify-between">
              <div>
                <span class="inline-block bg-accent text-on-accent text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">${esc(c.semestre)}</span>
                <h4 class="text-lg font-black mb-1">${esc(c.titulo)}</h4>
                <p class="text-xs font-bold opacity-80">${esc(c.pauta)}</p>
              </div>
              <div class="mt-5 flex justify-between items-center gap-2 pt-3 border-t border-accent">
                <span class="text-xs font-bold opacity-80">${n} ${n === 1 ? 'página' : 'páginas'}</span>
                <div class="flex items-center gap-2">
                  <a href="editor.html?materia=${m.id}&caderno=${c.id}" aria-label="Abrir o caderno ${esc(c.titulo)}" class="text-xs bg-primary text-on-primary px-3 py-1.5 rounded-lg font-black hover:opacity-90 transition uppercase tracking-wider">Abrir</a>
                  <button type="button" onclick="removeCaderno(${m.id}, ${c.id})" aria-label="Excluir o caderno ${esc(c.titulo)}" class="text-xs bg-danger text-on-primary px-3 py-1.5 rounded-lg font-black hover:opacity-80 transition uppercase tracking-wider">Excluir</button>
                </div>
              </div>
            </div>`;
        }).join('')}</div>`
      : '<p class="text-xs font-semibold opacity-80 text-center py-8 border-2 border-dashed border-accent rounded-lg">Nenhum caderno encontrado nesta matéria para o filtro atual.</p>';

    return `
      <div class="custom-card p-6 space-y-5">
        <div class="flex flex-wrap justify-between items-center gap-3 pb-3 border-b-2 border-accent">
          <div class="flex items-center gap-3">
            <h3 class="text-xl font-black text-primary">${esc(m.nome)}</h3>
            <span class="bg-accent text-on-accent text-xs font-black px-2.5 py-0.5 rounded">${filtrados.length} ${filtrados.length === 1 ? 'caderno' : 'cadernos'}</span>
          </div>
          <button type="button" onclick="removeMateria(${m.id})" aria-label="Excluir a matéria ${esc(m.nome)}" class="text-xs border-2 border-danger text-danger px-3 py-1.5 rounded-lg font-black hover:bg-danger hover:text-on-primary transition uppercase tracking-wider">Excluir Matéria</button>
        </div>
        ${cards}
      </div>`;
  }).join('');

  if (!visiveis) {
    container.innerHTML = `
      <div class="alert-banner p-8 text-center">
        <span class="inline-block bg-danger text-on-primary text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">Busca</span>
        <p class="text-base font-black mb-1">Nenhum resultado encontrado</p>
        <p class="text-sm opacity-85">Tente outro termo de pesquisa ou limpe o filtro de semestre.</p>
      </div>`;
  }
}

function handleMateriaSubmit(e) {
  e.preventDefault();
  const nome = $('materia-nome').value.trim();
  if (!nome) return;
  materias.push({ id: novoId(), nome, cadernos: [] });
  $('materia-nome').value = '';
  salvar();
  renderDashboard();
  showToast('Matéria criada com sucesso');
}

function handleCadernoSubmit(e) {
  e.preventDefault();
  const materia = materias.find((m) => m.id === Number($('caderno-materia').value));
  const titulo = $('caderno-titulo').value.trim();
  if (!materia || !titulo) return;
  materia.cadernos.push({
    id: novoId(),
    titulo,
    semestre: $('caderno-semestre').value,
    pauta: $('caderno-pauta').value,
    tamanhoTexto: 16,
    paginas: [{ id: novoId(), conteudo: '', notas: [], imagens: [], marcada: false }]
  });
  $('caderno-titulo').value = '';
  salvar();
  renderDashboard();
  showToast('Caderno adicionado');
}

function removeMateria(id) {
  const materia = materias.find((m) => m.id === id);
  if (!materia) return;
  const n = materia.cadernos.length;
  const aviso = n
    ? `Excluir a matéria "${materia.nome}" e ${n === 1 ? 'o caderno' : `os ${n} cadernos`} dela? Esta ação não pode ser desfeita.`
    : `Excluir a matéria "${materia.nome}"? Esta ação não pode ser desfeita.`;
  if (!window.confirm(aviso)) return;
  materias = materias.filter((m) => m.id !== id);
  salvar();
  renderDashboard();
  showToast('Matéria removida', true);
}

function removeCaderno(materiaId, cadernoId) {
  const m = materias.find((x) => x.id === materiaId);
  const caderno = m?.cadernos.find((c) => c.id === cadernoId);
  if (!caderno) return;
  if (!window.confirm(`Excluir o caderno "${caderno.titulo}"? Esta ação não pode ser desfeita.`)) return;
  m.cadernos = m.cadernos.filter((c) => c.id !== cadernoId);
  salvar();
  renderDashboard();
  showToast('Caderno removido', true);
}

function filterSemester(sem) {
  filtroSemestre = sem;
  renderDashboard();
}

function handleSearch(valor) {
  busca = valor.trim().toLowerCase();
  renderDashboard();
}

function classeFolha(pauta) {
  const mapa = { 'Sem pauta': 'sheet-plain', 'Quadriculado': 'sheet-grid', 'Pontilhado': 'sheet-dotted' };
  return mapa[pauta] || 'sheet-ruled';
}

function applySheetClass(pauta) {
  const sheet = $('notebook-sheet');
  if (!sheet) return;
  sheet.classList.remove('sheet-ruled', 'sheet-plain', 'sheet-grid', 'sheet-dotted');
  sheet.classList.add(classeFolha(pauta));
}

function initEditor() {
  if (!$('editor-workspace')) return;
  const params = new URLSearchParams(window.location.search);
  materiaAtual = materias.find((m) => m.id === Number(params.get('materia')));
  cadernoAtual = materiaAtual?.cadernos.find((c) => c.id === Number(params.get('caderno')));

  if (!materiaAtual || !cadernoAtual) {
    $('editor-workspace').classList.add('hidden');
    $('editor-toolbar')?.classList.add('hidden');
    $('editor-missing')?.classList.remove('hidden');
    return;
  }

  garantirPaginas(cadernoAtual);
  cadernoAtual.tamanhoTexto ||= 16;
  salvar();

  $('editor-caderno-titulo').textContent = cadernoAtual.titulo;
  $('editor-caderno-subtitulo').textContent = `${materiaAtual.nome} | ${cadernoAtual.semestre}`;
  $('sheet-header-label').textContent = `${materiaAtual.nome} / ${cadernoAtual.titulo}`;
  $('editor-pauta-select').value = cadernoAtual.pauta || 'Com pauta';
  $('editor-size-select').value = String(cadernoAtual.tamanhoTexto);
  $('editor-content').style.fontSize = cadernoAtual.tamanhoTexto + 'px';

  document.addEventListener('selectionchange', saveEditorSelection);
  $('editor-content').addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    if (e.target.checked) e.target.setAttribute('checked', '');
    else e.target.removeAttribute('checked');
    handleEditorInput();
  });

  applySheetClass(cadernoAtual.pauta);
  renderCurrentPage();
  renderPageTabs();
}

function renderCurrentPage() {
  const p = paginaAtual();
  if (!p) return;
  $('sheet-page-label').textContent = `Página ${paginaIndex + 1}`;
  $('editor-content').innerHTML = sanitizar(p.conteudo);
  $('btn-delete-page').style.display = cadernoAtual.paginas.length > 1 ? 'inline-block' : 'none';
  $('bookmark-ribbon').classList.toggle('hidden', !p.marcada);

  const btn = $('btn-bookmark');
  btn.textContent = p.marcada ? 'Página Marcada' : 'Marca Página';
  btn.setAttribute('aria-pressed', String(p.marcada));
  btn.className = p.marcada
    ? 'px-3 py-2 rounded-lg bg-danger text-on-primary font-black text-xs transition'
    : 'px-3 py-2 rounded-lg border-2 border-danger text-danger font-black text-xs hover:bg-danger hover:text-on-primary transition';

  renderFloating();
}

function renderPageTabs() {
  const tabs = $('pages-tabs');
  if (!tabs || !cadernoAtual) return;
  tabs.innerHTML = '';
  cadernoAtual.paginas.forEach((p, i) => {
    const btn = document.createElement('button');
    const ativa = i === paginaIndex;
    btn.type = 'button';
    btn.textContent = i + 1;
    btn.className = (ativa
      ? 'w-10 h-10 rounded-lg bg-primary text-on-primary font-black text-xs'
      : 'w-10 h-10 rounded-lg custom-card font-black text-xs hover:bg-accent hover:text-on-accent transition') +
      (p.marcada ? ' page-tab-bookmarked' : '');
    btn.setAttribute('aria-label', `Ir para a página ${i + 1}${p.marcada ? ', marcada' : ''}`);
    if (ativa) btn.setAttribute('aria-current', 'page');
    btn.onclick = () => {
      paginaIndex = i;
      renderCurrentPage();
      renderPageTabs();
    };
    tabs.appendChild(btn);
  });
}

function iniciarArraste(e, el, item) {
  if (e.target.tagName === 'BUTTON') return;
  e.preventDefault();
  const pt = e.touches ? e.touches[0] : e;
  const bodyRect = $('page-body').getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  el.style.zIndex = ++zTop;
  arraste = { el, item, bodyRect, dx: pt.clientX - elRect.left, dy: pt.clientY - elRect.top };
}

function moverArraste(e) {
  if (!arraste) return;
  const pt = e.touches ? e.touches[0] : e;
  const { el, item, bodyRect, dx, dy } = arraste;
  item.x = limitar(pt.clientX - bodyRect.left - dx, 0, bodyRect.width - el.offsetWidth);
  item.y = limitar(pt.clientY - bodyRect.top - dy, 0, bodyRect.height - el.offsetHeight);
  el.style.left = item.x + 'px';
  el.style.top = item.y + 'px';
}

function finalizarArraste() {
  if (!arraste) return;
  arraste = null;
  salvar();
}

function moverComTeclado(e, el, item) {
  const direcoes = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const dir = direcoes[e.key];
  if (!dir || e.target !== e.currentTarget) return;
  e.preventDefault();
  const passo = e.shiftKey ? 40 : 10;
  const corpo = $('page-body');
  item.x = limitar((item.x || 0) + dir[0] * passo, 0, corpo.clientWidth - el.offsetWidth);
  item.y = limitar((item.y || 0) + dir[1] * passo, 0, corpo.clientHeight - el.offsetHeight);
  el.style.left = item.x + 'px';
  el.style.top = item.y + 'px';
  agendarSalvamento();
}

function prepararCabecalhoMovel(header, card, item, rotulo) {
  header.setAttribute('tabindex', '0');
  header.setAttribute('role', 'group');
  header.setAttribute('aria-label', `${rotulo}. Use as setas do teclado para mover e Shift para mover mais rápido.`);
  header.onmousedown = (e) => iniciarArraste(e, card, item);
  header.ontouchstart = (e) => iniciarArraste(e, card, item);
  header.onkeydown = (e) => moverComTeclado(e, card, item);
}

document.addEventListener('mousemove', moverArraste);
document.addEventListener('mouseup', finalizarArraste);
document.addEventListener('touchmove', moverArraste, { passive: false });
document.addEventListener('touchend', finalizarArraste);

function renderFloating() {
  const layer = $('floating-layer');
  const p = paginaAtual();
  if (!layer || !p) return;
  layer.innerHTML = '';

  p.notas.forEach((n, i) => {
    n.x ??= Math.max(20, 460 - i * 20);
    n.y ??= 24 + i * 28;
    const card = document.createElement('div');
    card.className = 'sticky-note-card';
    card.style.cssText = `left:${n.x}px;top:${n.y}px`;
    card.innerHTML = `
      <div class="sticky-note-header">
        <span class="text-[10px] font-black uppercase tracking-wider">Post it</span>
        <button type="button" onclick="removeStickyNote(${n.id})" aria-label="Remover este post it" class="text-[10px] font-black uppercase hover:underline no-print">Remover</button>
      </div>
      <div class="sticky-note-body">
        <textarea aria-label="Texto da nota adesiva" placeholder="Escreva um lembrete..." class="sticky-note-textarea"></textarea>
      </div>`;
    const ta = card.querySelector('textarea');
    ta.value = n.texto || '';
    ta.oninput = (e) => {
      n.texto = e.target.value;
      agendarSalvamento();
    };
    prepararCabecalhoMovel(card.querySelector('.sticky-note-header'), card, n, 'Post it');
    layer.appendChild(card);
  });

  p.imagens.forEach((img, i) => {
    img.x ??= 60 + i * 24;
    img.y ??= 60 + i * 24;
    img.width ??= 240;
    const card = document.createElement('div');
    card.className = 'sheet-image-card';
    card.style.cssText = `left:${img.x}px;top:${img.y}px;width:${img.width}px`;
    card.innerHTML = `
      <div class="sheet-image-header no-print">
        <span class="text-[10px] font-black uppercase tracking-wider">Imagem</span>
        <div class="flex items-center gap-1.5">
          <button type="button" onclick="resizeSheetImage(${img.id}, -40)" aria-label="Diminuir imagem" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-accent text-on-accent">Menor</button>
          <button type="button" onclick="resizeSheetImage(${img.id}, 40)" aria-label="Aumentar imagem" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-accent text-on-accent">Maior</button>
          <button type="button" onclick="removeSheetImage(${img.id})" aria-label="Remover imagem" class="text-[10px] font-black uppercase text-danger hover:underline">Remover</button>
        </div>
      </div>
      <img src="${esc(img.src)}" alt="Imagem adicionada ao caderno">`;
    prepararCabecalhoMovel(card.querySelector('.sheet-image-header'), card, img, 'Imagem');
    layer.appendChild(card);
  });
}

function saveEditorSelection() {
  const ed = $('editor-content');
  const sel = window.getSelection();
  if (ed && sel?.rangeCount && ed.contains(sel.anchorNode)) {
    selecaoSalva = sel.getRangeAt(0).cloneRange();
  }
}

function focarEditor() {
  const ed = $('editor-content');
  ed.focus();
  const sel = window.getSelection();
  const range = selecaoSalva && ed.contains(selecaoSalva.startContainer) ? selecaoSalva : null;
  sel.removeAllRanges();
  if (range) {
    sel.addRange(range);
  } else {
    const fim = document.createRange();
    fim.selectNodeContents(ed);
    fim.collapse(false);
    sel.addRange(fim);
  }
}

function inserirNoCursor(html) {
  focarEditor();
  document.execCommand('insertHTML', false, html);
  saveEditorSelection();
  handleEditorInput();
}

function handlePaste(e) {
  e.preventDefault();
  const texto = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, texto);
}

function changeTextColor(cor) {
  focarEditor();
  document.execCommand('foreColor', false, cor);
  saveEditorSelection();
  handleEditorInput();
}

function handleEditorInput() {
  const p = paginaAtual();
  if (!p) return;
  p.conteudo = $('editor-content').innerHTML;
  agendarSalvamento();
}

function changeSheetStyle(pauta) {
  if (!cadernoAtual) return;
  cadernoAtual.pauta = pauta;
  applySheetClass(pauta);
  salvar();
  showToast('Estilo de folha atualizado');
}

function changeEditorTextSize(size) {
  if (!cadernoAtual) return;
  cadernoAtual.tamanhoTexto = Number(size);
  $('editor-content').style.fontSize = size + 'px';
  salvar();
}

function formatBold() {
  focarEditor();
  document.execCommand('bold');
  saveEditorSelection();
  handleEditorInput();
}

function insertSectionTitle() {
  inserirNoCursor('<div class="section-heading">Título da Seção</div><div><br></div>');
}

function insertChecklist() {
  inserirNoCursor('<div class="checklist-item"><input type="checkbox" aria-label="Marcar item"><span>Novo item de estudo</span></div><div><br></div>');
}

function toggleBookmark() {
  const p = paginaAtual();
  if (!p) return;
  p.marcada = !p.marcada;
  salvar();
  renderCurrentPage();
  renderPageTabs();
  showToast(p.marcada ? 'Marca página adicionado' : 'Marca página removido');
}

function addStickyNote() {
  const p = paginaAtual();
  if (!p) return;
  const off = (p.notas.length % 6) * 24;
  p.notas.push({ id: novoId(), texto: '', x: 420 - off, y: 28 + off });
  salvar();
  renderFloating();
  showToast('Post it adicionado');
}

function removeStickyNote(id) {
  paginaAtual().notas = paginaAtual().notas.filter((n) => n.id !== id);
  salvar();
  renderFloating();
  showToast('Post it removido', true);
}

function triggerImageUpload() {
  $('editor-image-input')?.click();
}

function handleImageUpload(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file || !paginaAtual()) return;
  if (!file.type.startsWith('image/')) {
    showToast('Escolha um arquivo de imagem', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onerror = () => showToast('Não foi possível abrir a imagem', true);
    img.onload = () => {
      const w = Math.min(img.width, 600);
      const h = Math.round((img.height * w) / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const off = (paginaAtual().imagens.length % 5) * 24;
      paginaAtual().imagens.push({ id: novoId(), src: canvas.toDataURL('image/jpeg', 0.8), x: 60 + off, y: 80 + off, width: 240 });
      salvar();
      renderFloating();
      showToast('Imagem adicionada');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function resizeSheetImage(id, delta) {
  const img = paginaAtual()?.imagens.find((i) => i.id === id);
  if (!img) return;
  img.width = Math.max(120, Math.min(520, img.width + delta));
  salvar();
  renderFloating();
}

function removeSheetImage(id) {
  paginaAtual().imagens = paginaAtual().imagens.filter((i) => i.id !== id);
  salvar();
  renderFloating();
  showToast('Imagem removida', true);
}

function addNewPage() {
  if (!cadernoAtual) return;
  cadernoAtual.paginas.push({ id: novoId(), conteudo: '', notas: [], imagens: [], marcada: false });
  paginaIndex = cadernoAtual.paginas.length - 1;
  salvar();
  renderCurrentPage();
  renderPageTabs();
  showToast('Nova página criada');
}

function deleteCurrentPage() {
  if (!cadernoAtual || cadernoAtual.paginas.length <= 1) return;
  if (!window.confirm(`Excluir a página ${paginaIndex + 1}? Esta ação não pode ser desfeita.`)) return;
  cadernoAtual.paginas.splice(paginaIndex, 1);
  paginaIndex = Math.min(paginaIndex, cadernoAtual.paginas.length - 1);
  salvar();
  renderCurrentPage();
  renderPageTabs();
  showToast('Página removida', true);
}

function montarImpressao() {
  const area = $('print-area');
  if (!area || !cadernoAtual) return;
  area.innerHTML = '';
  const classe = classeFolha(cadernoAtual.pauta);
  const tamanho = (cadernoAtual.tamanhoTexto || 16) + 'px';
  const larguraTela = $('page-body')?.clientWidth || 960;
  const pct = (v) => ((Number(v) || 0) / larguraTela * 100).toFixed(3) + '%';

  cadernoAtual.paginas.forEach((p, i) => {
    const folha = document.createElement('div');
    folha.className = `notebook-sheet print-page ${classe}`;

    const cabecalho = document.createElement('div');
    cabecalho.className = 'print-head';
    cabecalho.innerHTML = `<span>${esc(materiaAtual.nome)} / ${esc(cadernoAtual.titulo)}</span><span class="print-head-page">Página ${i + 1}</span>`;

    const corpo = document.createElement('div');
    corpo.className = 'page-body';

    const camada = document.createElement('div');
    camada.className = 'floating-layer';

    p.notas.forEach((n) => {
      const nota = document.createElement('div');
      nota.className = 'sticky-note-card';
      nota.style.left = `min(${pct(n.x)}, calc(100% - 200px))`;
      nota.style.top = (n.y || 0) + 'px';
      const texto = document.createElement('div');
      texto.className = 'sticky-note-body print-note-text';
      texto.textContent = n.texto || '';
      nota.appendChild(texto);
      camada.appendChild(nota);
    });

    p.imagens.forEach((img) => {
      const cartao = document.createElement('div');
      cartao.className = 'sheet-image-card';
      cartao.style.left = pct(img.x);
      cartao.style.top = (img.y || 0) + 'px';
      cartao.style.width = pct(Math.min(img.width || 240, larguraTela));
      const foto = new Image();
      foto.src = img.src;
      foto.alt = '';
      cartao.appendChild(foto);
      camada.appendChild(cartao);
    });

    const conteudo = document.createElement('div');
    conteudo.className = 'editor-content';
    conteudo.style.fontSize = tamanho;
    conteudo.innerHTML = sanitizar(p.conteudo);

    if (p.marcada) {
      const fita = document.createElement('div');
      fita.className = 'bookmark-ribbon';
      folha.appendChild(fita);
    }

    corpo.append(camada, conteudo);
    folha.append(cabecalho, corpo);
    area.appendChild(folha);
  });
}

function exportNotebookPdf() {
  if (!cadernoAtual) return;
  montarImpressao();
  window.print();
}

window.addEventListener('beforeprint', montarImpressao);

window.addEventListener('afterprint', () => {
  const area = $('print-area');
  if (area) area.innerHTML = '';
});

applySavedPreferences();
renderDashboard();
initEditor();
initCarousel();
initContact();
