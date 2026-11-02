# Ginecon

O Ginecon é um site que ajuda pessoas que estão iniciando o período menstrual. De forma simples e sem tabus, funciona como um fórum de perguntas e respostas sobre as mudanças e os sintomas que acontecem no corpo, trazendo dicas de higiene, orientações para lidar com cólicas e TPM e respostas às dúvidas mais comuns sobre a menstruação.

Projeto desenvolvido pelo grupo **Cookies de Terceiro** (turma INF2AM) para o Hackathon do IF4Health.

## Funcionalidades

- **Fórum de perguntas e respostas** sobre menstruação, sintomas e cuidados.
- **Usuário comum:** pode fazer e responder perguntas.
- **Usuário médico:** pode responder, destacar e denunciar perguntas e comentários.
- **Modo observador:** voltado para menores de idade, permite visualizar perguntas e respostas, mas não criá-las.

## Tipos de usuário e verificação

Os usuários são divididos em dois perfis: **comum** e **médico**. A ideia inicial é que o cadastro seja verificado por **CPF** (usuário comum) ou **CRM** (médico).

> **Observação:** nesta versão, a verificação de CPF e CRM ainda não está implementada. Não há integração com nenhuma API de validação. Essa funcionalidade está prevista para versões futuras.

## Tecnologias utilizadas

O projeto foi desenvolvido apenas com tecnologias front-end:

- HTML
- CSS
- JavaScript

## Limitações atuais

- Não há back-end nem banco de dados. Os dados são armazenados no localStorage do navegador.
- A verificação de CPF e CRM não é feita.

## Próximos passos

- Integrar uma API para validar CPF e CRM.
- Criar um back-end e um banco de dados para armazenar usuários, perguntas e respostas.
- Criar o perfil de moderador para supervisionar a atuação dos médicos.

## Integrantes

- Lara Oliveira Menezes
- Manuela Gonçalves Cairuga
- Marina da Silva Pereira
- Ricardo Araújo Ortiz Filho
- Sophia Pradella Pereira
