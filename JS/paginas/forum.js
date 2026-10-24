import { showToast, saveToLocalStorage, loadFromLocalStorage, abreviarNomeFuncionario } from "../reutilizaveis/index.js";

// ---------- Chaves do localStorage (as mesmas do cadastro.js e login.js) ----------
const STORAGE_KEY_POSTAGENS = "postagens";
const STORAGE_KEY_USUARIOCOMUM = "UsuarioComum";
const STORAGE_KEY_MEDICO = "Medicos";

// ---------- Regras do fórum ----------
const LIMITE_RELEVANTE = 3;   // a partir desta pontuação a pergunta ganha o selo "Relevante"
const LIMITE_DENUNCIAS = 6;   // ao chegar nesta quantidade de denúncias, a pergunta é removida

// ---------- Elementos da página ----------
const botaoAbrirModal = document.querySelector("#PostarComentario");
const botaoFecharModal = document.querySelector("#botao-fechar-modal-postagem");
const overlayModal = document.querySelector("#overlay-modal-postagem");
const botaoConfirmar = document.querySelector("#botao-confirmar-postagem");
const listaPostagens = document.querySelector("#lista-postagens");
const campoPesquisa = document.querySelector("#campo-pesquisa");
const listaTopicos = document.querySelector("#lista-topicos");
const selectEspecialidade = document.querySelector("#especialidade-postagem");
const barraOrdenacao = document.querySelector("#ordenacao");
const botaoUsuario = document.querySelector("#BotaoUsuario");
const botaoSair = document.querySelector("#BotaoSair");

// ---------- Variáveis que mudam enquanto a página é usada ----------
let topicoAtivo = "Todos";       // tópico escolhido na barra lateral
let ordemAtiva = "relevantes";   // "relevantes" ou "recentes"
let respostasAbertas = [];       // ids das perguntas com a área de respostas aberta

// ---------- Usuário logado ----------
// O login.js guardou o id e o tipo ("usuario" ou "medico"). Com eles, achamos a pessoa na lista certa.
const idLogado = localStorage.getItem("idUsuario");
const tipoLogado = localStorage.getItem("tipoUsuario");
const ehMedico = tipoLogado === "medico";

let usuarioAtual = null; // continua null se ninguém estiver logado

if (idLogado) {
    let lista = [];

    if (ehMedico) {
        lista = loadFromLocalStorage(STORAGE_KEY_MEDICO);
    } else {
        lista = loadFromLocalStorage(STORAGE_KEY_USUARIOCOMUM);
    }

    // .find() devolve a pessoa com esse id (ou undefined se não achar)
    usuarioAtual = lista.find(u => u.id === idLogado) || null;
}

botaoUsuario.textContent = abreviarNomeFuncionario(usuarioAtual?.nome) || "Usuário";

botaoSair.addEventListener("click", () => {
    localStorage.removeItem("nomeUsuario");
    localStorage.removeItem("idUsuario");
    localStorage.removeItem("tipoUsuario");
    window.location.href = "forum.html";
});

// Usada antes de ações que precisam de login (postar, votar, responder, denunciar)
function exigirLogin() {
    if (usuarioAtual) {
        return true;
    }
    showToast("Faça login para continuar.", "error");
    return false;
}

// ---------- Funções auxiliares ----------

function formatarData(iso) {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// A data de nascimento vem do input date no formato "AAAA-MM-DD".
// split("-") separa o texto em ["AAAA", "MM", "DD"] e Number() transforma cada parte em número.
function calcularIdade(nascimento) {
    if (!nascimento) {
        return null;
    }

    const partes = nascimento.split("-");
    const ano = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    const hoje = new Date();
    let idade = hoje.getFullYear() - ano;

    // getMonth() começa em 0 (janeiro = 0), por isso somamos 1
    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    // se o aniversário ainda não chegou este ano, a pessoa ainda não fez essa idade
    if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
        idade--;
    }

    return idade;
}

// Cada voto é { usuarioId: "...", valor: 1 ou -1 }. A pontuação é a soma de todos os valores.
function calcularPontuacao(postagem) {
    let soma = 0;

    postagem.votos.forEach(voto => {
        soma += voto.valor;
    });

    return soma;
}

