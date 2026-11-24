const $ = (id) => document.getElementById(id);

let fontSize = parseInt(localStorage.getItem('mochila_font')) || 16;
let materias = JSON.parse(localStorage.getItem('mochila_materias_v6')) || [];
let filtroSemestre = 'todos';
let busca = '';

let materiaAtual = null;
let cadernoAtual = null;
let paginaIndex = 0;
let toastTimer = null;
let selecaoSalva = null;
let arraste = null;
let zTop = 20;

const paginaAtual = () => cadernoAtual?.paginas[paginaIndex];

function salvar() {
  try {
    localStorage.setItem('mochila_materias_v6', JSON.stringify(materias));
    const badge = $('save-status');
    if (badge) badge.textContent = 'Salvo';
  } catch {
    showToast('Limite de armazenamento atingido', true);
  }
}

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
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
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

function toggleFaq(btn) {
  const aberto = !btn.nextElementSibling.classList.toggle('hidden');
  btn.setAttribute('aria-expanded', String(aberto));
}

function handleLogin(e) {
  e.preventDefault();
  const email = $('login-email')?.value.trim();
  if (email) {
    localStorage.setItem('mochila_user', email);
    window.location.href = 'dashboard.html';
  }
}

function garantirPaginas(caderno) {
  if (!caderno.paginas?.length) caderno.paginas = [{ id: Date.now(), conteudo: '', notas: [], imagens: [], marcada: false }];
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
      ? materias.map((m) => `<option value="${m.id}" class="bg-carddark text-charcoal">${m.nome}</option>`).join('')
      : '<option value="" class="bg-carddark text-charcoal">Crie uma materia primeiro</option>';
    if ($('btn-add-caderno')) $('btn-add-caderno').disabled = !materias.length;
  }

  document.querySelectorAll('.semester-btn').forEach((btn) => {
    const ativo = btn.dataset.semestre === filtroSemestre;
    btn.setAttribute('aria-pressed', String(ativo));
    btn.className = ativo
      ? 'semester-btn px-3.5 py-2 rounded-lg bg-sangria text-cosmic font-black text-xs uppercase tracking-wider transition'
      : 'semester-btn px-3 py-2 rounded-lg border-2 border-cornflower font-bold text-xs hover:bg-cornflower transition';
  });

  const totalCadernos = materias.reduce((acc, m) => acc + m.cadernos.length, 0);
  if ($('counter-box')) {
    $('counter-box').textContent = `${materias.length} ${materias.length === 1 ? 'Materia' : 'Materias'} | ${totalCadernos} ${totalCadernos === 1 ? 'Caderno' : 'Cadernos'}`;
  }

  if (!materias.length) {
    container.innerHTML = `
      <div class="alert-banner p-8 text-center">
        <span class="inline-block bg-alerta text-cosmic text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">Aviso</span>
        <p class="text-base font-black mb-1">Sua mochila esta vazia</p>
        <p class="text-sm opacity-85">Crie sua primeira materia no formulario ao lado para comecar a adicionar cadernos.</p>
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
                <span class="inline-block bg-cornflower text-charcoal text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">${c.semestre}</span>
                <h4 class="text-lg font-black mb-1">${c.titulo}</h4>
                <p class="text-xs font-bold opacity-80">${c.pauta}</p>
              </div>
              <div class="mt-5 flex justify-between items-center gap-2 pt-3 border-t border-cornflower">
                <span class="text-xs font-bold opacity-70">${n} ${n === 1 ? 'pagina' : 'paginas'}</span>
                <div class="flex items-center gap-2">
                  <a href="editor.html?materia=${m.id}&caderno=${c.id}" class="text-xs bg-sangria text-cosmic px-3 py-1.5 rounded-lg font-black hover:opacity-90 transition uppercase tracking-wider">Abrir</a>
                  <button onclick="removeCaderno(${m.id}, ${c.id})" class="text-xs bg-alerta text-cosmic px-3 py-1.5 rounded-lg font-black hover:opacity-80 transition uppercase tracking-wider">Excluir</button>
                </div>
              </div>
            </div>`;
        }).join('')}</div>`
      : '<p class="text-xs font-semibold opacity-60 text-center py-8 border-2 border-dashed border-cornflower rounded-lg">Nenhum caderno encontrado nesta materia para o filtro atual.</p>';

    return `
      <div class="custom-card p-6 space-y-5">
        <div class="flex flex-wrap justify-between items-center gap-3 pb-3 border-b-2 border-cornflower">
          <div class="flex items-center gap-3">
            <h3 class="text-xl font-black text-sangria">${m.nome}</h3>
            <span class="bg-cornflower text-charcoal text-xs font-black px-2.5 py-0.5 rounded">${filtrados.length} ${filtrados.length === 1 ? 'caderno' : 'cadernos'}</span>
          </div>
          <button onclick="removeMateria(${m.id})" class="text-xs border-2 border-alerta text-alerta px-3 py-1.5 rounded-lg font-black hover:bg-alerta hover:text-cosmic transition uppercase tracking-wider">Excluir Materia</button>
        </div>
        ${cards}
      </div>`;
  }).join('');

  if (!visiveis) {
    container.innerHTML = `
      <div class="alert-banner p-8 text-center">
        <span class="inline-block bg-alerta text-cosmic text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">Busca</span>
        <p class="text-base font-black mb-1">Nenhum resultado encontrado</p>
        <p class="text-sm opacity-85">Tente outro termo de pesquisa ou limpe o filtro de semestre.</p>
      </div>`;
  }
}

function handleMateriaSubmit(e) {
  e.preventDefault();
  const nome = $('materia-nome').value.trim();
  if (!nome) return;
  materias.push({ id: Date.now(), nome, cadernos: [] });
  $('materia-nome').value = '';
  salvar();
  renderDashboard();
  showToast('Materia criada com sucesso');
}

function handleCadernoSubmit(e) {
  e.preventDefault();
  const materia = materias.find((m) => m.id === Number($('caderno-materia').value));
  const titulo = $('caderno-titulo').value.trim();
  if (!materia || !titulo) return;
  materia.cadernos.push({
    id: Date.now(),
    titulo,
    semestre: $('caderno-semestre').value,
    pauta: $('caderno-pauta').value,
    paginas: [{ id: Date.now() + 1, conteudo: '', notas: [], imagens: [], marcada: false }]
  });
  $('caderno-titulo').value = '';
  salvar();
  renderDashboard();
  showToast('Caderno adicionado');
}

function removeMateria(id) {
  materias = materias.filter((m) => m.id !== id);
  salvar();
  renderDashboard();
  showToast('Materia removida', true);
}

function removeCaderno(materiaId, cadernoId) {
  const m = materias.find((x) => x.id === materiaId);
  if (!m) return;
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

function applySheetClass(pauta) {
  const mapa = { 'Sem pauta': 'sheet-plain', 'Quadriculado': 'sheet-grid', 'Pontilhado': 'sheet-dotted' };
  const sheet = $('notebook-sheet');
  if (!sheet) return;
  sheet.classList.remove('sheet-ruled', 'sheet-plain', 'sheet-grid', 'sheet-dotted');
  sheet.classList.add(mapa[pauta] || 'sheet-ruled');
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
  salvar();

  $('editor-caderno-titulo').textContent = cadernoAtual.titulo;
  $('editor-caderno-subtitulo').textContent = `${materiaAtual.nome} | ${cadernoAtual.semestre}`;
  $('sheet-header-label').textContent = `${materiaAtual.nome} / ${cadernoAtual.titulo}`;
  $('editor-pauta-select').value = cadernoAtual.pauta || 'Com pauta';

  applySheetClass(cadernoAtual.pauta);
  renderCurrentPage();
  renderPageTabs();
}

function renderCurrentPage() {
  const p = paginaAtual();
  if (!p) return;
  $('sheet-page-label').textContent = `Pagina ${paginaIndex + 1}`;
  $('editor-content').innerHTML = p.conteudo || '';
  $('btn-delete-page').style.display = cadernoAtual.paginas.length > 1 ? 'inline-block' : 'none';
  $('bookmark-ribbon').classList.toggle('hidden', !p.marcada);

  const btn = $('btn-bookmark');
  btn.textContent = p.marcada ? 'Pagina Marcada' : 'Marca Pagina';
  btn.setAttribute('aria-pressed', String(p.marcada));
  btn.className = p.marcada
    ? 'px-3 py-2 rounded-lg bg-alerta text-cosmic font-black text-xs transition'
    : 'px-3 py-2 rounded-lg border-2 border-alerta text-alerta font-black text-xs hover:bg-alerta hover:text-cosmic transition';

  renderFloating();
}

function renderPageTabs() {
  const tabs = $('pages-tabs');
  if (!tabs || !cadernoAtual) return;
  tabs.innerHTML = '';
  cadernoAtual.paginas.forEach((p, i) => {
    const btn = document.createElement('button');
    const ativa = i === paginaIndex;
    btn.textContent = i + 1;
    btn.className = (ativa
      ? 'w-10 h-10 rounded-lg bg-sangria text-cosmic font-black text-xs'
      : 'w-10 h-10 rounded-lg custom-card font-black text-xs hover:bg-cornflower hover:text-charcoal transition') +
      (p.marcada ? ' page-tab-bookmarked' : '');
    btn.setAttribute('aria-current', ativa ? 'page' : 'false');
    btn.onclick = () => { paginaIndex = i; renderCurrentPage(); renderPageTabs(); };
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
  item.x = Math.round(Math.max(0, Math.min(pt.clientX - bodyRect.left - dx, bodyRect.width - el.offsetWidth)));
  item.y = Math.round(Math.max(0, Math.min(pt.clientY - bodyRect.top - dy, bodyRect.height - el.offsetHeight)));
  el.style.left = item.x + 'px';
  el.style.top = item.y + 'px';
}

function finalizarArraste() {
  if (!arraste) return;
  arraste = null;
  salvar();
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
        <button type="button" onclick="removeStickyNote(${n.id})" class="text-[10px] font-black uppercase hover:underline no-print">Remover</button>
      </div>
      <div class="sticky-note-body">
        <textarea aria-label="Texto da nota adesiva" placeholder="Escreva um lembrete..." class="sticky-note-textarea"></textarea>
      </div>`;
    const ta = card.querySelector('textarea');
    ta.value = n.texto || '';
    ta.oninput = (e) => { n.texto = e.target.value; salvar(); };
    const header = card.querySelector('.sticky-note-header');
    header.onmousedown = (e) => iniciarArraste(e, card, n);
    header.ontouchstart = (e) => iniciarArraste(e, card, n);
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
          <button type="button" onclick="resizeSheetImage(${img.id}, -40)" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-cornflower text-charcoal">Menor</button>
          <button type="button" onclick="resizeSheetImage(${img.id}, 40)" class="text-[10px] font-black px-1.5 py-0.5 rounded bg-cornflower text-charcoal">Maior</button>
          <button type="button" onclick="removeSheetImage(${img.id})" class="text-[10px] font-black uppercase text-alerta hover:underline">Remover</button>
        </div>
      </div>
      <img src="${img.src}" alt="Imagem adicionada ao caderno">`;
    const header = card.querySelector('.sheet-image-header');
    header.onmousedown = (e) => iniciarArraste(e, card, img);
    header.ontouchstart = (e) => iniciarArraste(e, card, img);
    layer.appendChild(card);
  });
}

function saveEditorSelection() {
  const sel = window.getSelection();
  if (sel?.rangeCount && $('editor-content')?.contains(sel.anchorNode)) {
    selecaoSalva = sel.getRangeAt(0).cloneRange();
  }
}

function changeTextColor(cor) {
  $('editor-content')?.focus();
  if (selecaoSalva) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(selecaoSalva);
  }
  document.execCommand('foreColor', false, cor);
  handleEditorInput();
}

function handleEditorInput() {
  if (!paginaAtual()) return;
  paginaAtual().conteudo = $('editor-content').innerHTML;
  salvar();
}

function changeSheetStyle(pauta) {
  if (!cadernoAtual) return;
  cadernoAtual.pauta = pauta;
  applySheetClass(pauta);
  salvar();
  showToast('Estilo de folha atualizado');
}

function changeEditorTextSize(size) {
  if ($('editor-content')) $('editor-content').style.fontSize = size + 'px';
}

function formatBold() {
  $('editor-content')?.focus();
  document.execCommand('bold');
  handleEditorInput();
}

function insertSectionTitle() {
  const ed = $('editor-content');
  if (!ed) return;
  ed.insertAdjacentHTML('beforeend', '<div class="section-heading">Titulo da Secao</div><div><br></div>');
  handleEditorInput();
}

function insertChecklist() {
  const ed = $('editor-content');
  if (!ed) return;
  ed.insertAdjacentHTML('beforeend', '<div class="checklist-item"><input type="checkbox" aria-label="Marcar item"><span>Novo item de estudo</span></div>');
  handleEditorInput();
}

function toggleBookmark() {
  const p = paginaAtual();
  if (!p) return;
  p.marcada = !p.marcada;
  salvar();
  renderCurrentPage();
  renderPageTabs();
  showToast(p.marcada ? 'Marca pagina adicionado' : 'Marca pagina removido');
}

function addStickyNote() {
  const p = paginaAtual();
  if (!p) return;
  const off = (p.notas.length % 6) * 24;
  p.notas.push({ id: Date.now(), texto: '', x: 420 - off, y: 28 + off });
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
  if (!file || !paginaAtual()) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(img.width, 600);
      const h = Math.round((img.height * w) / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const off = (paginaAtual().imagens.length % 5) * 24;
      paginaAtual().imagens.push({ id: Date.now(), src: canvas.toDataURL('image/jpeg', 0.8), x: 60 + off, y: 80 + off, width: 240 });
      salvar();
      renderFloating();
      showToast('Imagem adicionada');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
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
  cadernoAtual.paginas.push({ id: Date.now(), conteudo: '', notas: [], imagens: [], marcada: false });
  paginaIndex = cadernoAtual.paginas.length - 1;
  salvar();
  renderCurrentPage();
  renderPageTabs();
  showToast('Nova pagina criada');
}

function deleteCurrentPage() {
  if (!cadernoAtual || cadernoAtual.paginas.length <= 1) return;
  cadernoAtual.paginas.splice(paginaIndex, 1);
  paginaIndex = Math.min(paginaIndex, cadernoAtual.paginas.length - 1);
  salvar();
  renderCurrentPage();
  renderPageTabs();
  showToast('Pagina removida', true);
}

function exportNotebookPdf() {
  window.print();
}

applySavedPreferences();
renderDashboard();
initEditor();