import bannerImage from "@assets/ALUGAE - BANNER SITE_1755986952224.jpg";
import icone1 from "@assets/ALUGAE - ICONE 1_1756046864997.png";
import icone2 from "@assets/ALUGAE - ICONE 2_1756046864999.png";
import icone3 from "@assets/ALUGAE - ICONE 3_1756046864999.png";

export default function HeroSection() {
  return (
    <section className="relative bg-primary text-white py-20 sm:py-24 lg:py-28">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${bannerImage}')`,
        }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-65"></div>
      
      {/* Elementos visuais sutis */}
      <div className="absolute top-20 left-10 w-12 h-12 bg-secondary rounded-full opacity-10"></div>
      <div className="absolute bottom-20 right-10 w-8 h-8 bg-white rounded-full opacity-15"></div>

      <div className="relative max-w-7xl mx-auto mobile-padding">
        <div className="text-center">
          {/* Badge profissional */}
          <div className="mb-8">
            <span className="inline-flex items-center bg-white/10 backdrop-blur-sm text-white font-semibold px-5 py-2 rounded-full text-sm border border-white/20">
              Plataforma de aluguel de carros
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
            Alugue o <span className="text-secondary">carro perfeito</span>
            <br />
            na sua cidade
          </h1>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-12 max-w-4xl mx-auto border border-white/10">
            <p className="text-lg sm:text-xl md:text-2xl text-white font-medium leading-relaxed mb-4">
              Encontre carros de{" "}
              <span className="font-semibold text-secondary">pessoas reais</span>{" "}
              na sua cidade - sem burocracia
            </p>
            <p className="text-base sm:text-lg text-white/90">
              Seguro, confiável e com os melhores preços
            </p>
          </div>

          {/* Value Propositions profissionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-16 feature-cards">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <img src={icone1} alt="Sem Burocracia" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white">
                Sem Burocracia
              </h3>
              <p className="text-white/80 text-sm sm:text-base">
                Todo o processo pelo app.
                <br />Simples e direto.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <img src={icone2} alt="Fácil e Rápido" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white">
                Fácil e Rápido
              </h3>
              <p className="text-white/80 text-sm sm:text-base">
                Reserve em poucos cliques.
                <br />Processo otimizado.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <img src={icone3} alt="Preços Justos" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white">
                Preços Transparentes
              </h3>
              <p className="text-white/80 text-sm sm:text-base">
                Valor fixo, sem surpresas.
                <br />Transparência total.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