// Cria um selinho (etiqueta colorida) para o card
function criarSelo(texto, classe) {
    const selo = document.createElement("span");
    selo.classList.add("selo", classe);
    selo.textContent = texto;
    return selo;
}

// ---------- Ações: votar, validar, responder, denunciar, excluir ----------
// Todas seguem o mesmo caminho: carregar a lista, achar a postagem, alterar, salvar e redesenhar.

function votar(id, valor) {
    if (!exigirLogin()) return;

    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);
    const postagem = postagens.find(p => p.id === id);

    if (postagem.autorId === usuarioAtual.id) {
        showToast("Você não pode votar na sua própria pergunta.", "error");
        return;
    }

    // procura se este usuário já votou nesta pergunta
    const meuVoto = postagem.votos.find(v => v.usuarioId === usuarioAtual.id);

    if (!meuVoto) {
        // ainda não votou: cria o voto
        postagem.votos.push({ usuarioId: usuarioAtual.id, valor: valor });
    } else if (meuVoto.valor === valor) {
        // clicou de novo no mesmo voto: remove o voto
        postagem.votos = postagem.votos.filter(v => v.usuarioId !== usuarioAtual.id);
    } else {
        // mudou de ▲ para ▼ (ou o contrário)
        meuVoto.valor = valor;
    }

    saveToLocalStorage(STORAGE_KEY_POSTAGENS, postagens);
    renderizarPostagens();
}

function alternarValidacao(id) {
    if (!ehMedico) return;

    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);
    const postagem = postagens.find(p => p.id === id);

    if (postagem.validacao) {
        postagem.validacao = null; // já estava validada: remove
        showToast("Validação removida.", "success");
    } else {
        postagem.validacao = {
            medicoId: usuarioAtual.id,
            medicoNome: usuarioAtual.nome,
            crm: usuarioAtual.crm,
            data: new Date().toISOString()
        };
        showToast("Pergunta validada!", "success");
    }

    saveToLocalStorage(STORAGE_KEY_POSTAGENS, postagens);
    renderizarPostagens();
}

function responder(id, texto) {
    if (!exigirLogin()) return;

    if (!texto) {
        showToast("Escreva a resposta!", "error");
        return;
    }

    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);
    const postagem = postagens.find(p => p.id === id);

    if (postagem.autorId === usuarioAtual.id) {
        showToast("Você não pode responder à sua própria pergunta.", "error");
        return;
    }

    postagem.respostas.push({
        id: crypto.randomUUID(),
        texto: texto,
        autorId: usuarioAtual.id,
        autorNome: usuarioAtual.nome,
        autorTipo: tipoLogado,
        autorCrm: usuarioAtual.crm || null,
        data: new Date().toISOString(),
        denuncias: []
    });

    saveToLocalStorage(STORAGE_KEY_POSTAGENS, postagens);
    showToast("Resposta enviada!", "success");
    renderizarPostagens();
}

function denunciar(id) {
    if (!exigirLogin()) return;

    if (!ehMedico) {
        showToast("Apenas médicos podem denunciar.", "error");
        return;
    }

    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);
    const postagem = postagens.find(p => p.id === id);

    if (postagem.autorId === usuarioAtual.id) {
        showToast("Você não pode denunciar a sua própria pergunta.", "error");
        return;
    }

    // postagem.denuncias é uma lista com o id de cada médico que denunciou
    const jaDenunciou = postagem.denuncias.find(idMedico => idMedico === usuarioAtual.id);
    if (jaDenunciou !== undefined) {
        showToast("Você já denunciou esta pergunta.", "error");
        return;
    }

    if (!confirm("Denunciar esta pergunta? Essa ação não pode ser desfeita.")) return;

    postagem.denuncias.push(usuarioAtual.id);

    if (postagem.denuncias.length >= LIMITE_DENUNCIAS) {
        // .filter() cria uma nova lista SEM a pergunta denunciada
        const restantes = postagens.filter(p => p.id !== id);
        saveToLocalStorage(STORAGE_KEY_POSTAGENS, restantes);
        showToast("Pergunta removida após atingir o limite de denúncias.", "success");
    } else {
        saveToLocalStorage(STORAGE_KEY_POSTAGENS, postagens);
        showToast(`Denúncia registrada (${postagem.denuncias.length}/${LIMITE_DENUNCIAS}).`, "success");
    }

    renderizarPostagens();
}

