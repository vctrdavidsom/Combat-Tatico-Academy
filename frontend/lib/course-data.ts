export const courseMock = {
  id: 1,
  code: "CQC-001",
  name: "Táticas de Combate Próximo",
  description: "<p>Treinamento avancado em tecnicas de combate corpo a corpo e defesa pessoal tatica.</p>",
  thumbnail: "",
  totalHours: "40h",
  status: "ativo",
  modules: [
    {
      id: 1,
      name: "Módulo 1: Fundamentos",
      description: "Introdução às técnicas básicas de combate",
      isExpanded: true,
      items: [
        {
          id: 1,
          type: "video",
          title: "Aula 1: Introdução ao Combate Tático",
          videoId: "jyTUFvYLgUk",
          duration: "45min",
          materials: []
        },
        {
          id: 2,
          type: "material",
          title: "Leitura Guiada: Fundamentos",
          materialPdfUrl: "https://example.com/manual-fundamentos.pdf",
          materialLinkUrl: "https://example.com/leitura-fundamentos",
          duration: "20min",
          materials: []
        },
        {
          id: 3,
          type: "activity",
          title: "Questionário de Apoio",
          drawCount: 2,
          attemptLimit: 2,
          totalPoints: 2,
          questions: [
            {
              id: 1,
              type: "multiple",
              prompt: "Qual é o objetivo principal do controle de distância?",
              options: ["Imobilização", "Segurança operacional", "Agressão", "Postura teatral"],
              correctIndex: 1,
              weight: 1
            },
            {
              id: 2,
              type: "essay",
              prompt: "Descreva a postura básica de prontidão em CQC.",
              options: [],
              weight: 1
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "Módulo 2: Técnicas Avançadas",
      description: "Técnicas avançadas de combate corpo a corpo",
      isExpanded: false,
      items: [
        {
          id: 4,
          type: "video",
          title: "Aula 1: Defesa Pessoal",
          videoId: "",
          duration: "50min",
          materials: []
        }
      ]
    }
  ],
  finalExam: {
    id: 1,
    title: "Exame Final de Certificação",
    cutScore: 70,
    durationMinutes: 60,
    drawCount: 10,
    attemptLimit: 2,
    totalPoints: 2,
    questions: [
      {
        id: 1,
        type: "multiple",
        prompt: "Qual é o princípio tático base para avanço em ambiente fechado?",
        options: ["Velocidade", "Silêncio", "Controle de setores", "Imprevisibilidade"],
        correctIndex: 2,
        weight: 1
      },
      {
        id: 2,
        type: "essay",
        prompt: "Explique a decisão de engajamento.",
        options: [],
        weight: 1
      }
    ]
  },
  certificateConfig: {
    title: "Certificado de Conclusao",
    subtitle: "Combat Tatico Academy",
    issuer: "Diretoria de Operacoes",
    sealUrl: "https://example.com/selos/cta-seal.png",
    backgroundUrl: "https://example.com/certificados/template-dark.png",
    signers: [
      { id: 1, name: "Cel. Almeida", role: "Comandante Geral" },
      { id: 2, name: "Cap. Souza", role: "Instrutor Chefe" }
    ],
    notes: "Assinaturas digitais aplicadas automaticamente."
  }
}
