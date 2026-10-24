import { loadFromLocalStorage, saveToLocalStorage, showToast } from "../reutilizaveis/index.js";

const STORAGE_KEY_USUARIOCOMUM = "UsuarioComum";
const STORAGE_KEY_MEDICO = "Medicos";

const usuariosComuns = loadFromLocalStorage(STORAGE_KEY_USUARIOCOMUM);
const medicos = loadFromLocalStorage(STORAGE_KEY_MEDICO);

const formUsuario = document.querySelector("#form-usuario");
const formMedico = document.querySelector("#form-medico");

// ---------- Verificação de duplicados ----------
// .some() percorre a lista e devolve true se ALGUÉM cumprir a condição.
// Procuramos nas duas listas (usuários e médicos), porque a mesma pessoa
// não deve ter duas contas, nem como usuária e médica ao mesmo tempo.
 
function cpfJaCadastrado(cpf) {
    // replace(/\D/g, "") tira tudo que não é número, então "123.456.789-00" vira "12345678900"
    const cpfLimpo = cpf.replace(/\D/g, "");
    const todos = usuariosComuns.concat(medicos);
 
    return todos.some(pessoa => pessoa.cpf.replace(/\D/g, "") === cpfLimpo);
}
 
function emailJaCadastrado(email) {
    const todos = usuariosComuns.concat(medicos);
 
    return todos.some(pessoa => pessoa.email.toLowerCase() === email.toLowerCase());
}
 
function crmJaCadastrado(crm) {
  
    return medicos.some(m => m.crm.toLowerCase() === crm.toLowerCase());
}
 

function cadastrarUsuarioComum() {
    const nome = document.querySelector("#u-nome").value.trim();
    const cpf = document.querySelector("#u-cpf").value.trim();
    const email = document.querySelector("#u-email").value.trim();
    const telefone = document.querySelector("#u-telefone").value.trim();
    const dataNasc = document.querySelector("#u-nasc").value;
    const senha = document.querySelector("#u-senha").value;

    if (!nome || !cpf || !email || !dataNasc || !senha) {
        showToast("Por favor, preencha todos os campos obrigatórios!!", "error");
        return;
    }

    const usuarioComum = {
        id: crypto.randomUUID(),
        nome: nome,
        cpf: cpf,
        email: email,
        telefone: telefone,
        datanasc: dataNasc,
        senha: senha
    };

    usuariosComuns.push(usuarioComum);
    saveToLocalStorage(STORAGE_KEY_USUARIOCOMUM, usuariosComuns);

    formUsuario.reset();
    showToast("Usuário cadastrado com sucesso!!", "success");
}

function cadastrarMedico() {
    const nome = document.querySelector("#m-nome").value.trim();
    const crm = document.querySelector("#m-crm").value.trim();
    const especialidade = document.querySelector("#m-esp").value.trim();
    const cpf = document.querySelector("#m-cpf").value.trim();
    const dataNasc = document.querySelector("#m-nasc").value;
    const telefone = document.querySelector("#m-telefone").value.trim(); 
    const email = document.querySelector("#m-email").value.trim();
    const senha = document.querySelector("#m-senha").value;

    if (!nome || !crm || !especialidade || !cpf || !dataNasc || !email || !senha) {
        showToast("Por favor, preencha todos os campos obrigatórios!!", "error");
        return;
    }

    const medico = {
        id: crypto.randomUUID(),
        nome: nome,
        crm: crm,
        especialidade: especialidade,
        cpf: cpf,
        datanasc: dataNasc,
        telefone: telefone,
        email: email,
        senha: senha
    };

    medicos.push(medico);
    saveToLocalStorage(STORAGE_KEY_MEDICO, medicos);

    formMedico.reset();
    showToast("Médico cadastrado com sucesso!!", "success");
}

// Liga cada formulário à sua função.
// preventDefault() impede o navegador de recarregar a página ao enviar.
formUsuario.addEventListener("submit", function (event) {
    event.preventDefault();
    cadastrarUsuarioComum();
});

formMedico.addEventListener("submit", function (event) {
    event.preventDefault();
    cadastrarMedico();
});