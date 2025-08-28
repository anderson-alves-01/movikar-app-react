import bannerImage from "@assets/ALUGAE - BANNER SITE_1755986952224.jpg";
import icone1 from "@assets/ALUGAE - ICONE 1_1756046864997.png";
import icone2 from "@assets/ALUGAE - ICONE 2_1756046864999.png";
import icone3 from "@assets/ALUGAE - ICONE 3_1756046864999.png";

export default function HeroSection() {
  return (
    <section className="relative bg-white py-16 sm:py-20 lg:py-24">
      {/* Background muito sutil */}
      <div className="absolute inset-0 bg-primary-light opacity-30"></div>
      
      {/* Elementos visuais minímos */}
      <div className="absolute top-16 right-20 w-6 h-6 bg-secondary-pastel rounded-full opacity-40"></div>
      <div className="absolute bottom-16 left-20 w-4 h-4 bg-primary-pastel rounded-full opacity-30"></div>

      <div className="relative max-w-7xl mx-auto mobile-padding">
        <div className="text-center">
          {/* Badge corporativo */}
          <div className="mb-10">
            <span className="inline-flex items-center bg-primary-light text-primary font-medium px-4 py-2 rounded-md text-sm border border-primary/10">
              Solução em mobilidade urbana
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 leading-tight text-gray-900">
            Aluguel de veículos
            <br />
            <span className="text-primary">simples e seguro</span>
          </h1>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 sm:p-8 mb-12 max-w-3xl mx-auto border border-gray-100 shadow-sm">
            <p className="text-lg sm:text-xl text-gray-700 font-normal leading-relaxed mb-3">
              Conectamos você a proprietários de veículos verificados em sua região, 
              oferecendo uma experiência de aluguel transparente e confiável.
            </p>
            <p className="text-base text-gray-600">
              Processo digital completo • Segurança garantida • Preços competitivos
            </p>
          </div>

          {/* Value Propositions corporativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-14">
            <div className="text-center p-4">
              <div className="w-14 h-14 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-4 border border-primary/10">
                <img src={icone1} alt="Processo Digital" className="h-8 w-8 object-contain opacity-80" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-800">
                Processo Digital
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Plataforma intuitiva para
                <br />gestão completa do aluguel
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 bg-secondary-light rounded-lg flex items-center justify-center mx-auto mb-4 border border-secondary/10">
                <img src={icone2} alt="Agilidade" className="h-8 w-8 object-contain opacity-80" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-800">
                Eficiência Operacional
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Reservas rápidas com
                <br />confirmação instantânea
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-14 h-14 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-4 border border-primary/10">
                <img src={icone3} alt="Transparência" className="h-8 w-8 object-contain opacity-80" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-800">
                Transparência
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Preços claros sem
                <br />taxas ocultas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
