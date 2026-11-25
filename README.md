# Mochila Inteligente

Plataforma web de organização acadêmica e de cadernos digitais para estudantes universitários. Projeto final da disciplina Desenvolvimento de Interfaces.

Autora: Carla Vicktória de Almeida Santana Palmiere, RA 22606839.

Site publicado: https://cvpalmiere.github.io/Projeto_Final_DI/
Repositório: https://github.com/cvpalmiere/Projeto_Final_DI

## O que o site faz

O estudante cria matérias, cria cadernos dentro de cada matéria, escolhe o tipo de folha (com pauta, sem pauta, quadriculado ou pontilhado) e escreve com o texto alinhado à linha da pauta. Também pode adicionar post its arrastáveis, imagens, marca página, várias páginas por caderno e exportar o caderno inteiro em PDF.

## Tecnologias

* HTML5, CSS3 e JavaScript puro, sem React.
* Tailwind CSS carregado pelo CDN, usado como framework de utilitários.
* localStorage do navegador para guardar matérias, cadernos, preferências e sugestões.
* GitHub e GitHub Pages para versionar e publicar.

## Estrutura de arquivos

* index.html: landing page com apresentação, cartões, estilos de folha, carrossel de imagens e formulário de sugestões.
* login.html: tela de acesso. O login é simulado, qualquer email e senha preenchidos liberam o painel, e existe a opção de entrar como visitante.
* dashboard.html: armário digital com criação de matérias e cadernos, busca e filtro por semestre.
* editor.html: editor do caderno com folha, barra de ferramentas, post its, imagens, páginas e exportação em PDF.
* style.css: estilos globais, variáveis de cor dos temas claro e escuro, pautas, impressão e acessibilidade.
* script.js: toda a lógica compartilhada entre as páginas.
* imagens: pasta com as três fotos de cadernos usadas no carrossel da landing page.
* README.md: esta documentação.

## Como executar

1. Baixe ou clone o repositório.
2. Mantenha todos os arquivos e a pasta imagens juntos.
3. Abra o index.html no navegador. Para o Tailwind funcionar é preciso estar conectado à internet.
4. Para publicar, envie os arquivos ao GitHub e ative o GitHub Pages em Settings, Pages, escolhendo a branch principal e a pasta raiz.

## Passo a passo da construção

### V1: protótipo único
Um único arquivo HTML juntando estrutura, estilo e script, só para validar a ideia de cadastrar itens.

### V2: modularização
O arquivo único foi separado em três: HTML, CSS e JS. O visual não mudou.

### V3: painel dinâmico
Renderização dinâmica dos itens por JavaScript e filtros por semestre, do 1º ao 10º.

### V4: identidade visual
Novo cabeçalho e cartões que simulam cadernos de capa dura, a partir de uma referência visual.

### V5: separação por páginas
O projeto passou a ter index.html, login.html e dashboard.html, todos ligados ao mesmo style.css e ao mesmo script.js. Tema e tamanho da fonte são salvos no localStorage e se mantêm entre as páginas.

### V6: matérias e cadernos
A lógica foi separada em matérias, que agrupam cadernos. Todos os dados de exemplo foram removidos e o sistema começa vazio.

### V7: editor de páginas
Criação do editor.html com simulação de folha, barra de formatação, post its, várias páginas e exportação em PDF pelo navegador.

### V8: polimento e acessibilidade
Busca em tempo real, destaque do filtro ativo, avisos visuais (toasts) e revisão de acessibilidade. A paleta passou a ser plana, sem gradientes, com tema claro em bege natural e tema escuro em cinza chumbo.

### Correções adicionais
Post it arrastável, marca página, seletor de cor do texto, inserção de imagens e pauta no fundo do PDF.

### Versão final de correções
1. Landing page: carrossel com três fotos horizontais de cadernos, em moldura de proporção fixa, com texto alternativo, legenda sobre a imagem, setas laterais, indicadores e navegação pelas setas do teclado.
2. Landing page: seção de contato para sugestões, com os campos Nome, Telefone e Sugestão, máscara de telefone, validação com mensagens de erro e aviso de confirmação ao enviar.
3. Cores: nomes das cores no Tailwind trocados por nomes que descrevem a função, como cor principal, cor de apoio, superfície e perigo, no lugar dos nomes da paleta antiga.
4. Contraste: cores do modo escuro e do vermelho do modo claro ajustadas para passar no nível AA da WCAG 2.1.
5. Exclusão: matérias, cadernos e páginas pedem confirmação antes de serem apagados.
6. Segurança: nomes e títulos digitados passam por escape de HTML, o conteúdo do editor é sanitizado e a colagem é feita apenas como texto simples.
7. Exportação: o PDF agora inclui todas as páginas do caderno, uma por folha A4, com post its, imagens e marca página. As posições são convertidas para porcentagem, então nada é cortado na lateral, e o conteúdo do site em volta não ocupa espaço na impressão.
8. Acessibilidade: link de pular para o conteúdo também no editor, rótulos ARIA nas abas de página e nos botões de excluir, e post its e imagens movidos pelas setas do teclado, com Shift para passos maiores.
9. Editor: o tamanho do texto fica salvo por caderno, título de seção e checklist entram na posição do cursor, e o salvamento usa debounce de 500 milissegundos.
10. Textos: acentuação revisada em todo o conteúdo em português.

