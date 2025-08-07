#!/usr/bin/env python3
import sys
import os

def extract_pdf_content():
    pdf_path = "attached_assets/CONTRATO DE LOCAÇÃO DE AUTOMÓVEL POR PRAZO DETERMINADO_1753458632219.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"Arquivo não encontrado: {pdf_path}")
        return
    
    print(f"Tentando extrair conteúdo de: {pdf_path}")
    print(f"Tamanho do arquivo: {os.path.getsize(pdf_path)} bytes")
    
    # Tentar com pdfplumber primeiro
    try:
        import pdfplumber
        print("Usando pdfplumber...")
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Número de páginas: {len(pdf.pages)}")
            text = ""
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    print(f"Página {i+1} tem {len(page_text)} caracteres")
                    text += f"\n--- PÁGINA {i+1} ---\n{page_text}\n"
                else:
                    print(f"Página {i+1} sem texto extraível")
            
            if text.strip():
                print("\n=== CONTEÚDO EXTRAÍDO ===")
                print(text)
            else:
                print("Nenhum texto foi extraído")
                
    except ImportError:
        print("pdfplumber não disponível")
    except Exception as e:
        print(f"Erro com pdfplumber: {e}")
    
    # Tentar com PyPDF2
    try:
        import PyPDF2
        print("\nTentando com PyPDF2...")
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            print(f"Número de páginas: {len(reader.pages)}")
            text = ""
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    print(f"Página {i+1} tem {len(page_text)} caracteres")
                    text += f"\n--- PÁGINA {i+1} ---\n{page_text}\n"
                else:
                    print(f"Página {i+1} sem texto extraível")
            
            if text.strip():
                print("\n=== CONTEÚDO EXTRAÍDO (PyPDF2) ===")
                print(text)
            else:
                print("Nenhum texto foi extraído com PyPDF2")
                
    except ImportError:
        print("PyPDF2 não disponível")
    except Exception as e:
        print(f"Erro com PyPDF2: {e}")

if __name__ == "__main__":
    extract_pdf_content()