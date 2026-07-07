# GV Run · App do Programa 8 Semanas (v2)

PWA do Programa GV Run. Stack: HTML/CSS/JS puro + localStorage. Sem build.
Sobe na Vercel igual TeamNoi: GitHub → import → Deploy.

## NOVIDADES DA v2
- 🔒 Tela de senha de acesso (libera só quem comprou)
- 📝 Avaliação com Sim/Não + valor (repetições, tempo, % de simetria)
- ▶ Botão de vídeo por exercício
- 📈 Aba Evolução: frequência por semana, histórico de dor e comparação início vs. semana 8

## ===== 3 COISAS PARA CONFIGURAR (no topo do index.html) =====

### 1) SENHA DE ACESSO
```js
const ACCESS_PASSWORD = "GVRUN2025";
```
Troque por uma senha sua. Cadastre essa mesma senha na Kiwify/Hotmart, em
"conteúdo do produto" / e-mail de confirmação, para o aluno receber ao comprar.
Deixe "" (vazio) para desativar a senha durante seus testes.

Como funciona: o aluno digita 1 vez; o app grava que está liberado naquele
aparelho e não pede mais. (Senha única para a turma — para acesso individual
por e-mail, é a versão Supabase.)

### 2) VÍDEOS
```js
const VIDEOS = { pant:"https://youtu.be/XXXX", heel:"...", ... };
```
Grave cada exercício, suba no YouTube como **Não listado**, cole o link no id
correspondente. O botão "▶ ver vídeo" aparece sozinho onde houver link.
Lista de ids: pant, heel, agach_uni, rdl, pallof, bulgaro, declinio, rdl_uni,
hop, spanish, stepdown, equi, tibial, pecurto, prancha, faixa, pogo, curl,
mob1..mob6.

### 3) TESTES DA AVALIAÇÃO (opcional)
Já vêm prontos os 4 testes. Para ajustar meta/unidade, edite o array `ASSESS`.
kind: "reps" (repetições) | "time" (segundos) | "dist" (%) | "quality" (só sim/não).

## COMO O ALUNO USA
1. Abre o link → digita a senha (1x) → onboarding com nome + avaliação
2. Aba Hoje: sessão A, B ou mobilidade, com checklist e vídeos
3. Aba Dor: registra o semáforo; amarelo/vermelho abre protocolo na hora
4. Aba Evolução: acompanha frequência, dor e comparação da avaliação
5. Na semana 8, o app libera "Refazer avaliação" para fechar o antes/depois

## LIMITAÇÃO (por design nesta versão)
Dados no aparelho do aluno (localStorage). Trocou de celular = recomeça.
Sem painel para vocês verem o progresso da turma.

## PRÓXIMA VERSÃO (quando a turma 1 validar): SUPABASE
- Login por e-mail; e-mail do comprador liberado via webhook da Kiwify
- Dados na nuvem (multi-dispositivo) + painel admin para vocês acompanharem
- Migração facilitada: todo dado já passa pelas funções load()/save()


## AVALIAÇÃO BILATERAL + ASSIMETRIA (LSI) — v2.1
Todos os testes agora medem Direita e Esquerda e o app calcula a assimetria
automaticamente pela fórmula LSI = (maior − menor) / maior × 100.
Ele mostra a simetria (%), a assimetria e QUAL lado está deficitário.
- Equilíbrio unipodal: cronômetro embutido (Iniciar/Parar) por lado
- Panturrilha unipodal: repetições D e E
- Single Leg Bridge Test: repetições D e E (novo)
- Step-down: repetições + "joelho cai? Sim/Não" por lado
- Salto unipodal: 3 saltos por lado; o app faz a média e o LSI

### VÍDEOS DOS TESTES
No topo do index.html há o objeto VIDEOS_TESTES:
```js
const VIDEOS_TESTES = { balance:"", calf:"", bridge:"", stepdown:"", hop:"" };
```
Grave cada teste, suba no YouTube como "Não listado" e cole o link.
O botão "▶ ver como fazer o teste" aparece sozinho em cada teste com link.
