# OpenFlow

Construtor visual open-source de apps Flutter (nome provisório).

O app é um **documento JSON** (`src/core/schema.ts`). O editor escreve nele, o preview renderiza e o codegen (`src/core/codegen.ts`) gera `lib/main.dart`.

```bash
npm install
npm run dev     # editor
npm test        # testes (usa `dart format` para validar a sintaxe se o Dart estiver instalado)
```

## Status v0
- Widgets: Column, Row, Container, Text, Button
- Uma página, edição de props, exportar main.dart (copiar)

## Próximos passos
Várias páginas e navegação, arrastar e soltar, exportar projeto Flutter em .zip, variáveis de estado, Supabase.

## Rodar no emulador

Com `npm run dev`, o botão **▶ Rodar no emulador** grava o projeto Flutter em `~/OpenFlowBuilds/<nome>` e abre o terminal do sistema (Terminal no macOS, cmd no Windows). O terminal cria o projeto, liga o primeiro emulador Android, gera o APK de debug e roda o app ao vivo (`r` = hot reload).
Se faltar Flutter, Android SDK ou emulador, o editor mostra um passo a passo de instalação para o seu sistema.

## Editor

- **Arrasta e solta:** da paleta para a tela ou para a árvore; reordene e troque de pai arrastando na tela ou na árvore. Verde = pode soltar, vermelho = regra violada (com o motivo).
- **Árvore de widgets** (ícone ☰ na barra lateral).
- **Regras do Flutter:** Row/Column/Stack/ListView aceitam vários filhos; Container/Card/Center/Expanded aceitam um; Text/Button/Image/Spacer/Divider são folhas; Expanded e Spacer só dentro de Row/Column; Divider só em Column/ListView.
- **Widgets:** Column, Row, Stack, ListView, Container, Card, Center, Expanded, Text, Button, Image, Spacer, Divider.
- **Propriedades** por grupo (Conteúdo, Layout, Estilo) com seletor de cor e listas; propriedades da página (título e cor da AppBar, fundo).
- **Desfazer/refazer** (⌘Z / ⇧⌘Z) e Delete para remover.

## Testes

`npm test` roda os testes unitários e, se o Flutter estiver instalado, um `flutter analyze` real sobre o código gerado com todos os widgets.
