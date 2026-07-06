# GV Run · App do Programa 8 Semanas (MVP)

App PWA do Programa GV Run. Stack: HTML/CSS/JS puro + localStorage. Sem build, sem dependências.

## Como colocar no ar (5 min, mesmo fluxo do TeamNoi)
1. Crie um repositório no GitHub e suba estes 5 arquivos:
   - index.html · manifest.json · sw.js · icon-192.png · icon-512.png
2. Na Vercel: Add New Project → importe o repositório → Deploy (sem configuração).
3. Pronto. O aluno abre o link, e no iPhone/Android pode "Adicionar à Tela de Início" — vira app.

## Como adicionar seus vídeos
No `index.html`, no topo do `<script>`, está o objeto `VIDEOS`.
Cole o link do YouTube (não listado) de cada exercício:
```js
const VIDEOS = {
  pant: "https://youtu.be/SEU_VIDEO",
  heel: "https://youtu.be/SEU_VIDEO",
  ...
};
```
O botão "▶ ver vídeo" aparece automaticamente em cada exercício que tiver link.

## O que o MVP faz
- Onboarding com avaliação da Semana 0 (4 testes) → define nível automaticamente
- Tela Hoje: semana/fase atual, barra de progresso, status da semana (A/B/mobilidade)
- Sessões A, B e Mobilidade com checklist por exercício, dose e ajuste por nível
- Semáforo da dor com registro diário + protocolo pós-dor automático no amarelo/vermelho
- Alerta na tela inicial quando o aluno registra dor amarela/vermelha no dia
- Perfil com progresso (16 sessões de força) e lembrete de reavaliação na semana 8

## Limitações do MVP (por design)
- Dados ficam no aparelho do aluno (localStorage). Trocou de celular = recomeça.
- Sem login e sem painel para vocês verem o progresso dos alunos.

## Próxima versão (quando a turma 1 validar)
Trocar localStorage por Supabase (auth por e-mail + tabelas sessions/pain_log)
→ login multi-dispositivo + painel admin para vocês acompanharem a turma.
A estrutura do código já está pronta para essa troca: tudo passa pelas funções load()/save().
