// LocalStorage
export function loadFromLocalStorage(key) {
    const json = localStorage.getItem(key);
    if (json === null) {
        return [];
    }
    return JSON.parse(json);
}

export function saveToLocalStorage(key, data) {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
}

//showToast
export function showToast(msg, type, timeout = 1500) {
    const toast = document.createElement('div');
    toast.innerHTML = msg;
    toast.classList.add('toast')

    if (type !== undefined && typeof type === 'string') {
        toast.classList.add(type);
    }

    document.body.append(toast);

    setTimeout(() => {
        toast.classList.add('show-toast');

    }, 1)

    setTimeout(() => {
        toast.classList.remove('show-toast');
        setTimeout(() => {
            toast.remove();
        }, 200);
    }, timeout)
}

/* === TALVEZ SEJA ÚTIL GALERA====*/
//nome usuario - tem que ajustar pra essa pagina do ginecon
export function exibirNomeFuncionario() {
    const nome = localStorage.getItem("nomeUsuario");
    document.querySelector("#nome-usuario").textContent = abreviarNomeFuncionario(nome) || "Usuário";
}

//abrevia nome usuario, pega o primeiro nome e o último
export function abreviarNomeFuncionario(nomeCompleto) {
    if (!nomeCompleto) {
        return null;
    }
    const abreviacao = nomeCompleto.trim().split(' ');
    if (abreviacao.length === 1) {
        return abreviacao[0].toUpperCase();

    } else {
        const primeiroNome = abreviacao[0];
        const ultimoNome = abreviacao[abreviacao.length - 1];

        return `${primeiroNome} ${ultimoNome}`
    }
    //lembrar que uma string funciona que nem um array de caracteres
    //então exemplo: "sophia"[0] - "S" "Sophia"[1] - "O"
}

export function abreviarNomeFuncionario2(nomeCompleto) {
    if (!nomeCompleto) {
        return null;
    }
    const abreviacao2 = nomeCompleto.trim().split(' ');
    if (abreviacao2.length === 1) {
        return abreviacao2[0][0].toUpperCase();
    } else {
        const primeiroNome = abreviacao2[0];
        const ultimoNome = abreviacao2[abreviacao2.length - 1];
        return `${primeiroNome[0]}${ultimoNome[0].toUpperCase()}`;
    }
}


function logout() {
    window.location.href = '../portal_login.html';
}

const btnLogout = document.querySelector('#logout-txt');
if (btnLogout) {
    btnLogout.addEventListener('click', logout);
}