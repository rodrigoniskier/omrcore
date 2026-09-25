# OMR Core

> **Status:** projeto em stand-by. O protótipo foi preservado para possível retomada, mas não integra atualmente o portfólio principal nem deve ser interpretado como produto validado em uso.


### Correção digital de gabaritos a partir de fotos e arquivos em lote

**OMR Core** é uma aplicação web para simplificar o fluxo de correção de provas objetivas. O usuário configura um gabarito, envia imagens ou PDFs das folhas de resposta e acompanha o processamento em lote em uma interface única.

O projeto combina uma experiência de uso semelhante a um sistema OMR tradicional com análise de imagem assistida por IA.

## Funcionalidades

- criação e armazenamento local do gabarito de referência;
- captura de folha de resposta pela câmera do dispositivo;
- upload de múltiplas imagens ou PDFs;
- fila visual de processamento;
- acompanhamento individual de sucesso/erro;
- processamento sequencial de lotes;
- consolidação dos resultados;
- interface responsiva para desktop e dispositivos móveis.

## Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Express**
- **Google Gemini**
- **Multer**
- **Tailwind CSS**
- **Motion**
- **Lucide React**

## Fluxo da aplicação

```text
Gabarito
   ↓
Foto / PDF
   ↓
Fila de processamento
   ↓
Backend de avaliação
   ↓
Resultado estruturado
   ↓
Consolidação do lote
```

A chave de respostas é mantida no `localStorage` do navegador. Os arquivos são enviados ao backend somente quando o usuário inicia o processamento.

## Executar localmente

Requer Node.js.

```bash
git clone https://github.com/rodrigoniskier/omrcore.git
cd omrcore
npm install
```

Copie e configure as variáveis descritas em `.env.example`.

Depois:

```bash
npm run dev
```

Para validar os tipos:

```bash
npm run lint
```

Para gerar o build:

```bash
npm run build
npm start
```

## Decisões de produto

O projeto foi desenhado para reduzir o número de passos necessários entre a fotografia da folha e a visualização do resultado. Por isso, captura, upload em lote, fila e resultados fazem parte do mesmo fluxo.

A interface também diferencia claramente:

- arquivos aguardando processamento;
- arquivo em processamento;
- correções concluídas;
- arquivos com erro.

## Observação

OMR Core é um projeto de automação educacional. Em contextos avaliativos reais, resultados automatizados devem ser revisados quando a imagem estiver incompleta, rasurada ou ambígua.

## Portfólio

Este projeto demonstra integração entre **frontend React, backend Node/Express, processamento de arquivos e IA multimodal** em um fluxo orientado a uma tarefa real.

---

Desenvolvido por [Rodrigo Niskier](https://github.com/rodrigoniskier).
