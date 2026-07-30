-- CreateTable
CREATE TABLE "Modalidade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "anosPermitidos" INTEGER[],

    CONSTRAINT "Modalidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsavel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "tipo" TEXT NOT NULL,
    "inscricaoId" INTEGER NOT NULL,

    CONSTRAINT "Responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscricao" (
    "id" SERIAL NOT NULL,
    "codigoConfirmacao" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "escola" TEXT NOT NULL,
    "anoEscolar" TEXT NOT NULL,
    "rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "complemento" TEXT,
    "telefones" TEXT[],
    "praticaEsportes" BOOLEAN NOT NULL DEFAULT false,
    "praticaEsportesDetalhe" TEXT,
    "deficiencia" BOOLEAN NOT NULL DEFAULT false,
    "deficienciaDetalhe" TEXT,
    "medicamento" BOOLEAN NOT NULL DEFAULT false,
    "medicamentoDetalhe" TEXT,
    "convenio" BOOLEAN NOT NULL DEFAULT false,
    "convenioNome" TEXT,
    "autorizado" BOOLEAN NOT NULL DEFAULT false,
    "modalidadeId" INTEGER NOT NULL,
    "responsavelProvaId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoConfig" (
    "id" SERIAL NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "publicadoEm" TIMESTAMP(3),

    CONSTRAINT "ResultadoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Modalidade_nome_sexo_key" ON "Modalidade"("nome", "sexo");

-- CreateIndex
CREATE UNIQUE INDEX "Inscricao_codigoConfirmacao_key" ON "Inscricao"("codigoConfirmacao");

-- CreateIndex
CREATE UNIQUE INDEX "Inscricao_nomeCompleto_dataNascimento_key" ON "Inscricao"("nomeCompleto", "dataNascimento");

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "Inscricao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_modalidadeId_fkey" FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_responsavelProvaId_fkey" FOREIGN KEY ("responsavelProvaId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