## Paleta de cores

Modo claro: fundo #ECE8E0, card #F8F6F2, texto #1F1F22, texto secundário #5B5B61, azul #1155CC, vermelho #C81E2A, areia das bordas #D6CFC3, borda de campos #847E75, texto sobre botões #FFFFFF.

Modo escuro: fundo #18181A, card #232326, texto #F4F4F5, texto secundário #A9A9B0, azul #5B9BFF, vermelho #FF6B73, chumbo das bordas #38383D, borda de campos #8A8A92, texto sobre botões #0F0F12.

As cores ficam em variáveis CSS no início do style.css e são ligadas ao Tailwind por nomes de função. Para mudar a paleta basta alterar essas variáveis.

## Contraste medido

Todos os pares de texto passam no nível AA da WCAG 2.1, com mínimo de 4,5 para texto normal, e os textos principais chegam ao nível AAA, com mínimo de 7. Bordas de campos passam no mínimo de 3 para componentes de interface.

Modo claro: texto sobre fundo 13,45; texto sobre card 15,23; azul sobre card 6,09; branco sobre azul 6,57; vermelho sobre card 5,29; branco sobre vermelho 5,71; texto secundário sobre card 6,25; borda de campos sobre card 3,73.

Modo escuro: texto sobre fundo 16,13; texto sobre card 14,26; azul sobre card 5,66; texto escuro sobre azul 6,90; vermelho sobre card 5,67; texto escuro sobre vermelho 6,93; texto secundário sobre card 6,71; borda de campos sobre card 4,58.

## Funções principais do JavaScript

Preferências e avisos: applySavedPreferences, toggleTheme, changeFontSize, showToast.

Acesso: handleLogin e sair.

Landing page: initCarousel, showSlide, moveCarousel, goToSlide, maskPhone, handleContactSubmit e as funções de validação do formulário.

Armário: handleMateriaSubmit, handleCadernoSubmit, removeMateria, removeCaderno, filterSemester, handleSearch, renderDashboard.

Editor: initEditor, renderCurrentPage, renderPageTabs, handleEditorInput, changeSheetStyle, changeEditorTextSize, formatBold, insertSectionTitle, insertChecklist, changeTextColor, addStickyNote, handleImageUpload, toggleBookmark, addNewPage, deleteCurrentPage, montarImpressao e exportNotebookPdf.

Apoio: salvar, agendarSalvamento, esc e sanitizar.

## Armazenamento

Tudo fica no localStorage do navegador. As chaves são mochila_materias_v6, mochila_theme, mochila_font, mochila_user e mochila_sugestoes. Não existe servidor, então os dados ficam apenas no navegador de quem usa.

## Acessibilidade aplicada

* Link de pular para o conteúdo principal em todas as páginas.
* Alternância de tema claro e escuro e três botões de tamanho de fonte, com preferências salvas.
* Foco visível em todos os elementos interativos.
* Rótulos associados a todos os campos, mensagens de erro anunciadas por leitores de tela e atributo aria invalid nos campos com erro.
* Carrossel com papel de região, slides identificados, controles por botão e por teclado, sem troca automática.
* Texto alternativo nas imagens e atributos ARIA nos botões sem texto claro.
* Contraste verificado nos dois temas.

## Observações

* O login é uma simulação de interface. Não há verificação de senha nem servidor.
* O formulário de sugestões guarda as mensagens apenas no navegador, como demonstração.
* A exportação em PDF usa a impressão do navegador, escolha Salvar como PDF no destino.

## Referências e ferramentas

* WCAG 2.1, W3C: https://www.w3.org/TR/WCAG21/
* 10 heurísticas de usabilidade, Nielsen Norman Group: https://www.nngroup.com/articles/ten-usability-heuristics/
* WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
* Tailwind CSS: https://tailwindcss.com/docs
* Lovable, DeepSeek, Pinterest, Gemini
