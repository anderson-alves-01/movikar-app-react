import { Shield, Clock, DollarSign } from "lucide-react";

export default function HeroSection() {

  return (
    <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-sm" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Alugue o carro perfeito<br />
            <span className="text-primary">na sua cidade</span>
          </h1>
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-6 mb-12 max-w-4xl mx-auto">
            <p className="text-xl md:text-2xl text-white font-semibold leading-relaxed">
              <span className="text-secondary font-bold">Conectamos pessoas que precisam de um carro</span> com <span className="text-secondary font-bold">donos que querem compartilhar</span>. 
              <br className="hidden md:block" />
              <span className="text-warning font-bold">Seguro, fácil e econômico.</span>
            </p>
          </div>

          {/* Hero Call-to-Action */}
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Use a busca no topo da página para encontrar carros disponíveis
            </h2>
            <p className="text-lg text-gray-300">
              Digite sua localização e selecione as datas para ver todos os veículos disponíveis perto de você
            </p>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 feature-cards">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-300">Seguro completo e verificação de documentos para sua tranquilidade</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Disponível 24/7</h3>
              <p className="text-gray-300">Alugue quando precisar, onde precisar, na hora que precisar</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Preços Justos</h3>
              <p className="text-gray-300">Economia real comparado às locadoras tradicionais</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
