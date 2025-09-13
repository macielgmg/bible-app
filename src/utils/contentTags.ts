// src/utils/contentTags.ts

export interface ContentTagOption {
  value: string;
  label: string;
}

// Opções de Interesses Bíblicos (de OnboardingQuestions.tsx q7)
const interestsOptions: ContentTagOption[] = [
  { value: 'profecias-biblicas', label: 'Profecias Bíblicas' },
  { value: 'personagens-biblicos', label: 'Estudos de Personagens Bíblicos' },
  { value: 'historia-israel', label: 'História do Povo de Israel' },
  { value: 'teologia-sistematica', label: 'Teologia Sistemática' },
  { value: 'apocalipse-escatologia', label: 'Apocalipse e Escatologia' },
  { value: 'vida-jesus', label: 'Vida de Jesus Cristo' },
  { value: 'parabolas-jesus', label: 'Parábolas de Jesus' },
  { value: 'cartas-paulinas', label: 'Cartas Paulinas' },
  { value: 'livros-poeticos', label: 'Livros Poéticos (Salmos, Provérbios)' },
  { value: 'doutrinas-fundamentais', label: 'Doutrinas Fundamentais da Fé' },
  { value: 'arqueologia-biblica', label: 'Arqueologia Bíblica' },
  { value: 'etica-crista', label: 'Ética Cristã e Vida Diária' },
  { value: 'missoes-evangelismo', label: 'Missões e Evangelismo' },
  { value: 'espirito-santo', label: 'O Espírito Santo' },
  { value: 'adoracao-louvor', label: 'Adoração e Louvor' },
];

// Opções de Desafios na Fé (de OnboardingQuestions.tsx q6)
const challengesOptions: ContentTagOption[] = [
  { value: 'falta-tempo', label: 'Falta de tempo' },
  { value: 'duvidas-biblicas', label: 'Dúvidas bíblicas ou teológicas' },
  { value: 'falta-motivacao', label: 'Falta de motivação ou disciplina' },
  { value: 'dificuldade-aplicar', label: 'Dificuldade em aplicar a fé no dia a dia' },
  { value: 'solidao', label: 'Solidão na jornada espiritual' },
  { value: 'distracoes', label: 'Distrações do mundo' },
  { value: 'nao-entendo-biblia', label: 'Não consigo entender a Bíblia' },
  { value: 'outros-desafios', label: 'Outros' },
];

// Combinar e remover duplicatas (se houver, embora neste caso não haja)
export const allContentTags: ContentTagOption[] = Array.from(
  new Map([...interestsOptions, ...challengesOptions].map(item => [item.value, item])).values()
);

// Lista de todas as opções de tags para referência:
// - Profecias Bíblicas
// - Estudos de Personagens Bíblicos
// - História do Povo de Israel
// - Teologia Sistemática
// - Apocalipse e Escatologia
// - Vida de Jesus Cristo
// - Parábolas de Jesus
// - Cartas Paulinas
// - Livros Poéticos (Salmos, Provérbios)
// - Doutrinas Fundamentais da Fé
// - Arqueologia Bíblica
// - Ética Cristã e Vida Diária
// - Missões e Evangelismo
// - O Espírito Santo
// - Adoração e Louvor
// - Falta de tempo
// - Dúvidas bíblicas ou teológicas
// - Falta de motivação ou disciplina
// - Dificuldade em aplicar a fé no dia a dia
// - Solidão na jornada espiritual
// - Distrações do mundo
// - Não consigo entender a Bíblia
// - Outros