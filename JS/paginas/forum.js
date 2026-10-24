import { showToast, saveToLocalStorage, loadFromLocalStorage } from "../reutilizaveis/index.js";

const botaoAbrirModal = document.querySelector('#PostarComentario');
const botaoFecharModal = document.querySelector('#botao-fechar-modal-postagem');
const overlayModal = document.querySelector('#overlay-modal-postagem');
const botaoConfirmar = document.querySelector('#botao-confirmar-postagem');
const listaPostagens = document.querySelector('#lista-postagens');
const campoPesquisa = document.querySelector('#campo-pesquisa');
const listaTopicos = document.querySelector('#lista-topicos');
const selectEspecialidade = document.querySelector('#especialidade-postagem');

let topicoAtivo = 'Todos';

const POSTAGENS_KEY = 'postagens';

// ── RENDERIZAÇÃO ──
function formatarData(iso) {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function criarCard(postagem) {
    const card = document.createElement('article');
    card.classList.add('card-postagem');

    const topo = document.createElement('div');
    topo.classList.add('card-topo');

    const autor = document.createElement('span');
    autor.classList.add('card-autor');
    autor.textContent = postagem.anonimo ? 'Anônimo' : (postagem.autor || 'Usuário');

    const data = document.createElement('span');
    data.classList.add('card-data');
    data.textContent = formatarData(postagem.data);

    topo.append(autor, data);

    const pergunta = document.createElement('p');
    pergunta.classList.add('card-pergunta');
    pergunta.textContent = postagem.pergunta;

    const tag = document.createElement('span');
    tag.classList.add('card-especialidade');
    tag.textContent = postagem.especialidade === 'Desconhecida'
        ? 'Especialidade: não definida'
        : postagem.especialidade;

    // quando existir sistema de respostas, mostrar a contagem e abrir a discussão
    const botaoRespostas = document.createElement('button');
    botaoRespostas.classList.add('card-respostas');
    botaoRespostas.textContent = 'Respostas';

    card.append(topo, pergunta, tag, botaoRespostas);
    return card;
}

function renderizarPostagens() {
    const postagens = loadFromLocalStorage(POSTAGENS_KEY) || [];
    const termo = campoPesquisa.value.trim().toLowerCase();
    listaPostagens.innerHTML = '';

    const filtradas = [...postagens].reverse().filter(p =>
        (topicoAtivo === 'Todos' || p.especialidade === topicoAtivo) &&
        p.pergunta.toLowerCase().includes(termo)
    );

    if (filtradas.length === 0) {
        const vazio = document.createElement('p');
        vazio.textContent = postagens.length === 0
            ? 'Nenhuma pergunta ainda. Seja o primeiro a postar!'
            : 'Nenhuma pergunta encontrada.';
        listaPostagens.appendChild(vazio);
        return;
    }

    filtradas.forEach(p => listaPostagens.appendChild(criarCard(p)));
}

// ── TÓPICOS (barra lateral) ──

function montarTopicos() {
    const topicos = [{ valor: 'Todos', texto: 'Todos' }];
    [...selectEspecialidade.options].forEach(o => {
        if (o.value !== 'Desconhecida') topicos.push({ valor: o.value, texto: o.textContent });
    });

    listaTopicos.innerHTML = '';
    topicos.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t.texto;
        li.dataset.topico = t.valor;
        if (t.valor === topicoAtivo) li.classList.add('ativo');
        li.addEventListener('click', () => {
            topicoAtivo = t.valor;
            listaTopicos.querySelectorAll('li').forEach(x => x.classList.toggle('ativo', x === li));
            renderizarPostagens();
        });
        listaTopicos.appendChild(li);
    });
}

campoPesquisa.addEventListener('input', renderizarPostagens);

// ── MODAL ──
function abrirModal() {
    overlayModal.classList.add('ativo');
}

function fecharModal() {
    overlayModal.classList.remove('ativo');
}

function limparModal() {
    document.querySelector('#pergunta').value = '';
    document.querySelector('#especialidade-postagem').value = 'Desconhecida';
    document.querySelector('input[name="anonimo"][value="nao"]').checked = true;
}

botaoAbrirModal.addEventListener('click', abrirModal);
botaoFecharModal.addEventListener('click', fecharModal);

overlayModal.addEventListener('click', (e) => {
    if (e.target === overlayModal) fecharModal();
});

// ── POSTAGEM ──
function registrarPostagem() {
    const pergunta = document.querySelector('#pergunta').value.trim();
    const especialidade = document.querySelector('#especialidade-postagem').value;
    const anonimo = document.querySelector('input[name="anonimo"]:checked').value === 'sim';

    if (!pergunta) {
        showToast('Escreva a pergunta!', 'error');
        return;
    }

    const postagens = loadFromLocalStorage(POSTAGENS_KEY) || [];

    const novaPostagem = {
        id: crypto.randomUUID(),
        pergunta,
        especialidade,
        anonimo,
        //Vou precisar do usuario depois pra colocar as infos
        autor: anonimo ? 'Anônimo' : null,
        data: new Date().toISOString()
    };

    postagens.push(novaPostagem);
    saveToLocalStorage(POSTAGENS_KEY, postagens);

    showToast('Postagem publicada com sucesso!', 'success');
    fecharModal();
    limparModal();
    renderizarPostagens();
}

botaoConfirmar.addEventListener('click', registrarPostagem);

montarTopicos();
renderizarPostagens();