import { db } from '../db';
import { vehicles } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { priceScraperService } from './price-scraper';

export class AutoPricingBatchService {
  async updateVehiclePrices(): Promise<void> {
    try {
      console.log('🤖 Iniciando processo batch de atualização de preços...');
      const startTime = Date.now();

      // Buscar todos os veículos com auto pricing habilitado
      const vehiclesToUpdate = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.autoPricingEnabled, true));

      if (vehiclesToUpdate.length === 0) {
        console.log('ℹ️ Nenhum veículo com auto pricing habilitado');
        return;
      }

      console.log(`📋 ${vehiclesToUpdate.length} veículos para atualizar`);

      // Agrupar veículos por localização para otimizar scraping
      const vehiclesByLocation = this.groupByLocation(vehiclesToUpdate);
      
      let updatedCount = 0;
      let errorCount = 0;

      // Processar localizações em paralelo para otimizar performance
      const locationPromises = Object.entries(vehiclesByLocation).map(async ([location, locationVehicles]) => {
        const results = { updated: 0, errors: 0 };
        
        try {
          // Buscar preços do mercado para esta localização
          const marketPrices = await priceScraperService.getLocalizaPrices(location);
          
          for (const vehicle of locationVehicles) {
            try {
              // Mapear categoria do veículo para categoria do mercado
              const marketCategory = priceScraperService.getCategoryMapping(vehicle.category);
              const marketPrice = marketPrices.find(p => p.category === marketCategory);

              if (!marketPrice) {
                console.warn(`⚠️ Preço de mercado não encontrado para categoria: ${vehicle.category}`);
                continue;
              }

              // Validar e limitar percentual de competição entre -50% e +50%
              let competitionPercentage = parseFloat(vehicle.competitionPercentage || '0');
              if (isNaN(competitionPercentage)) {
                console.warn(`⚠️ Percentual de competição inválido para veículo ${vehicle.id}, usando 0%`);
                competitionPercentage = 0;
              }
              competitionPercentage = Math.max(-50, Math.min(50, competitionPercentage));
              
              const newPrice = priceScraperService.calculateCompetitivePrice(
                marketPrice.pricePerDay,
                competitionPercentage
              );

              // Atualizar apenas se o preço mudou
              const currentPrice = parseFloat(vehicle.pricePerDay);
              if (Math.abs(currentPrice - newPrice) > 0.01) {
                await db
                  .update(vehicles)
                  .set({ pricePerDay: newPrice.toString() })
                  .where(eq(vehicles.id, vehicle.id));

                console.log(
                  `✅ Veículo ${vehicle.id} (${vehicle.brand} ${vehicle.model}): ` +
                  `R$ ${currentPrice.toFixed(2)} → R$ ${newPrice.toFixed(2)} ` +
                  `(Mercado: R$ ${marketPrice.pricePerDay}, Ajuste: ${competitionPercentage}%)`
                );
                results.updated++;
              } else {
                console.log(`ℹ️ Veículo ${vehicle.id}: preço sem alteração`);
              }

            } catch (error) {
              console.error(`❌ Erro ao atualizar veículo ${vehicle.id}:`, error);
              results.errors++;
            }
          }
        } catch (error) {
          console.error(`❌ Erro ao processar localização ${location}:`, error);
          results.errors++;
        }
        
        return results;
      });
      
      // Aguardar processamento de todas as localizações
      const allResults = await Promise.all(locationPromises);
      
      // Somar totais
      allResults.forEach(result => {
        updatedCount += result.updated;
        errorCount += result.errors;
      });

      const duration = Date.now() - startTime;
      console.log(
        `✅ Processo batch concluído em ${duration}ms: ` +
        `${updatedCount} atualizados, ${errorCount} erros`
      );

    } catch (error) {
      console.error('❌ Erro no processo batch de atualização de preços:', error);
      throw error;
    }
  }

  private groupByLocation(vehicles: any[]): Record<string, any[]> {
    return vehicles.reduce((acc, vehicle) => {
      const location = vehicle.location || 'São Paulo';
      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(vehicle);
      return acc;
    }, {} as Record<string, any[]>);
  }
}

export const autoPricingBatchService = new AutoPricingBatchService();
