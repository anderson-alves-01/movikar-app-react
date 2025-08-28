import bannerImage from "@assets/ALUGAE - BANNER SITE_1755986952224.jpg";
import icone1 from "@assets/ALUGAE - ICONE 1_1756046864997.png";
import icone2 from "@assets/ALUGAE - ICONE 2_1756046864999.png";
import icone3 from "@assets/ALUGAE - ICONE 3_1756046864999.png";

export default function HeroSection() {
  return (
    <section className="relative bg-primary text-white py-16 sm:py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${bannerImage}')`,
        }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-70"></div>
      
      {/* Elementos visuais de impacto */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-secondary rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-1/4 right-20 w-16 h-16 bg-white rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-secondary rounded-full opacity-25 animate-ping"></div>
      <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-primary rounded-full opacity-40 animate-pulse" style={{animationDelay: '0.5s'}}></div>

      <div className="relative max-w-7xl mx-auto mobile-padding">
        <div className="text-center">
          {/* Badge de impacto */}
          <div className="mb-8 animate-bounce">
            <span className="inline-flex items-center bg-secondary text-white font-bold px-6 py-3 rounded-full text-lg shadow-2xl border-2 border-white/20">
              <span className="mr-2">🚗</span>
              A REVOLUÇÃO DO ALUGUEL DE CARROS
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 sm:mb-8 leading-tight drop-shadow-2xl">
            ALUGUE O <span className="text-secondary animate-pulse">CARRO PERFEITO</span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white/90">NA SUA CIDADE</span>
          </h1>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 mb-12 max-w-5xl mx-auto border border-white/20 shadow-2xl">
            <p className="text-xl sm:text-2xl md:text-3xl text-white font-bold leading-relaxed mb-4">
              Encontre carros de{" "}
              <span className="text-secondary font-black animate-pulse">PESSOAS REAIS</span>{" "}
              na sua cidade
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-semibold">
              ⚡ ZERO BUROCRACIA • 🛡️ 100% SEGURO • 💰 PREÇOS JUSTOS
            </p>
          </div>

          {/* Value Propositions com mais impacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-16 feature-cards">
            <div className="text-center group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/20 group-hover:scale-110 transition-all duration-300 shadow-xl">
                <img src={icone1} alt="Sem Burocracia" className="h-12 w-12 sm:h-16 sm:w-16 object-contain drop-shadow-lg" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-3 text-white drop-shadow-lg">
                ZERO BUROCRACIA
              </h3>
              <p className="text-white/90 text-base sm:text-lg font-semibold">
                Todo o processo pelo app.
                <br />
                <span className="text-secondary font-bold">Simples e direto!</span>
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/20 group-hover:scale-110 transition-all duration-300 shadow-xl">
                <img src={icone2} alt="Fácil e Rápido" className="h-12 w-12 sm:h-16 sm:w-16 object-contain drop-shadow-lg" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-3 text-white drop-shadow-lg">
                SUPER RÁPIDO
              </h3>
              <p className="text-white/90 text-base sm:text-lg font-semibold">
                Reserve em poucos cliques.
                <br />
                <span className="text-secondary font-bold">Instantâneo!</span>
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/20 group-hover:scale-110 transition-all duration-300 shadow-xl">
                <img src={icone3} alt="Preços Justos" className="h-12 w-12 sm:h-16 sm:w-16 object-contain drop-shadow-lg" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-3 text-white drop-shadow-lg">
                PREÇOS JUSTOS
              </h3>
              <p className="text-white/90 text-base sm:text-lg font-semibold">
                Transparência total.
                <br />
                <span className="text-secondary font-bold">Sem surpresas!</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
