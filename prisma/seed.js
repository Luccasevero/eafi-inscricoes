// Popula a tabela de modalidades com os dados oficiais da seletiva EAFI 2026/2027.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MODALIDADES = [
  { nome: 'Atletismo', sexo: 'F', anosPermitidos: [2013, 2014, 2015] },
  { nome: 'Atletismo', sexo: 'M', anosPermitidos: [2013, 2014, 2015] },
  { nome: 'Basquetebol', sexo: 'F', anosPermitidos: [2013, 2014, 2015, 2016] },
  { nome: 'Futsal', sexo: 'F', anosPermitidos: [2013, 2014, 2015, 2016] },
  { nome: 'Futsal', sexo: 'M', anosPermitidos: [2013, 2014, 2015] },
  { nome: 'Handebol', sexo: 'M', anosPermitidos: [2013, 2014, 2015, 2016] },
  { nome: 'Judô', sexo: 'F', anosPermitidos: [2014, 2015, 2016] },
  { nome: 'Judô', sexo: 'M', anosPermitidos: [2014, 2015, 2016] },
  { nome: 'Tênis de Mesa', sexo: 'F', anosPermitidos: [2015, 2016] },
  { nome: 'Tênis de Mesa', sexo: 'M', anosPermitidos: [2015, 2016] },
  { nome: 'Voleibol', sexo: 'F', anosPermitidos: [2013, 2014, 2015] },
  { nome: 'Voleibol', sexo: 'M', anosPermitidos: [2013, 2014, 2015, 2016] },
  { nome: 'Xadrez', sexo: 'F', anosPermitidos: [2014, 2015, 2016] },
  { nome: 'Xadrez', sexo: 'M', anosPermitidos: [2014, 2015, 2016] }
];

async function main() {
  console.log('Iniciando seed das modalidades...');

  // Limpeza: remove modalidades antigas com sexo "AMBOS" (versao anterior do seed),
  // que foram substituidas por linhas separadas de Feminino e Masculino.
  const antigasAmbos = await prisma.modalidade.findMany({
    where: { sexo: 'AMBOS' },
    include: { _count: { select: { inscricoes: true } } }
  });
  for (const antiga of antigasAmbos) {
    if (antiga._count.inscricoes > 0) {
      console.warn(
        `  AVISO: "${antiga.nome}" (AMBOS) tem ${antiga._count.inscricoes} inscricao(oes) vinculada(s) ` +
        `e nao foi removida automaticamente. Ajuste manualmente antes de migrar essas inscricoes.`
      );
    } else {
      await prisma.modalidade.delete({ where: { id: antiga.id } });
      console.log(`  Removida modalidade antiga: ${antiga.nome} (AMBOS)`);
    }
  }

  for (const m of MODALIDADES) {
    await prisma.modalidade.upsert({
      where: { nome_sexo: { nome: m.nome, sexo: m.sexo } },
      update: { anosPermitidos: m.anosPermitidos },
      create: m
    });
    console.log(`  OK: ${m.nome} (${m.sexo})`);
  }

  console.log('Seed concluido.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