function denunciarResposta(idPostagem, idResposta) {
    if (!exigirLogin()) return;

    if (!ehMedico) {
        showToast("Apenas médicos podem denunciar.", "error");
        return;
    }

    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);
    const postagem = postagens.find(p => p.id === idPostagem);
    const resposta = postagem.respostas.find(r => r.id === idResposta);

    if (resposta.autorId === usuarioAtual.id) {
        showToast("Você não pode denunciar a sua própria resposta.", "error");
        return;
    }

    const jaDenunciou = resposta.denuncias.find(idMedico => idMedico === usuarioAtual.id);
    if (jaDenunciou !== undefined) {
        showToast("Você já denunciou esta resposta.", "error");
        return;
    }

    if (!confirm("Denunciar esta resposta? Essa ação não pode ser desfeita.")) return;

    resposta.denuncias.push(usuarioAtual.id);

    if (resposta.denuncias.length >= LIMITE_DENUNCIAS) {
        // cria uma nova lista de respostas SEM a denunciada
        postagem.respostas = postagem.respostas.filter(r => r.id !== idResposta);
        showToast("Resposta removida após atingir o limite de denúncias.", "success");
    } else {
        showToast(`Denúncia registrada (${resposta.denuncias.length}/${LIMITE_DENUNCIAS}).`, "success");
    }

    saveToLocalStorage(STORAGE_KEY_POSTAGENS, postagens);
    renderizarPostagens();
}

function excluirPostagem(id) {
    if (!confirm("Excluir esta pergunta?")) return;

    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);
    const restantes = postagens.filter(p => p.id !== id);
    saveToLocalStorage(STORAGE_KEY_POSTAGENS, restantes);

    showToast("Pergunta excluída.", "success");
    renderizarPostagens();
}

// Abre ou fecha a área de respostas de uma pergunta
function alternarRespostas(id) {
    if (respostasAbertas.includes(id)) {
        respostasAbertas = respostasAbertas.filter(x => x !== id);
    } else {
        respostasAbertas.push(id);
    }
    renderizarPostagens();
}

// ---------- Renderização: respostas ----------

function criarSecaoRespostas(postagem) {
    const secao = document.createElement("div");
    secao.classList.add("secao-respostas");

    if (postagem.respostas.length === 0) {
        const vazio = document.createElement("p");
        vazio.classList.add("sem-respostas");
        vazio.textContent = "Ainda não há respostas.";
        secao.appendChild(vazio);
    }

    postagem.respostas.forEach(r => {
        const item = document.createElement("div");
        item.classList.add("resposta");

        const topo = document.createElement("div");
        topo.classList.add("resposta-topo");

        const nome = document.createElement("span");
        nome.classList.add("resposta-autor");
        nome.textContent = abreviarNomeFuncionario(r.autorNome) || "Usuário";
        topo.appendChild(nome);

        // respostas de médicos ganham um selo
        if (r.autorTipo === "medico") {
            const selo = criarSelo("Médico(a)", "selo-medico");
            if (r.autorCrm) {
                selo.title = "CRM " + r.autorCrm;
            }
            topo.appendChild(selo);
        }

        const data = document.createElement("span");
        data.textContent = formatarData(r.data);
        topo.appendChild(data);

        // médico pode denunciar respostas de outras pessoas
        if (ehMedico && r.autorId !== usuarioAtual.id) {
            const denuncia = r.denuncias.find(idMedico => idMedico === usuarioAtual.id);
            const jaDenunciei = denuncia !== undefined;

            const botaoDenunciarResposta = document.createElement("button");
            botaoDenunciarResposta.classList.add("resposta-denunciar");
            botaoDenunciarResposta.textContent = (jaDenunciei ? "Denunciada" : "Denunciar") +
                ` (${r.denuncias.length}/${LIMITE_DENUNCIAS})`;
            botaoDenunciarResposta.disabled = jaDenunciei;
            botaoDenunciarResposta.addEventListener("click", () => {
                denunciarResposta(postagem.id, r.id);
            });
            topo.appendChild(botaoDenunciarResposta);
        }

        const texto = document.createElement("p");
        texto.classList.add("resposta-texto");
        texto.textContent = r.texto;

        item.append(topo, texto);
        secao.appendChild(item);
    });

    // Formulário: só aparece para quem está logado e NÃO é o autor da pergunta
    if (!usuarioAtual) {
        const aviso = document.createElement("p");
        aviso.classList.add("aviso-resposta");
        aviso.textContent = "Faça login para responder.";
        secao.appendChild(aviso);
    } else if (postagem.autorId === usuarioAtual.id) {
        const aviso = document.createElement("p");
        aviso.classList.add("aviso-resposta");
        aviso.textContent = "Você não pode responder à sua própria pergunta.";
        secao.appendChild(aviso);
    } else {
        const form = document.createElement("div");
        form.classList.add("form-resposta");

        const campo = document.createElement("textarea");
        campo.placeholder = "Escreva sua resposta...";

        const botaoEnviar = document.createElement("button");
        botaoEnviar.textContent = "Responder";
        botaoEnviar.addEventListener("click", () => {
            responder(postagem.id, campo.value.trim());
        });

        form.append(campo, botaoEnviar);
        secao.appendChild(form);
    }

    return secao;
}

