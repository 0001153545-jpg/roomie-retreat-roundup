import { Separator } from "@/components/ui/separator";

const Privacy = () => (
  <div className="container-page py-12">
    <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Política de Privacidade</h1>
    <p className="mb-8 text-sm text-muted-foreground">Última atualização: 1 de março de 2026</p>

    <div className="prose max-w-none space-y-6 text-muted-foreground">
      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">1. Informações Coletadas</h2>
        <p>Coletamos informações que você nos fornece diretamente ao criar uma conta, fazer reservas ou interagir com a plataforma:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Nome completo e email</li>
          <li>Número de telefone</li>
          <li>Dados de pagamento (processados de forma segura por terceiros)</li>
          <li>Histórico de reservas e avaliações</li>
          <li>Dados de navegação e uso da plataforma</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">2. Uso das Informações</h2>
        <p>Utilizamos suas informações para:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Processar reservas e pagamentos</li>
          <li>Personalizar sua experiência na plataforma</li>
          <li>Enviar notificações sobre suas reservas</li>
          <li>Melhorar nossos serviços e funcionalidades</li>
          <li>Garantir a segurança da plataforma</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">3. Compartilhamento de Dados</h2>
        <p>Compartilhamos suas informações apenas quando necessário para processar reservas (com proprietários), processar pagamentos (com processadores de pagamento) ou quando exigido por lei.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">4. Segurança</h2>
        <p>Implementamos medidas técnicas e organizacionais para proteger suas informações pessoais, incluindo criptografia de dados, autenticação segura e monitoramento contínuo.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">5. Cookies</h2>
        <p>Utilizamos cookies para melhorar sua experiência de navegação, lembrar suas preferências e analisar o tráfego do site. Você pode gerenciar suas preferências de cookies nas configurações do navegador.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">6. Seus Direitos (LGPD)</h2>
        <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Acessar seus dados pessoais</li>
          <li>Corrigir dados incompletos ou desatualizados</li>
          <li>Solicitar a exclusão de seus dados</li>
          <li>Revogar o consentimento a qualquer momento</li>
          <li>Solicitar a portabilidade dos dados</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">7. Contato</h2>
        <p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato pelo email <span className="text-primary">privacidade@reservafacil.com.br</span>.</p>
      </section>
    </div>
  </div>
);

export default Privacy;
