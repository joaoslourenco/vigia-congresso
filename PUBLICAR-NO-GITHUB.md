# Publicar o Vigia Congresso no GitHub

Este pacote funciona sozinho no GitHub, sem depender do Codex, de uma conversa aberta, de computador ligado, de servidor próprio ou de banco de dados. A hospedagem usa GitHub Pages; a atualização usa GitHub Actions.

## Ativação

1. Crie um repositório no GitHub com a branch principal chamada `main`.
2. Extraia o ZIP e envie **o conteúdo inteiro** para a raiz do repositório. Devem existir `.github/workflows/collect.yml`, `scripts/`, `content/` e `dist/`. Não envie apenas a pasta `dist`, pois isso deixa o site sem coletor.
3. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
4. Em **Settings → Actions → General → Workflow permissions**, permita **Read and write permissions**, se a organização permitir. Isso autoriza o bot a gravar os JSONs. As permissões `pages: write` e `id-token: write` já estão declaradas no arquivo.
5. Na aba **Actions**, abra **Atualizar dados e publicar site** e clique em **Run workflow**. Autorize a execução de Actions se o GitHub pedir ao importar/forkar o projeto. Se houver proteção de ambiente/branch, ela também precisa permitir o bot e a publicação.
6. Ao final, abra a URL mostrada na etapa **Publicar GitHub Pages** ou em **Settings → Pages**.

Não é necessário cadastrar token pessoal, chave de API ou credencial de pagamento. O `GITHUB_TOKEN` temporário é fornecido pelo GitHub. O coletor consulta APIs públicas; o resumo automático não usa serviço externo pago.

## O arquivo que atualiza tudo

`.github/workflows/collect.yml` roda diariamente às **14h de Brasília** (17h UTC), manualmente em **Run workflow**. Enviar código para `main` apenas valida e publica a interface; não antecipa a coleta diária. O agendador do GitHub pode iniciar com atraso; ele não garante execução no segundo exato. Em repositórios públicos sem atividade por período prolongado, o GitHub pode desativar agendamentos: confira a aba Actions se as atualizações pararem.

O fluxo calcula uma janela de 14 dias, consulta as fontes, prepara resumos, valida os arquivos, grava um commit somente se houver alterações e publica a pasta `dist` no mesmo workflow. Não depende de um segundo workflow disparado pelo commit do bot. A publicação pode rodar mesmo sem um novo commit de dados.

Se uma fonte falhar, os registros antigos são preservados. Dados inválidos interrompem a publicação. Dados válidos com coleta parcial podem ser publicados, e o workflow sinaliza a falha da fonte; isso não significa que todas as etapas de coleta tiveram sucesso.

## O que a coleta já faz

- **Senado:** busca PLPs e PECs do ano configurado e normaliza seus informes legislativos nos arquivos mensais. A cobertura é parcial e continua identificada no site. O ano corrente é passado pelo workflow; propostas de anos anteriores e votos nominais ainda não têm cobertura completa.
- **Câmara:** a rotina importa PLPs e PECs apresentadas ou movimentadas na janela consultada, inclusive propostas antigas com movimentação recente. Autores, histórico de partido/UF e retratos oficiais alimentam o calendário e o ranking. Proponentes e demais signatários são contados separadamente pelo campo oficial `proponente`. A cobertura ainda é parcial, principalmente para resultados e votos nominais.
- O histórico existente é mantido, e os identificadores oficiais evitam duplicar informes.

Não confunda executar o workflow com ter uma base legislativa completa. Veja `dist/data/index.json` e os logs da coleta para conhecer a cobertura.

## Resumos para o público

Os 19 resumos iniciais estão em `content/summaries.json`, vinculados ao conteúdo da ementa por SHA-256. A descrição do cartão mostra somente o resumo da proposta. Os detalhes de tramitação ficam na expansão.

Novas propostas sem resumo editorial usam `scripts/summarize.mjs`, que simplifica a ementa e explica termos por regras locais. Não há chamada de IA durante a atualização diária nem necessidade de chave. Esse tratamento não substitui uma revisão editorial: ementas vagas continuam limitadas ao que foi efetivamente informado.

Se a ementa oficial mudar, um resumo editorial antigo não é reutilizado automaticamente. É necessário atualizar seu texto e `sourceHash` após conferência; enquanto isso, o sistema usa a simplificação da ementa atual. Os resumos iniciais elaborados com auxílio de IA ficam identificados na interface.

## Testar no computador

Com Node.js 22 ou superior:

```sh
node --test scripts/senado.test.mjs scripts/summaries.test.mjs
node scripts/collect.mjs
node scripts/summarize.mjs
node scripts/validate.mjs
```

Sirva `dist` com qualquer servidor HTTP estático. Os caminhos são relativos, inclusive para a hospedagem em `usuario.github.io/nome-do-repositorio/`.

## Outras hospedagens

A pasta pública é `dist`. Para uma hospedagem que publica automaticamente a cada commit, mantenha a coleta e o commit e adapte as etapas finais de GitHub Pages à plataforma escolhida. Um arquivo JavaScript no navegador não substitui o agendador: a atualização diária deve rodar no GitHub Actions ou em outro serviço de execução agendada.

Referências: [workflow oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) e [eventos agendados do GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).


Persistência, compressão, backups e recuperação: [PERSISTENCIA.md](PERSISTENCIA.md). A versão pública é gerada em `_site`, a partir de `dist`, com os mesmos dados.
