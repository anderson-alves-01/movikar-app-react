import puppeteer from 'puppeteer';
import { Contract, ContractTemplate } from "@shared/schema";
import path from 'path';
import fs from 'fs/promises';

export async function generateContractPDF(contract: Contract, template: ContractTemplate): Promise<string> {
  try {
    // Replace template variables with actual data
    let htmlContent = template.htmlTemplate;
    
    // Helper function to replace template variables
    const replaceVariable = (template: string, key: string, value: any): string => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      return template.replace(regex, value || '');
    };

    // Replace all contract data variables
    const contractData = contract.contractData;
    
    // Vehicle data
    htmlContent = replaceVariable(htmlContent, 'vehicle.brand', contractData.vehicle.brand);
    htmlContent = replaceVariable(htmlContent, 'vehicle.model', contractData.vehicle.model);
    htmlContent = replaceVariable(htmlContent, 'vehicle.year', contractData.vehicle.year);
    htmlContent = replaceVariable(htmlContent, 'vehicle.color', contractData.vehicle.color);
    htmlContent = replaceVariable(htmlContent, 'vehicle.transmission', contractData.vehicle.transmission);
    htmlContent = replaceVariable(htmlContent, 'vehicle.fuel', contractData.vehicle.fuel);
    htmlContent = replaceVariable(htmlContent, 'vehicle.seats', contractData.vehicle.seats);
    htmlContent = replaceVariable(htmlContent, 'vehicle.category', contractData.vehicle.category);
    htmlContent = replaceVariable(htmlContent, 'vehicle.location', contractData.vehicle.location);
    htmlContent = replaceVariable(htmlContent, 'vehicle.pricePerDay', `R$ ${Number(contractData.vehicle.pricePerDay).toFixed(2)}`);
    
    // Renter data
    htmlContent = replaceVariable(htmlContent, 'renter.name', contractData.renter.name);
    htmlContent = replaceVariable(htmlContent, 'renter.email', contractData.renter.email);
    htmlContent = replaceVariable(htmlContent, 'renter.phone', contractData.renter.phone);
    
    // Owner data
    htmlContent = replaceVariable(htmlContent, 'owner.name', contractData.owner.name);
    htmlContent = replaceVariable(htmlContent, 'owner.email', contractData.owner.email);
    htmlContent = replaceVariable(htmlContent, 'owner.phone', contractData.owner.phone);
    
    // Booking data
    htmlContent = replaceVariable(htmlContent, 'booking.startDate', contractData.booking.startDate ? new Date(contractData.booking.startDate).toLocaleDateString('pt-BR') : '');
    htmlContent = replaceVariable(htmlContent, 'booking.endDate', contractData.booking.endDate ? new Date(contractData.booking.endDate).toLocaleDateString('pt-BR') : '');
    htmlContent = replaceVariable(htmlContent, 'booking.totalPrice', `R$ ${Number(contractData.booking.totalPrice).toFixed(2)}`);
    htmlContent = replaceVariable(htmlContent, 'booking.serviceFee', `R$ ${Number(contractData.booking.servicefee).toFixed(2)}`);
    htmlContent = replaceVariable(htmlContent, 'booking.insuranceFee', `R$ ${Number(contractData.booking.insuranceFee).toFixed(2)}`);
    
    // Contract metadata
    htmlContent = replaceVariable(htmlContent, 'contract.number', contract.contractNumber);
    htmlContent = replaceVariable(htmlContent, 'contract.date', contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('pt-BR') : '');
    
    // Terms data
    if (contractData.terms) {
      htmlContent = replaceVariable(htmlContent, 'terms.deposit', `R$ ${Number(contractData.terms.deposit).toFixed(2)}`);
      htmlContent = replaceVariable(htmlContent, 'terms.minAge', contractData.terms.minAge);
      
      // Handle penalties
      if (contractData.terms.penalties) {
        htmlContent = replaceVariable(htmlContent, 'penalties.lateReturn', `R$ ${Number(contractData.terms.penalties.lateReturn).toFixed(2)}`);
        htmlContent = replaceVariable(htmlContent, 'penalties.smoking', `R$ ${Number(contractData.terms.penalties.smoking).toFixed(2)}`);
        htmlContent = replaceVariable(htmlContent, 'penalties.pets', `R$ ${Number(contractData.terms.penalties.pets).toFixed(2)}`);
      }
    }

    // Add basic CSS for PDF generation
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #e74c3c;
                padding-bottom: 20px;
            }
            .contract-number {
                background: #f8f9fa;
                padding: 10px;
                border-left: 4px solid #e74c3c;
                margin: 20px 0;
            }
            .section {
                margin: 20px 0;
            }
            .section h3 {
                color: #e74c3c;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .parties {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
            }
            .party {
                flex: 1;
                margin: 0 10px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 5px;
            }
            .vehicle-details {
                background: #fff;
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 5px;
            }
            .terms-list {
                padding-left: 20px;
            }
            .terms-list li {
                margin: 5px 0;
            }
            .signature-area {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
            }
            .signature-box {
                width: 200px;
                border-top: 1px solid #333;
                text-align: center;
                padding-top: 10px;
            }
            @media print {
                body { margin: 0; }
            }
        </style>
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
    `;

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Save PDF to local storage (in production, save to cloud storage)
    const fileName = `contract-${contract.contractNumber}-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    
    // Ensure uploads directory exists
    try {
      await fs.mkdir(path.join(process.cwd(), 'uploads'), { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    await fs.writeFile(filePath, pdfBuffer);

    // Return the URL where the PDF can be accessed
    // In production, this would be a cloud storage URL
    return `/api/contracts/download/${fileName}`;

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Falha ao gerar PDF do contrato');
  }
}

// Default contract template HTML
export const defaultContractTemplate = `
<div class="header">
    <h1>CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
    <h2>alugae.mobi - Plataforma de Aluguel de Carros</h2>
</div>

<div class="contract-number">
    <strong>Contrato Nº:</strong> {{contract.number}}<br>
    <strong>Data:</strong> {{contract.date}}
</div>

<div class="section">
    <h3>PARTES CONTRATANTES</h3>
    <div class="parties">
        <div class="party">
            <h4>LOCADOR (Proprietário)</h4>
            <p><strong>Nome:</strong> {{owner.name}}</p>
            <p><strong>Email:</strong> {{owner.email}}</p>
            <p><strong>Telefone:</strong> {{owner.phone}}</p>
        </div>
        <div class="party">
            <h4>LOCATÁRIO</h4>
            <p><strong>Nome:</strong> {{renter.name}}</p>
            <p><strong>Email:</strong> {{renter.email}}</p>
            <p><strong>Telefone:</strong> {{renter.phone}}</p>
        </div>
    </div>
</div>

<div class="section">
    <h3>OBJETO DO CONTRATO</h3>
    <div class="vehicle-details">
        <h4>Detalhes do Veículo</h4>
        <p><strong>Marca/Modelo:</strong> {{vehicle.brand}} {{vehicle.model}}</p>
        <p><strong>Ano:</strong> {{vehicle.year}}</p>
        <p><strong>Cor:</strong> {{vehicle.color}}</p>
        <p><strong>Transmissão:</strong> {{vehicle.transmission}}</p>
        <p><strong>Combustível:</strong> {{vehicle.fuel}}</p>
        <p><strong>Assentos:</strong> {{vehicle.seats}}</p>
        <p><strong>Categoria:</strong> {{vehicle.category}}</p>
        <p><strong>Localização:</strong> {{vehicle.location}}</p>
    </div>
</div>

<div class="section">
    <h3>PERÍODO DE LOCAÇÃO</h3>
    <p><strong>Data de Início:</strong> {{booking.startDate}}</p>
    <p><strong>Data de Término:</strong> {{booking.endDate}}</p>
</div>

<div class="section">
    <h3>VALORES</h3>
    <p><strong>Valor da Diária:</strong> {{vehicle.pricePerDay}}</p>
    <p><strong>Taxa de Serviço:</strong> {{booking.serviceFee}}</p>
    <p><strong>Taxa de Seguro:</strong> {{booking.insuranceFee}}</p>
    <p><strong>Caução:</strong> {{terms.deposit}}</p>
    <p><strong>Valor Total:</strong> {{booking.totalPrice}}</p>
</div>

<div class="section">
    <h3>TERMOS E CONDIÇÕES</h3>
    
    <h4>Obrigações do Locatário:</h4>
    <ul class="terms-list">
        <li>Ter no mínimo {{terms.minAge}} anos e possuir CNH válida</li>
        <li>Devolver o veículo no mesmo estado de conservação</li>
        <li>Respeitar rigorosamente o horário de devolução</li>
        <li>Não fumar no interior do veículo</li>
        <li>Não transportar animais sem autorização prévia</li>
        <li>Reportar imediatamente qualquer problema ou acidente</li>
        <li>Pagar todas as multas e infrações durante o período de locação</li>
    </ul>

    <h4>Obrigações do Locador:</h4>
    <ul class="terms-list">
        <li>Entregar o veículo em perfeitas condições de uso</li>
        <li>Fornecer toda a documentação necessária</li>
        <li>Manter o seguro do veículo em dia</li>
        <li>Estar disponível para emergências durante a locação</li>
    </ul>

    <h4>Penalidades:</h4>
    <ul class="terms-list">
        <li>Atraso na devolução: {{penalties.lateReturn}} por hora</li>
        <li>Fumar no veículo: {{penalties.smoking}}</li>
        <li>Transporte de animais não autorizado: {{penalties.pets}}</li>
        <li>Danos ao veículo: Conforme avaliação técnica</li>
    </ul>
</div>

<div class="section">
    <h3>DISPOSIÇÕES GERAIS</h3>
    <p>Este contrato é regido pelas leis brasileiras e qualquer divergência será resolvida no foro da comarca de São Paulo/SP.</p>
    <p>As partes concordam que a assinatura eletrônica tem a mesma validade jurídica da assinatura física.</p>
    <p>Este contrato foi gerado automaticamente pela plataforma alugae.mobi e possui validade legal.</p>
</div>

<div class="signature-area">
    <div class="signature-box">
        <p>_____________________</p>
        <p><strong>{{owner.name}}</strong><br>Locador</p>
    </div>
    <div class="signature-box">
        <p>_____________________</p>
        <p><strong>{{renter.name}}</strong><br>Locatário</p>
    </div>
</div>
`;