# Persistência, crescimento e recuperação

O Vigia Congresso persiste os registros em `dist/data/AAAA-MM.json`, versionados no GitHub. Os coletores juntam registros por identificador oficial e preservam meses antigos; o navegador é apenas o leitor. A coleta continua diária, com solicitação às 13h50 de Brasília, com revisão da janela recente.

## Medição inicial — 12/11/2026

- Pasta pública de origem: 911.416 bytes, aproximadamente 0,91 MB.
- JSONs públicos: 874.683 bytes; na versão publicada compactada, 679.678 bytes (redução de cerca de 22%).
- Respostas brutas: 7.126.820 bytes em 812 arquivos, fora da pasta publicada.
- Maior arquivo mensal: 578.175 bytes.

Esses valores são uma fotografia, não uma projeção de crescimento. Cada execução gera uma nova medição no resumo do workflow. O tamanho de um clone raso também não representa todo o histórico Git.

## Proteções implementadas

1. **Persistência versionada:** os JSONs mensais permanecem no repositório e podem ser recuperados pelo histórico de commits. A gravação só é publicada depois da validação. Não há exclusão automática dos registros normalizados antigos.
2. **Backup antes de coletar:** o workflow salva `dist/data` em um arquivo `.tar.gz`, disponível nos artefatos da execução por 14 dias. Esse backup é uma facilidade de recuperação; não substitui o histórico Git nem é um arquivo permanente.
3. **Respostas brutas comprimidas:** novos snapshots usam `.json.gz` e continuam identificados pelo hash do conteúdo. Respostas já existentes, inclusive as antigas em JSON, não recebem uma cópia duplicada. Os arquivos antigos não são apagados nem o histórico Git é reescrito.
4. **Publicação separada:** somente o conteúdo de `dist` é copiado para `_site`. Os JSONs dessa cópia são compactados removendo espaços, sem retirar campos ou registros. `raw`, scripts e backups não são enviados ao Pages.
5. **Monitoramento:** o workflow alerta quando um mês passa de 5 MiB, quando os snapshots brutos passam de 100 MiB ou quando a origem pública passa de 100 MiB. Esses valores são alertas preventivos do projeto, não os limites oficiais do serviço.

## Recuperar dados

Na aba Actions, abra uma execução anterior válida e baixe o artefato `dados-antes-da-coleta-<id>`. Extraia o arquivo em uma pasta separada, confira os JSONs e recoloque os arquivos de `data` em `dist/data` por um novo commit, depois de executar `node scripts/validate.mjs`. Corrija a causa da falha antes de retomar uma coleta que esteja corrompendo dados. Também é possível recuperar a versão correspondente a um commit anterior do repositório.

## Quando crescer mais

Não há necessidade imediata de banco de dados pelo volume medido. A compressão reduz o crescimento, mas não o elimina. Quando os alertas aparecerem, a próxima medida recomendada é manter os dados normalizados mensais no site e migrar os snapshots brutos para armazenamento de objetos com política de retenção e backup. Isso exige escolher e configurar um provedor; não foi criada uma conta ou serviço pago nesta alteração.

Se um mês superar 5 MiB, particionar esse mês por dia ou semana evita que cada visitante baixe um arquivo grande. O formato precisa ser atualizado junto com o leitor e os coletores; o alerta não faz esse particionamento automaticamente.

O GitHub recomenda repositórios de origem do Pages abaixo de 1 GB e limita o conteúdo publicado a 1 GB. Referência: [limites oficiais do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Horário

O cron `50 16 * * *` usa UTC, correspondendo a 13h50 em Brasília (UTC-3). A referência pública de atualização fica por volta das 14h. É o início previsto da coleta, não uma garantia de que a publicação estará concluída exatamente às 14h. O agendador pode atrasar, e consultas manuais podem ocorrer em outros horários. Alterações de código por push apenas publicam a interface, sem antecipar a coleta diária. Referência: [agendamento do GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
