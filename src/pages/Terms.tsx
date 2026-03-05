import { Separator } from "@/components/ui/separator";

const Terms = () => (
  <div className="container-page py-12">
    <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Termos de Uso</h1>
    <p className="mb-8 text-sm text-muted-foreground">Última atualização: 1 de março de 2026</p>

    <div className="prose max-w-none space-y-6 text-muted-foreground">
      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>Ao acessar e utilizar a plataforma ReservaFácil, você concorda com estes Termos de Uso. Se não concordar com algum dos termos, não utilize nossos serviços.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
        <p>A ReservaFácil é uma plataforma que conecta hóspedes a proprietários de hospedagens, permitindo a busca, reserva e avaliação de quartos de hotéis e pousadas em todo o Brasil.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">3. Cadastro e Conta</h2>
        <p>Para utilizar determinadas funcionalidades, é necessário criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Forneça informações verdadeiras e atualizadas.</li>
          <li>Não compartilhe suas credenciais com terceiros.</li>
          <li>Notifique-nos imediatamente sobre uso não autorizado.</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">4. Reservas e Pagamentos</h2>
        <p>As reservas são sujeitas à disponibilidade e confirmação do proprietário. A plataforma cobra uma taxa de serviço de 10% sobre o valor da estadia. Os pagamentos são processados de forma segura e retidos até 24 horas após o check-in do hóspede.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">5. Política de Cancelamento</h2>
        <p>As políticas de cancelamento variam conforme definido por cada proprietário:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li><strong>Flexível:</strong> reembolso total até 24h antes do check-in.</li>
          <li><strong>Moderado:</strong> reembolso de 50% até 5 dias antes do check-in.</li>
          <li><strong>Rígido:</strong> sem reembolso após a confirmação.</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">6. Avaliações</h2>
        <p>Hóspedes podem avaliar hospedagens após a estadia. As avaliações devem ser honestas, respeitosas e baseadas em experiências reais. A plataforma se reserva o direito de remover avaliações que violem estas diretrizes.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">7. Responsabilidades do Proprietário</h2>
        <p>Proprietários devem fornecer informações precisas sobre suas propriedades, manter a disponibilidade atualizada e garantir condições adequadas de hospedagem conforme anunciado.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
        <p>A ReservaFácil atua como intermediária e não se responsabiliza por danos diretos ou indiretos decorrentes do uso da plataforma ou da estadia nas propriedades anunciadas.</p>
      </section>

      <Separator />

      <section>
        <h2 className="font-heading text-xl font-semibold text-foreground">9. Contato</h2>
        <p>Para dúvidas sobre estes termos, entre em contato pelo email <span className="text-primary">contato@reservafacil.com.br</span> ou pela nossa página de contato.</p>
      </section>
    </div>
  </div>
);

export default Terms;
