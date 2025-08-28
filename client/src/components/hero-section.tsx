import bannerImage from "@assets/ALUGAE - BANNER SITE_1755986952224.jpg";
import icone1 from "@assets/ALUGAE - ICONE 1_1756046864997.png";
import icone2 from "@assets/ALUGAE - ICONE 2_1756046864999.png";
import icone3 from "@assets/ALUGAE - ICONE 3_1756046864999.png";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-brand text-white py-12 sm:py-16 lg:py-20">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${bannerImage}')`,
        }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      <div className="relative max-w-7xl mx-auto mobile-padding">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Alugue o <span className="text-secondary">carro perfeito</span>
            <br />
            na sua cidade
          </h1>
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-8 sm:mb-12 max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl md:text-2xl text-white font-semibold leading-relaxed mb-4">
              Encontre carros de{" "}
              <span className="font-bold">pessoas reais</span> na sua cidade -
              sem burocracia.
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-white font-bold">
              Seguro, confiável e sem complicações.
            </p>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 feature-cards">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <img src={icone1} alt="Sem Burocracia" className="h-10 w-10 sm:h-14 sm:w-14 object-contain" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">
                Sem Burocracia
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Todo o processo pelo app. Simples e direto.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <img src={icone2} alt="Fácil e Rápido" className="h-10 w-10 sm:h-14 sm:w-14 object-contain" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">
                Fácil e Rápido
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Contate o proprietário e reserve em poucos cliques.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <img src={icone3} alt="Preços Justos" className="h-10 w-10 sm:h-14 sm:w-14 object-contain" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">
                Preços Justos
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                Valor fixo, com transparência e sem surpresas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