// ---------- Renderização: card da pergunta ----------

function criarColunaVotos(postagem) {
    const pontos = calcularPontuacao(postagem);

    // descobre se o usuário atual já votou (1, -1 ou 0 se não votou)
    let meuVoto = 0;
    if (usuarioAtual) {
        const voto = postagem.votos.find(v => v.usuarioId === usuarioAtual.id);
        if (voto) {
            meuVoto = voto.valor;
        }
    }

    const coluna = document.createElement("div");
    coluna.classList.add("card-votos");

    const botaoCima = document.createElement("button");
    botaoCima.classList.add("voto");
    botaoCima.textContent = "▲";
    botaoCima.title = "Marcar como relevante";
    if (meuVoto === 1) botaoCima.classList.add("votado");
    botaoCima.addEventListener("click", () => votar(postagem.id, 1));

    const placar = document.createElement("span");
    placar.classList.add("card-placar");
    placar.textContent = pontos;

    const botaoBaixo = document.createElement("button");
    botaoBaixo.classList.add("voto", "voto-baixo");
    botaoBaixo.textContent = "▼";
    botaoBaixo.title = "Marcar como pouco relevante";
    if (meuVoto === -1) botaoBaixo.classList.add("votado");
    botaoBaixo.addEventListener("click", () => votar(postagem.id, -1));

    coluna.append(botaoCima, placar, botaoBaixo);
    return coluna;
}

function criarAcoes(postagem) {
    const ehAutor = usuarioAtual && postagem.autorId === usuarioAtual.id;

    const acoes = document.createElement("div");
    acoes.classList.add("card-acoes");

    // botão de respostas (todo mundo vê)
    const botaoRespostas = document.createElement("button");
    botaoRespostas.classList.add("card-respostas");
    botaoRespostas.textContent = `Respostas (${postagem.respostas.length})`;
    botaoRespostas.addEventListener("click", () => alternarRespostas(postagem.id));
    acoes.appendChild(botaoRespostas);

    // médico que não é o autor pode validar.
    // Se já foi validada, só o médico que validou pode remover.
    const podeValidar = ehMedico && !ehAutor &&
        (!postagem.validacao || postagem.validacao.medicoId === usuarioAtual.id);

    if (podeValidar) {
        const botaoValidar = document.createElement("button");
        botaoValidar.classList.add("card-validar");
        botaoValidar.textContent = postagem.validacao ? "Remover validação" : "Validar pergunta";
        botaoValidar.addEventListener("click", () => alternarValidacao(postagem.id));
        acoes.appendChild(botaoValidar);
    }

    // todo médico vê o botão de denunciar. No post do próprio médico ele fica desativado.
    if (ehMedico) {
        const denuncia = postagem.denuncias.find(idMedico => idMedico === usuarioAtual.id);
        const jaDenunciei = denuncia !== undefined;

        const botaoDenunciar = document.createElement("button");
        botaoDenunciar.classList.add("card-denunciar");
        botaoDenunciar.textContent = (jaDenunciei ? "Denunciada" : "Denunciar") +
            ` (${postagem.denuncias.length}/${LIMITE_DENUNCIAS})`;

        if (ehAutor) {
            botaoDenunciar.disabled = true;
            botaoDenunciar.title = "Você não pode denunciar a sua própria pergunta";
        } else {
            botaoDenunciar.disabled = jaDenunciei;
        }

        botaoDenunciar.addEventListener("click", () => denunciar(postagem.id));
        acoes.appendChild(botaoDenunciar);
    }

    // só o dono da pergunta vê o botão de excluir
    if (ehAutor) {
        const botaoExcluir = document.createElement("button");
        botaoExcluir.classList.add("card-excluir");
        botaoExcluir.textContent = "Excluir";
        botaoExcluir.addEventListener("click", () => excluirPostagem(postagem.id));
        acoes.appendChild(botaoExcluir);
    }

    return acoes;
}

