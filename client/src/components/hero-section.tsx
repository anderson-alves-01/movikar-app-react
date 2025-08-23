import { Shield, Clock, DollarSign } from "lucide-react";
import bannerImage from "@assets/ALUGAE - BANNER SITE_1755986952224.jpg";

export default function HeroSection() {

  return (
    <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 sm:py-16 lg:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-sm" 
        style={{
          backgroundImage: `url('${bannerImage}')`
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto mobile-padding">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Alugue o carro perfeito<br />
            <span className="text-primary">na sua cidade</span>
          </h1>
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-8 sm:mb-12 max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl md:text-2xl text-white font-semibold leading-relaxed">
              <span className="text-secondary font-bold">Conectamos pessoas que precisam de um carro</span> com <span className="text-secondary font-bold">donos que querem compartilhar</span>. 
              <br className="hidden md:block" />
              <span className="text-warning font-bold">Seguro, fácil e econômico.</span>
            </p>
          </div>



          {/* Value Propositions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 feature-cards">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-300 text-sm sm:text-base">Seguro completo e verificação de documentos para sua tranquilidade</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Disponível 24/7</h3>
              <p className="text-gray-300 text-sm sm:text-base">Alugue quando precisar, onde precisar, na hora que precisar</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Preços Justos</h3>
              <p className="text-gray-300 text-sm sm:text-base">Economia real comparado às locadoras tradicionais</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
