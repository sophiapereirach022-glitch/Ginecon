import { showToast, loadFromLocalStorage } from "../reutilizaveis/index.js";

// mesmas chaves usadas no cadastro.js
const STORAGE_KEY_USUARIOCOMUM = "UsuarioComum";
const STORAGE_KEY_MEDICO = "Medicos";

// "|| []" garante uma lista vazia caso ainda não exista ninguém cadastrado
const usuariosComuns = loadFromLocalStorage(STORAGE_KEY_USUARIOCOMUM);
const medicos = loadFromLocalStorage(STORAGE_KEY_MEDICO);

// aqui pegamos o próprio formulário (sem .value, o form não tem valor)
const formLogin = document.querySelector("#form-login");

formLogin.addEventListener("submit", (event) => {
    event.preventDefault();  

    const email = document.querySelector("#login-email").value.trim();

    const senha = document.querySelector("#login-senha").value;

    if (!email || !senha) {
        showToast("Preencha todos os campos!", "error");
        return;
        //se o email for falsy ou a senha também, ele mostra o toast de erro e encerra a função
    }

    // procura primeiro entre os usuários comuns
    let usuarioEncontrado = usuariosComuns.find(u =>
        u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );
    let tipoUsuario = "";

    if (usuarioEncontrado) {
        tipoUsuario = "usuario";
    } else {
        // se não achou, procura entre os médicos
        usuarioEncontrado = medicos.find(m =>
            m.email.toLowerCase() === email.toLowerCase() && m.senha === senha
        );

        if (usuarioEncontrado) {
            tipoUsuario = "medico";
        }
    }

    if (usuarioEncontrado) {
       
        showToast("Login realizado com sucesso!", "success");

        // guarda quem está logado e de que tipo ("usuario" ou "medico")
        localStorage.setItem("nomeUsuario", usuarioEncontrado.nome);
        localStorage.setItem("tipoUsuario", tipoUsuario);
        localStorage.setItem("idUsuario", usuarioEncontrado.id);
        //remover as duas chaves no logout

        setTimeout(() => {
            window.location.href = "../../HTML/forum.html";
        }, 1500);
    } else {
        showToast("E-mail ou senha incorretos", "error");
        return;
    }
});