function criarCard(postagem) {
    const pontos = calcularPontuacao(postagem);

    const card = document.createElement("article");
    card.classList.add("card-postagem");

    const conteudo = document.createElement("div");
    conteudo.classList.add("card-conteudo");

    // ---- topo: nome (ou "Anônimo"), idade e data ----
    // A idade aparece mesmo em posts anônimos, para o médico se basear na faixa etária.
    const idade = calcularIdade(postagem.autorNascimento);

    let nomeAutor = "Anônimo";
    if (!postagem.anonimo) {
        nomeAutor = abreviarNomeFuncionario(postagem.autorNome) || "Usuário";
    }

    const autor = document.createElement("span");
    autor.classList.add("card-autor");
    if (idade !== null) {
        autor.textContent = `${nomeAutor}, ${idade} anos`;
    } else {
        autor.textContent = nomeAutor;
    }

    const data = document.createElement("span");
    data.classList.add("card-data");
    data.textContent = formatarData(postagem.data);

    const topo = document.createElement("div");
    topo.classList.add("card-topo");
    topo.append(autor, data);

    // ---- selos ----
    const selos = document.createElement("div");
    selos.classList.add("card-selos");

    if (pontos >= LIMITE_RELEVANTE) {
        selos.appendChild(criarSelo("Relevante", "selo-relevante"));
    }

    if (postagem.validacao) {
        const verificado = criarSelo("✔ Verificado por um médico", "selo-verificado");
        verificado.title = `${postagem.validacao.medicoNome} - CRM ${postagem.validacao.crm}`;
        selos.appendChild(verificado);
    }

    // ---- pergunta e especialidade ----
    const pergunta = document.createElement("p");
    pergunta.classList.add("card-pergunta");
    pergunta.textContent = postagem.pergunta;

    const tag = document.createElement("span");
    tag.classList.add("card-especialidade");
    if (postagem.especialidade === "Desconhecida") {
        tag.textContent = "Especialidade: não definida";
    } else {
        tag.textContent = postagem.especialidade;
    }

    // ---- montagem final ----
    conteudo.appendChild(topo);
    if (selos.children.length > 0) {
        conteudo.appendChild(selos);
    }
    conteudo.append(pergunta, tag, criarAcoes(postagem));

    if (respostasAbertas.includes(postagem.id)) {
        conteudo.appendChild(criarSecaoRespostas(postagem));
    }

    card.append(criarColunaVotos(postagem), conteudo);
    return card;
}

// ---------- Renderização: lista de perguntas ----------

function renderizarPostagens() {
    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);
    const termo = campoPesquisa.value.trim().toLowerCase();

    listaPostagens.innerHTML = "";

    // 1) Ordenar. sort() compara duas perguntas (a e b) por vez:
    //    número negativo = a vem antes, positivo = b vem antes.
    //    Em "relevantes" vence a maior pontuação; se empatar (ou em "recentes"), a mais nova.
    const ordenadas = [...postagens].sort((a, b) => {
        if (ordemAtiva === "relevantes") {
            const diferenca = calcularPontuacao(b) - calcularPontuacao(a);
            if (diferenca !== 0) {
                return diferenca;
            }
        }
        return new Date(b.data) - new Date(a.data);
    });

    // 2) Filtrar por tópico e pelo texto da pesquisa
    const filtradas = ordenadas.filter(p => {
        let passouNoTopico = false;

        if (topicoAtivo === "Todos") {
            passouNoTopico = true;
        } else if (topicoAtivo === "minhas") {
            passouNoTopico = usuarioAtual !== null && p.autorId === usuarioAtual.id;
        } else {
            passouNoTopico = p.especialidade === topicoAtivo;
        }

        const passouNaPesquisa = p.pergunta.toLowerCase().includes(termo);

        return passouNoTopico && passouNaPesquisa;
    });

    // 3) Desenhar
    if (filtradas.length === 0) {
        const vazio = document.createElement("p");
        if (postagens.length === 0) {
            vazio.textContent = "Nenhuma pergunta ainda. Seja o primeiro a postar!";
        } else {
            vazio.textContent = "Nenhuma pergunta encontrada.";
        }
        listaPostagens.appendChild(vazio);
        return;
    }

    filtradas.forEach(p => {
        listaPostagens.appendChild(criarCard(p));
    });
}

