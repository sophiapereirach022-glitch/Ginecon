import { showToast, loadFromLocalStorage } from "../reutilizaveis/index.js";

const STORAGE_KEY_USUARIOCOMUM = "UsuarioComum";
const STORAGE_KEY_MEDICO = "Medicos";

const usuariosComuns = loadFromLocalStorage(STORAGE_KEY_USUARIOCOMUM);
const medicos = loadFromLocalStorage(STORAGE_KEY_MEDICO);

const formLogin = document.querySelector("#form-login");

formLogin.addEventListener("submit", (e) => {
    e.preventDefault();  

    const email = document.querySelector("#login-email").value.trim();
    const senha = document.querySelector("#login-senha").value;

    if (!email || !senha) {
        showToast("Preencha todos os campos!", "error");
        return;
    }

    let usuarioEncontrado = usuariosComuns.find(u =>
        u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );
    let tipoUsuario = "";

    if (usuarioEncontrado) {
        tipoUsuario = "usuario";
    } else {
        usuarioEncontrado = medicos.find(m =>
            m.email.toLowerCase() === email.toLowerCase() && m.senha === senha
        );

        if (usuarioEncontrado) {
            tipoUsuario = "medico";
        }
    }

    if (usuarioEncontrado) {
       
        showToast("Login realizado com sucesso!", "success");

        localStorage.setItem("nomeUsuario", usuarioEncontrado.nome);
        localStorage.setItem("tipoUsuario", tipoUsuario);
        localStorage.setItem("idUsuario", usuarioEncontrado.id);

        setTimeout(() => {
            window.location.href = "../../HTML/forum.html";
        }, 1500);
    } else {
        showToast("E-mail ou senha incorretos", "error");
        return;
    }
});