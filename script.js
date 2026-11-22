let currentFontSize = parseInt(localStorage.getItem('mochila_font')) || 16;
let materiasList = JSON.parse(localStorage.getItem('mochila_materias_v6')) || [];
let activeFilter = 'todos';

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
        cadernosHtml += `
          <div class="notebook-cover p-5 rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden">
            <div class="absolute right-0 top-0 bottom-0 w-3 bg-cornflower opacity-40"></div>
            <div>
              <span class="inline-block bg-cornflower text-charcoal text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">${caderno.semestre}</span>
              <h4 class="text-lg font-black mb-1">${caderno.titulo}</h4>
              <p class="text-xs font-bold opacity-80">${caderno.pauta}</p>
            </div>
            <div class="mt-5 flex justify-between items-center pt-3 border-t border-cornflower/30">
              <span class="text-xs font-bold opacity-70">1 pagina</span>
              <button onclick="removeCaderno(${materia.id}, ${caderno.id})" class="text-xs bg-sangria text-cosmic px-3 py-1.5 rounded-lg font-black hover:opacity-80 transition uppercase tracking-wider">Excluir</button>
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
    pauta: pauta
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

applySavedPreferences();
renderDashboard();