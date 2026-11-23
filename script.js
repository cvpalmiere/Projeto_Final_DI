let currentFontSize = parseInt(localStorage.getItem('mochila_font')) || 16;
let materiasList = JSON.parse(localStorage.getItem('mochila_materias_v6')) || [];
let activeFilter = 'todos';

let currentMateria = null;
let currentCaderno = null;
let currentPageIndex = 0;

function applySavedPreferences() {
  const savedTheme = localStorage.getItem('mochila_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
  document.documentElement.style.fontSize = currentFontSize + 'px';
}

function changeFontSize(direction) {
  if (direction === 0) {
    currentFontSize = 16;
  } else if (direction === 1 && currentFontSize < 22) {
    currentFontSize += 2;
  } else if (direction === -1 && currentFontSize > 14) {
    currentFontSize -= 2;
  }
  localStorage.setItem('mochila_font', currentFontSize);
  document.documentElement.style.fontSize = currentFontSize + 'px';
}

function toggleTheme() {
  const htmlEl = document.documentElement;
  if (htmlEl.classList.contains('dark')) {
    htmlEl.classList.remove('dark');
    localStorage.setItem('mochila_theme', 'light');
  } else {
    htmlEl.classList.add('dark');
    localStorage.setItem('mochila_theme', 'dark');
  }
}

function toggleFaq(button) {
  const answer = button.nextElementSibling;
  if (answer.classList.contains('hidden')) {
    answer.classList.remove('hidden');
  } else {
    answer.classList.add('hidden');
  }
}

function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById('login-email');
  if (emailInput && emailInput.value.trim() !== '') {
    localStorage.setItem('mochila_user', emailInput.value.trim());
    window.location.href = 'dashboard.html';
  }
}

function saveMaterias() {
  localStorage.setItem('mochila_materias_v6', JSON.stringify(materiasList));
}

function ensurePagesStructure(caderno) {
  if (!caderno.paginas || caderno.paginas.length === 0) {
    caderno.paginas = [{ id: Date.now(), conteudo: '', notas: [] }];
  }
}

function updateMateriaSelect() {
  const select = document.getElementById('caderno-materia');
  const btn = document.getElementById('btn-add-caderno');
  if (!select) return;

  select.innerHTML = '';

  if (materiasList.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Crie uma materia primeiro';
    opt.className = 'bg-charcoal text-cosmic';
    select.appendChild(opt);
    if (btn) btn.disabled = true;
    return;
  }

  if (btn) btn.disabled = false;

  materiasList.forEach((materia) => {
    const opt = document.createElement('option');
    opt.value = materia.id;
    opt.textContent = materia.nome;
    opt.className = 'bg-charcoal text-cosmic';
    select.appendChild(opt);
  });
}

