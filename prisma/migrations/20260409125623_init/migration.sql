-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SINDICO', 'PORTEIRO', 'MORADOR');

-- CreateEnum
CREATE TYPE "UnidadeStatus" AS ENUM ('OCUPADA', 'VAGA', 'BLOQUEADA');

-- CreateEnum
CREATE TYPE "FinanceiroStatus" AS ENUM ('EM_DIA', 'PENDENTE', 'INADIMPLENTE');

-- CreateEnum
CREATE TYPE "Vinculo" AS ENUM ('PROPRIETARIO', 'INQUILINO', 'DEPENDENTE');

-- CreateEnum
CREATE TYPE "EncomendaStatus" AS ENUM ('PENDENTE', 'ENTREGUE');

-- CreateEnum
CREATE TYPE "ReservaStatus" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "VisitaType" AS ENUM ('PONTUAL', 'RECORRENTE');

-- CreateEnum
CREATE TYPE "PetSize" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "OcorrenciaCategory" AS ENUM ('MANUTENCAO', 'BARULHO', 'SEGURANCA', 'LIMPEZA', 'AREAS_COMUNS', 'OUTROS');

-- CreateEnum
CREATE TYPE "OcorrenciaPriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "OcorrenciaStatus" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'RESOLVIDA', 'FECHADA');

-- CreateEnum
CREATE TYPE "NotificacaoType" AS ENUM ('COMUNICADO', 'ENCOMENDA', 'RESERVA', 'OCORRENCIA', 'VISITANTE', 'SISTEMA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MORADOR',
    "phone" TEXT,
    "turno" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condominios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condominios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condominio_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "condominio_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "blocoId" TEXT NOT NULL,
    "status" "UnidadeStatus" NOT NULL DEFAULT 'VAGA',
    "statusFinanceiro" "FinanceiroStatus" NOT NULL DEFAULT 'EM_DIA',
    "obsFinanceiro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moradores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "unidadeId" TEXT NOT NULL,
    "vinculo" "Vinculo" NOT NULL DEFAULT 'PROPRIETARIO',
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "condominioId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicado_reads" (
    "id" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comunicado_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encomendas" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "unidadeId" TEXT NOT NULL,
    "status" "EncomendaStatus" NOT NULL DEFAULT 'PENDENTE',
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickedUpById" TEXT,
    "pickedUpName" TEXT,
    "pickedUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "labelImageUrl" TEXT,
    "remetente" TEXT,
    "transportadora" TEXT,
    "codigoRastreio" TEXT,
    "scanConfidence" DOUBLE PRECISION,
    "wasScanned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "encomendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_comuns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "imageUrl" TEXT,
    "condominioId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "minAdvanceDays" INTEGER NOT NULL DEFAULT 1,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "maxDurationHours" INTEGER NOT NULL DEFAULT 4,
    "openTime" TEXT NOT NULL DEFAULT '08:00',
    "closeTime" TEXT NOT NULL DEFAULT '22:00',
    "availableDays" TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "areas_comuns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "areaComumId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "ReservaStatus" NOT NULL DEFAULT 'PENDENTE',
    "rejectReason" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_bloqueios" (
    "id" TEXT NOT NULL,
    "areaComumId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agenda_bloqueios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitantes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "unidadeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VisitaType" NOT NULL DEFAULT 'PONTUAL',
    "expectedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "entryAt" TIMESTAMP(3),
    "exitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT,
    "color" TEXT,
    "parkingSpot" TEXT,
    "unidadeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "size" "PetSize" NOT NULL DEFAULT 'MEDIO',
    "unidadeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "OcorrenciaCategory" NOT NULL DEFAULT 'OUTROS',
    "priority" "OcorrenciaPriority" NOT NULL DEFAULT 'MEDIA',
    "status" "OcorrenciaStatus" NOT NULL DEFAULT 'ABERTA',
    "unidadeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencia_comentarios" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "ocorrenciaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencia_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencia_imagens" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ocorrenciaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencia_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "type" "NotificacaoType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao_preferencias" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificacaoType" NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "digest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notificacao_preferencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "condominio_users_userId_condominioId_key" ON "condominio_users"("userId", "condominioId");

-- CreateIndex
CREATE UNIQUE INDEX "comunicado_reads_comunicadoId_userId_key" ON "comunicado_reads"("comunicadoId", "userId");

-- CreateIndex
CREATE INDEX "notificacoes_userId_isRead_idx" ON "notificacoes"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_preferencias_userId_type_key" ON "notificacao_preferencias"("userId", "type");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "condominio_users" ADD CONSTRAINT "condominio_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condominio_users" ADD CONSTRAINT "condominio_users_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "condominios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocos" ADD CONSTRAINT "blocos_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "condominios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "blocos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moradores" ADD CONSTRAINT "moradores_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "condominios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado_reads" ADD CONSTRAINT "comunicado_reads_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "comunicados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicado_reads" ADD CONSTRAINT "comunicado_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomendas" ADD CONSTRAINT "encomendas_pickedUpById_fkey" FOREIGN KEY ("pickedUpById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas_comuns" ADD CONSTRAINT "areas_comuns_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "condominios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_areaComumId_fkey" FOREIGN KEY ("areaComumId") REFERENCES "areas_comuns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_bloqueios" ADD CONSTRAINT "agenda_bloqueios_areaComumId_fkey" FOREIGN KEY ("areaComumId") REFERENCES "areas_comuns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitantes" ADD CONSTRAINT "visitantes_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitantes" ADD CONSTRAINT "visitantes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_comentarios" ADD CONSTRAINT "ocorrencia_comentarios_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_comentarios" ADD CONSTRAINT "ocorrencia_comentarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_imagens" ADD CONSTRAINT "ocorrencia_imagens_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
