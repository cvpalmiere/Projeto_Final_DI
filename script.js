let currentFontSize = 16;
let itemsList = JSON.parse(localStorage.getItem('mochila_items')) || [];

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

function scrollToApp() {
  document.getElementById('app-section').scrollIntoView({ behavior: 'smooth' });
}

function renderItems() {
  const grid = document.getElementById('cards-grid');
  const emptyMsg = document.getElementById('empty-msg');
  const counterBox = document.getElementById('counter-box');
  
  grid.innerHTML = '';
  counterBox.textContent = itemsList.length + ' Itens Cadastrados';

  if (itemsList.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  itemsList.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'custom-card p-5 rounded-xl shadow-md border border-cornflower/30 flex justify-between items-center';
    card.innerHTML = `
      <div>
        <span class="inline-block bg-cornflower text-charcoal text-xs font-bold px-2 py-0.5 rounded mb-2">${item.tipo}</span>
        <h4 class="text-lg font-bold">${item.nome}</h4>
        <p class="text-xs opacity-80 mt-1">${item.semestre}</p>
      </div>
      <button onclick="removeItem(${index})" class="text-xs bg-sangria text-cosmic px-3 py-1.5 rounded font-bold hover:opacity-80">Excluir</button>
    `;
    grid.appendChild(card);
  });
}

function handleItemSubmit(event) {
  event.preventDefault();
  const nome = document.getElementById('item-nome').value;
  const semestre = document.getElementById('item-semestre').value;
  const tipo = document.getElementById('item-tipo').value;

  itemsList.push({ nome, semestre, tipo });
  localStorage.setItem('mochila_items', JSON.stringify(itemsList));
  
  document.getElementById('item-nome').value = '';
  renderItems();
}

function removeItem(index) {
  itemsList.splice(index, 1);
  localStorage.setItem('mochila_items', JSON.stringify(itemsList));
  renderItems();
}

renderItems();