function renderDashboard() {
  const container = document.getElementById('materias-container');
  const counterBox = document.getElementById('counter-box');
  if (!container) return;

  updateMateriaSelect();
  container.innerHTML = '';

  let totalCadernos = 0;
  materiasList.forEach((m) => {
    totalCadernos += m.cadernos.length;
  });

  if (counterBox) {
    const labelMat = materiasList.length === 1 ? 'Materia' : 'Materias';
    const labelCad = totalCadernos === 1 ? 'Caderno' : 'Cadernos';
    counterBox.textContent = `${materiasList.length} ${labelMat} | ${totalCadernos} ${labelCad}`;
  }

  if (materiasList.length === 0) {
    container.innerHTML = `
      <div class="custom-card p-10 text-center">
        <p class="text-base font-black text-sangria dark:text-cornflower mb-2">Sua mochila esta vazia</p>
        <p class="text-sm opacity-75">Crie sua primeira materia no formulario ao lado para comecar a adicionar cadernos.</p>
      </div>
    `;
    return;
  }

  materiasList.forEach((materia) => {
    const filteredCadernos = activeFilter === 'todos'
      ? materia.cadernos
      : materia.cadernos.filter((c) => c.semestre === activeFilter);

    const section = document.createElement('div');
    section.className = 'custom-card p-6 shadow-sm space-y-5';

    const labelQtd = filteredCadernos.length === 1 ? 'caderno' : 'cadernos';

    let cadernosHtml = '';
    if (filteredCadernos.length === 0) {
      cadernosHtml = `
        <p class="text-xs font-semibold opacity-60 text-center py-8 border-2 border-dashed border-cornflower rounded-lg">
          Nenhum caderno encontrado nesta materia para o filtro atual.
        </p>
      `;
    } else {
      cadernosHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
      filteredCadernos.forEach((caderno) => {
        ensurePagesStructure(caderno);
        const totalPaginas = caderno.paginas.length;
        const labelPag = totalPaginas === 1 ? 'pagina' : 'paginas';
        cadernosHtml += `
          <div class="notebook-cover p-5 rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden">
            <div class="absolute right-0 top-0 bottom-0 w-3 bg-cornflower opacity-40"></div>
            <div>
              <span class="inline-block bg-cornflower text-charcoal text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">${caderno.semestre}</span>
              <h4 class="text-lg font-black mb-1">${caderno.titulo}</h4>
              <p class="text-xs font-bold opacity-80">${caderno.pauta}</p>
            </div>
            <div class="mt-5 flex justify-between items-center gap-2 pt-3 border-t border-cornflower/30">
              <span class="text-xs font-bold opacity-70">${totalPaginas} ${labelPag}</span>
              <div class="flex items-center gap-2">
                <a href="editor.html?materia=${materia.id}&caderno=${caderno.id}" class="text-xs bg-cornflower text-charcoal px-3 py-1.5 rounded-lg font-black hover:opacity-90 transition uppercase tracking-wider">Abrir</a>
                <button onclick="removeCaderno(${materia.id}, ${caderno.id})" class="text-xs bg-sangria text-cosmic px-3 py-1.5 rounded-lg font-black hover:opacity-80 transition uppercase tracking-wider">Excluir</button>
              </div>
            </div>
          </div>
        `;
      });
      cadernosHtml += `</div>`;
    }

    section.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-3 pb-3 border-b-2 border-cornflower/30">
        <div class="flex items-center gap-3">
          <h3 class="text-xl font-black text-sangria dark:text-cornflower">${materia.nome}</h3>
          <span class="bg-cornflower text-charcoal text-xs font-black px-2.5 py-0.5 rounded">${filteredCadernos.length} ${labelQtd}</span>
        </div>
        <button onclick="removeMateria(${materia.id})" class="text-xs border-2 border-cornflower px-3 py-1.5 rounded-lg font-black hover:bg-sangria hover:text-cosmic hover:border-sangria transition uppercase tracking-wider">Excluir Materia</button>
      </div>
      ${cadernosHtml}
    `;

    container.appendChild(section);
  });
}

function handleMateriaSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('materia-nome');
  const nome = input.value.trim();
  if (!nome) return;

  materiasList.push({
    id: Date.now(),
    nome: nome,
    cadernos: []
  });

  saveMaterias();
  input.value = '';
  renderDashboard();
}

function handleCadernoSubmit(event) {
  event.preventDefault();
  const materiaId = parseInt(document.getElementById('caderno-materia').value);
  const tituloInput = document.getElementById('caderno-titulo');
  const semestre = document.getElementById('caderno-semestre').value;
  const pauta = document.getElementById('caderno-pauta').value;

  const materia = materiasList.find((m) => m.id === materiaId);
  if (!materia || !tituloInput.value.trim()) return;

  materia.cadernos.push({
    id: Date.now(),
    titulo: tituloInput.value.trim(),
    semestre: semestre,
    pauta: pauta,
    paginas: [{ id: Date.now() + 1, conteudo: '', notas: [] }]
  });

  saveMaterias();
  tituloInput.value = '';
  renderDashboard();
}

function removeMateria(materiaId) {
  materiasList = materiasList.filter((m) => m.id !== materiaId);
  saveMaterias();
  renderDashboard();
}

function removeCaderno(materiaId, cadernoId) {
  const materia = materiasList.find((m) => m.id === materiaId);
  if (!materia) return;
  materia.cadernos = materia.cadernos.filter((c) => c.id !== cadernoId);
  saveMaterias();
  renderDashboard();
}

function filterSemester(semestre) {
  activeFilter = semestre;
  renderDashboard();
}

function applySheetClass(pauta) {
  const sheet = document.getElementById('notebook-sheet');
  if (!sheet) return;
  sheet.classList.remove('sheet-ruled', 'sheet-plain', 'sheet-grid', 'sheet-dotted');
  if (pauta === 'Sem pauta') {
    sheet.classList.add('sheet-plain');
  } else if (pauta === 'Quadriculado') {
    sheet.classList.add('sheet-grid');
  } else if (pauta === 'Pontilhado') {
    sheet.classList.add('sheet-dotted');
  } else {
    sheet.classList.add('sheet-ruled');
  }
}

function initEditor() {
  const workspace = document.getElementById('editor-workspace');
  const missing = document.getElementById('editor-missing');
  const toolbar = document.getElementById('editor-toolbar');
  if (!workspace) return;

  const params = new URLSearchParams(window.location.search);
  const materiaId = parseInt(params.get('materia'));
  const cadernoId = parseInt(params.get('caderno'));

  currentMateria = materiasList.find((m) => m.id === materiaId);
  if (currentMateria) {
    currentCaderno = currentMateria.cadernos.find((c) => c.id === cadernoId);
  }

  if (!currentMateria || !currentCaderno) {
    workspace.classList.add('hidden');
    if (toolbar) toolbar.classList.add('hidden');
    if (missing) missing.classList.remove('hidden');
    return;
  }

  ensurePagesStructure(currentCaderno);
  saveMaterias();

  document.getElementById('editor-caderno-titulo').textContent = currentCaderno.titulo;
  document.getElementById('editor-caderno-subtitulo').textContent = `${currentMateria.nome} | ${currentCaderno.semestre}`;
  document.getElementById('sheet-header-label').textContent = `${currentMateria.nome} / ${currentCaderno.titulo}`;
  document.getElementById('editor-pauta-select').value = currentCaderno.pauta || 'Com pauta';

  applySheetClass(currentCaderno.pauta);
  renderCurrentPage();
  renderPageTabs();
}

function renderCurrentPage() {
  if (!currentCaderno) return;
  const page = currentCaderno.paginas[currentPageIndex];
  const editor = document.getElementById('editor-content');
  const pageLabel = document.getElementById('sheet-page-label');
  const deleteBtn = document.getElementById('btn-delete-page');

  if (pageLabel) {
    pageLabel.textContent = `Pagina ${currentPageIndex + 1}`;
  }
  if (editor) {
    editor.innerHTML = page.conteudo || '';
  }
  if (deleteBtn) {
    deleteBtn.style.display = currentCaderno.paginas.length > 1 ? 'inline-block' : 'none';
  }
  renderStickyNotes();
}

function renderPageTabs() {
  const tabs = document.getElementById('pages-tabs');
  if (!tabs || !currentCaderno) return;
  tabs.innerHTML = '';

  currentCaderno.paginas.forEach((page, index) => {
    const btn = document.createElement('button');
    const isActive = index === currentPageIndex;
    btn.className = isActive
      ? 'w-10 h-10 rounded-lg bg-sangria text-cosmic font-black text-xs shadow'
      : 'w-10 h-10 rounded-lg custom-card font-black text-xs hover:bg-cornflower hover:text-charcoal transition';
    btn.textContent = index + 1;
    btn.onclick = () => {
      currentPageIndex = index;
      renderCurrentPage();
      renderPageTabs();
    };
    tabs.appendChild(btn);
  });
}

function renderStickyNotes() {
  const zone = document.getElementById('sticky-notes-zone');
  if (!zone || !currentCaderno) return;
  const page = currentCaderno.paginas[currentPageIndex];
  if (!page.notas) page.notas = [];
  zone.innerHTML = '';

  page.notas.forEach((nota) => {
    const card = document.createElement('div');
    card.className = 'sticky-note-card shadow-md';
    card.innerHTML = `
      <div class="flex justify-between items-center mb-1">
        <span class="text-[10px] font-black uppercase tracking-wider text-sangria">Nota</span>
        <button type="button" onclick="removeStickyNote(${nota.id})" class="text-[10px] font-black uppercase text-sangria hover:underline no-print">Remover</button>
      </div>
      <textarea oninput="updateStickyNote(${nota.id}, this.value)" placeholder="Escreva um lembrete..." class="sticky-note-textarea">${nota.texto || ''}</textarea>
    `;
    zone.appendChild(card);
  });
}

function updateSaveBadge(text) {
  const badge = document.getElementById('save-status');
  if (badge) badge.textContent = text;
}

function handleEditorInput() {
  if (!currentCaderno) return;
  const editor = document.getElementById('editor-content');
  currentCaderno.paginas[currentPageIndex].conteudo = editor.innerHTML;
  saveMaterias();
  updateSaveBadge('Salvo');
}

function changeSheetStyle(newStyle) {
  if (!currentCaderno) return;
  currentCaderno.pauta = newStyle;
  applySheetClass(newStyle);
  saveMaterias();
  updateSaveBadge('Salvo');
}

function changeEditorTextSize(sizeValue) {
  const editor = document.getElementById('editor-content');
  if (editor) {
    editor.style.fontSize = sizeValue + 'px';
  }
}

function formatBold() {
  document.execCommand('bold', false, null);
  handleEditorInput();
}

function insertSectionTitle() {
  const editor = document.getElementById('editor-content');
  if (!editor) return;
  editor.focus();
  const titleEl = document.createElement('div');
  titleEl.className = 'section-heading';
  titleEl.textContent = 'Titulo da Secao';
  editor.appendChild(titleEl);
  const lineEl = document.createElement('div');
  lineEl.innerHTML = '<br>';
  editor.appendChild(lineEl);
  handleEditorInput();
}

function insertChecklist() {
  const editor = document.getElementById('editor-content');
  if (!editor) return;
  editor.focus();
  const itemEl = document.createElement('div');
  itemEl.className = 'checklist-item';
  itemEl.innerHTML = '<input type="checkbox"><span>Novo item de estudo</span>';
  editor.appendChild(itemEl);
  handleEditorInput();
}

function addStickyNote() {
  if (!currentCaderno) return;
  const page = currentCaderno.paginas[currentPageIndex];
  if (!page.notas) page.notas = [];
  page.notas.push({ id: Date.now(), texto: '' });
  saveMaterias();
  renderStickyNotes();
  updateSaveBadge('Salvo');
}

function updateStickyNote(noteId, textValue) {
  if (!currentCaderno) return;
  const page = currentCaderno.paginas[currentPageIndex];
  const nota = page.notas.find((n) => n.id === noteId);
  if (nota) {
    nota.texto = textValue;
    saveMaterias();
    updateSaveBadge('Salvo');
  }
}

function removeStickyNote(noteId) {
  if (!currentCaderno) return;
  const page = currentCaderno.paginas[currentPageIndex];
  page.notas = page.notas.filter((n) => n.id !== noteId);
  saveMaterias();
  renderStickyNotes();
}

function addNewPage() {
  if (!currentCaderno) return;
  currentCaderno.paginas.push({ id: Date.now(), conteudo: '', notas: [] });
  currentPageIndex = currentCaderno.paginas.length - 1;
  saveMaterias();
  renderCurrentPage();
  renderPageTabs();
}

function deleteCurrentPage() {
  if (!currentCaderno || currentCaderno.paginas.length <= 1) return;
  currentCaderno.paginas.splice(currentPageIndex, 1);
  if (currentPageIndex >= currentCaderno.paginas.length) {
    currentPageIndex = currentCaderno.paginas.length - 1;
  }
  saveMaterias();
  renderCurrentPage();
  renderPageTabs();
}

function exportNotebookPdf() {
  window.print();
}

applySavedPreferences();
renderDashboard();
initEditor();