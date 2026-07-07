Você marcou praticamente tudo. Isso é 5+ rodadas de trabalho pesado (novas tabelas, edge functions, integrações externas, componentes grandes). Para não quebrar o site, vou executar em fases — uma por mensagem — e você me diz "próxima" quando quiser avançar.

## Fase 1 — Notificações + Chat premium
- Tabela `notifications` (tipo, título, link, lida) + trigger que cria notificação em: reserva confirmada, reserva cancelada, nova mensagem, novo anúncio publicado
- Sino no Header com badge de não lidas, dropdown com últimas 10, realtime
- Chat: upload de imagem (bucket `chat-images` já existe), picker de emojis, hora ao lado de cada mensagem, indicador "digitando…" via Realtime Presence, ✓✓ de leitura usando os campos `read_by_guest/read_by_host` que já existem

## Fase 2 — Página do imóvel premium
- **Galeria**: imagem principal grande + grid de miniaturas, lightbox, navegação por teclado
- **Calendário de disponibilidade**: mês a mês, dias ocupados (buscando `reservations`), dias disponíveis, preço por diária no tooltip
- **Mapa**: preciso do conector Google Maps ligado. Vou pedir no início desta fase; se recusar, uso OpenStreetMap/Leaflet como fallback (grátis, sem chave)

## Fase 3 — Avaliações + Perfil do Anunciante + Super Host
- Migração: adicionar colunas `cleanliness/service/location/comfort/value` em `reviews`, `rating` vira média calculada
- Formulário de review multi-critério na página de detalhes (só para quem já teve reserva concluída)
- Página `/host/:id` reformulada com: foto, bio, nº de imóveis, nota média, nº de reservas, tempo médio de resposta (calculado dos `messages`), selo Super Host
- Regra Super Host automática: ≥5 reviews E média ≥4.8 E ≥10 reservas concluídas (função SQL `is_super_host(user_id)`)

## Fase 4 — Assistente IA + Cupons + Próximos
- Edge function `ai-assistant` usando Lovable AI (Gemini 2.5 Flash) com tool calling: recebe pedido em linguagem natural, consulta `listings` filtrando por cidade/preço/hóspedes/amenidades, retorna sugestões com link
- Widget de chat flutuante no canto inferior direito
- Tabela `coupons` (code, discount_percent, valid_from/until, max_uses, used_count) + validação no checkout
- Seção "Perto de você" na home: `navigator.geolocation` → filtra listings por distância aproximada (haversine em SQL)

## Fase 5 — Painéis + Contato + Polimento visual
- **Painel do anunciante** (`/painel`): cards com reservas, receita (bruto − 20%), avaliações recebidas, visualizações (nova coluna `view_count` em listings), taxa de ocupação, gráfico mensal com recharts
- **Admin**: aprovação/rejeição de anúncios (campo `status: pending/approved/rejected`), dashboard com gráficos, busca global, exportação PDF (jsPDF) + Excel (já existe xlsx) + CSV
- Tabela `contact_messages` + painel admin com status pendente/respondida/arquivada, form do Contato passa a salvar no BD além do mailto
- Polimento global: Skeleton em todas as listagens, autocomplete de cidades na barra de busca, microanimações padronizadas

## Fora de escopo por enquanto
- **Imóveis em Destaque** (home) e **badge Super Host visual**: entram junto da Fase 3 sem custo extra
- Tradução automática de reviews e notificações: já temos edge function `translate-text`, reutilizo quando fizer sentido

## Como quero prosseguir
Confirma essa ordem e eu começo pela **Fase 1 (Notificações + Chat)** agora. Se quiser trocar a ordem ou remover alguma fase, me diz antes.