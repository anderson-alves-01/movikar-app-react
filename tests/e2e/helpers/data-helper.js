
export class DataHelper {
  static generateVehicleData() {
    const brands = ['Toyota', 'Honda', 'Volkswagen', 'Ford', 'Chevrolet'];
    const models = ['Corolla', 'Civic', 'Golf', 'Focus', 'Onix'];
    
    return {
      brand: brands[Math.floor(Math.random() * brands.length)],
      model: models[Math.floor(Math.random() * models.length)],
      year: 2020 + Math.floor(Math.random() * 4),
      licensePlate: this.generateLicensePlate(),
      dailyRate: 50 + Math.floor(Math.random() * 150),
      description: 'Veículo em excelente estado para teste E2E'
    };
  }

  static generateBookingData() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // 7 dias no futuro
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5); // 5 dias de duração
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalCost: 250
    };
  }

  static generateLicensePlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let plate = '';
    for (let i = 0; i < 3; i++) {
      plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    plate += '-';
    for (let i = 0; i < 4; i++) {
      plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return plate;
  }

  static generateUserData() {
    const timestamp = Date.now();
    return {
      name: `Usuario Teste ${timestamp}`,
      email: `teste.${timestamp}@example.com`,
      password: 'senha123',
      phone: '11999999999',
      location: 'São Paulo'
    };
  }
}
