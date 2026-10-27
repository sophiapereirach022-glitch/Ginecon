import { loadFromLocalStorage, abreviarNomeFuncionario } from "../reutilizaveis/index.js";


const STORAGE_KEY_POSTAGENS = "postagens";


const QUANTIDADE_DESTAQUES = 3;   
const TAMANHO_MAXIMO_TEXTO = 220; 

const listaDestaques = document.querySelector("#lista-destaques");


function calcularPontuacao(postagem) {
    let soma = 0;

    if (!Array.isArray(postagem.votos)) {
        return 0;
    }

    postagem.votos.forEach(voto => {
        soma += voto.valor;
    });

    return soma;
}

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

    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) {
        idade--;
    }

 
    if (idade < 0 || idade > 120) {
        return null;
    }

    return idade;
}

function formatarData(iso) {
    return new Date(iso).toLocaleDateString("pt-BR");
}

function encurtarTexto(texto) {
    if (texto.length <= TAMANHO_MAXIMO_TEXTO) {
        return texto;
    }
    return texto.slice(0, TAMANHO_MAXIMO_TEXTO).trim() + "...";
}


function buscarDestaques() {
    const postagens = loadFromLocalStorage(STORAGE_KEY_POSTAGENS);

    
    const comPontos = postagens.filter(p => calcularPontuacao(p) > 0);

    comPontos.sort((a, b) => {
        const diferenca = calcularPontuacao(b) - calcularPontuacao(a);
        if (diferenca !== 0) {
            return diferenca;
        }
        return new Date(b.data) - new Date(a.data);
    });

    
    return comPontos.slice(0, QUANTIDADE_DESTAQUES);
}

function criarCardDestaque(postagem) {
    const pontos = calcularPontuacao(postagem);
    const idade = calcularIdade(postagem.autorNascimento);


    let nomeAutor = "Anônimo";
    if (!postagem.anonimo) {
        nomeAutor = abreviarNomeFuncionario(postagem.autorNome) || "Usuário";
    }

    const card = document.createElement("article");
    card.classList.add("comentarioResposta");

   
    const avatar = document.createElement("div");
    avatar.classList.add("avatarMedico");
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = postagem.anonimo ? "?" : nomeAutor[0].toUpperCase();

    const corpo = document.createElement("div");
    corpo.classList.add("corpo");

    const balao = document.createElement("div");
    balao.classList.add("balao");

    const topo = document.createElement("div");
    topo.classList.add("destaque-topo");

    const identificacao = document.createElement("div");
    identificacao.classList.add("destaque-identificacao");

    const autor = document.createElement("strong");
    autor.classList.add("medicoAutor");
    if (idade !== null) {
        autor.textContent = `${nomeAutor}, ${idade} anos`;
    } else {
        autor.textContent = nomeAutor;
    }

    const data = document.createElement("span");
    data.classList.add("destaque-data");
    data.textContent = formatarData(postagem.data);

    identificacao.append(autor, data);

    const placar = document.createElement("span");
    placar.classList.add("destaque-pontos");
    placar.textContent = `▲ ${pontos}`;
    placar.title = "Pontuação da pergunta";

    topo.append(identificacao, placar);

    const pergunta = document.createElement("p");
    pergunta.textContent = encurtarTexto(postagem.pergunta);

    balao.append(topo, pergunta);

    const rodape = document.createElement("div");
    rodape.classList.add("destaque-rodape");

    if (postagem.especialidade && postagem.especialidade !== "Desconhecida") {
        const tag = document.createElement("span");
        tag.classList.add("destaque-tag");
        tag.textContent = postagem.especialidade;
        rodape.appendChild(tag);
    }

    if (postagem.validacao) {
        const selo = document.createElement("small");
        selo.textContent = "✔ Verificado por um médico";
        rodape.appendChild(selo);
    }

    if (rodape.children.length > 0) {
        balao.appendChild(rodape);
    }

    corpo.appendChild(balao);
    card.append(avatar, corpo);
    return card;
}

function renderizarDestaques() {
    const destaques = buscarDestaques();

    listaDestaques.innerHTML = "";

    if (destaques.length === 0) {
        const vazio = document.createElement("p");
        vazio.textContent = "Ainda não há perguntas em destaque. Participe do fórum!";
        listaDestaques.appendChild(vazio);
        return;
    }

    destaques.forEach(p => {
        listaDestaques.appendChild(criarCardDestaque(p));
    });
}

renderizarDestaques();