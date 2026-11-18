let currentFontSize = 16;
let itemsList = JSON.parse(localStorage.getItem('mochila_items_v4')) || [
  { nome: "Banco de Dados", semestre: "2 Semestre", tipo: "Caderno", pauta: "Com pauta" },
  { nome: "Engenharia de Software", semestre: "3 Semestre", tipo: "Materia", pauta: "Sem pauta" }
];
let activeFilter = 'todos';

function changeFontSize(direction) {
  if (direction === 0) {
    currentFontSize = 16;
  } else if (direction === 1 && currentFontSize < 22) {
    currentFontSize += 2;
  } else if (direction === -1 && currentFontSize > 14) {
    currentFontSize -= 2;
  }
  document.documentElement.style.fontSize = currentFontSize + 'px';
}

function toggleTheme() {
  const htmlEl = document.documentElement;
  if (htmlEl.classList.contains('dark')) {
    htmlEl.classList.remove('dark');
  } else {
    htmlEl.classList.add('dark');
  }
}

function renderItems() {
  const grid = document.getElementById('cards-grid');
  const emptyMsg = document.getElementById('empty-msg');
  const counterBox = document.getElementById('counter-box');
  
  if (!grid) return;
  
  grid.innerHTML = '';
  
  const filteredList = activeFilter === 'todos' 
    ? itemsList 
    : itemsList.filter(item => item.semestre === activeFilter);

  if (counterBox) {
    counterBox.textContent = filteredList.length + ' Itens';
  }

  if (filteredList.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  filteredList.forEach((item, index) => {
    const realIndex = itemsList.indexOf(item);
    const card = document.createElement('div');
    card.className = 'notebook-cover p-6 rounded-xl shadow-md flex flex-col justify-between relative overflow-hidden';
    card.innerHTML = `
      <div class="absolute right-0 top-0 bottom-0 w-3 bg-cornflower opacity-40"></div>
      <div>
        <span class="inline-block bg-cornflower text-charcoal text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-wider">${item.tipo}</span>
        <h4 class="text-xl font-black mb-1">${item.nome}</h4>
        <p class="text-xs font-bold opacity-80">${item.semestre} | ${item.pauta || 'Com pauta'}</p>
      </div>
      <div class="mt-6 flex justify-between items-center pt-4 border-t border-cornflower/30">
        <span class="text-xs font-bold opacity-70">1 pagina</span>
        <button onclick="removeItem(${realIndex})" class="text-xs bg-sangria text-cosmic px-3.5 py-2 rounded-lg font-black hover:opacity-80 transition uppercase tracking-wider">Excluir</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterSemester(semestre) {
  activeFilter = semestre;
  renderItems();
}

function handleItemSubmit(event) {
  event.preventDefault();
  const nome = document.getElementById('item-nome').value;
  const semestre = document.getElementById('item-semestre').value;
  const tipo = document.getElementById('item-tipo').value;
  const pauta = document.getElementById('item-pauta').value;

  itemsList.push({ nome, semestre, tipo, pauta });
  localStorage.setItem('mochila_items_v4', JSON.stringify(itemsList));
  
  document.getElementById('item-nome').value = '';
  renderItems();
}

function removeItem(index) {
  itemsList.splice(index, 1);
  localStorage.setItem('mochila_items_v4', JSON.stringify(itemsList));
  renderItems();
}

renderItems();