// ---------- Ordenação (botões no topo do feed) ----------

barraOrdenacao.querySelectorAll("button").forEach(botao => {
    botao.addEventListener("click", () => {
        ordemAtiva = botao.dataset.ordem;

        // deixa só o botão clicado com a classe "ativo"
        barraOrdenacao.querySelectorAll("button").forEach(b => b.classList.remove("ativo"));
        botao.classList.add("ativo");

        renderizarPostagens();
    });
});

// ---------- Tópicos (barra lateral) ----------

function montarTopicos() {
    // cada tópico tem um valor (usado no filtro) e um texto (mostrado na tela)
    const topicos = [
        { valor: "Todos", texto: "Todos" },
        { valor: "minhas", texto: "Minhas perguntas" }
    ];

    // as especialidades vêm do <select> do modal, então só mudamos o HTML para criar novas
    [...selectEspecialidade.options].forEach(opcao => {
        if (opcao.value !== "Desconhecida") {
            topicos.push({ valor: opcao.value, texto: opcao.textContent });
        }
    });

    listaTopicos.innerHTML = "";

    topicos.forEach(t => {
        const li = document.createElement("li");
        li.textContent = t.texto;

        if (t.valor === topicoAtivo) {
            li.classList.add("ativo");
        }

        li.addEventListener("click", () => {
            topicoAtivo = t.valor;

            listaTopicos.querySelectorAll("li").forEach(item => item.classList.remove("ativo"));
            li.classList.add("ativo");

            renderizarPostagens();
        });

        listaTopicos.appendChild(li);
    });
}

campoPesquisa.addEventListener("input", renderizarPostagens);

// ---------- Modal de nova pergunta ----------

function abrirModal() {
    if (!exigirLogin()) return;
    overlayModal.classList.add("ativo");
}

function fecharModal() {
    overlayModal.classList.remove("ativo");
}

function limparModal() {
    document.querySelector("#pergunta").value = "";
    selectEspecialidade.value = "Desconhecida";
    document.querySelector('input[name="anonimo"][value="nao"]').checked = true;
}

botaoAbrirModal.addEventListener("click", abrirModal);
botaoFecharModal.addEventListener("click", fecharModal);

// clicar no fundo escuro (fora da caixa branca) também fecha o modal
overlayModal.addEventListener("click", (event) => {
    if (event.target === overlayModal) {
        fecharModal();
    }
});

// ---------- Nova postagem ----------

function registrarPostagem() {
    if (!exigirLogin()) return;

    const pergunta = document.querySelector("#pergunta").value.trim();
    const especialidade = selectEspecialidade.value;
    const anonimo = document.querySelector('input[name="anonimo"]:checked').value === "sim";

    if (!pergunta) {
        showToast("Escreva a pergunta!", "error");
        return;
    }

    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);

    const novaPostagem = {
        id: crypto.randomUUID(),
        pergunta: pergunta,
        especialidade: especialidade,
        anonimo: anonimo,
        autorId: usuarioAtual.id,
        autorNome: anonimo ? null : usuarioAtual.nome, // em post anônimo o nome não é guardado
        autorNascimento: usuarioAtual.datanasc,        // a idade é calculada a partir dela
        data: new Date().toISOString(),
        respostas: [],
        votos: [],
        validacao: null,
        denuncias: []
    };

    postagens.push(novaPostagem);
    saveToLocalStorage(STORAGE_KEY_POSTAGENS, postagens);

    showToast("Postagem publicada com sucesso!", "success");
    fecharModal();
    limparModal();
    renderizarPostagens();
}

botaoConfirmar.addEventListener("click", registrarPostagem);


montarTopicos();
renderizarPostagens();