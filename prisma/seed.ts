import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Super Admin
  const adminPassword = await bcrypt.hash("senha123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    update: {},
    create: {
      email: "admin@teste.com",
      name: "Super Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Created super admin:", superAdmin.email);

  // Condomínio 1
  const cond1 = await prisma.condominio.upsert({
    where: { id: "cond1" },
    update: {},
    create: {
      id: "cond1",
      name: "Residencial das Palmeiras",
      cnpj: "12.345.678/0001-90",
      address: "Rua das Palmeiras, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
    },
  });

  // Condomínio 2
  const cond2 = await prisma.condominio.upsert({
    where: { id: "cond2" },
    update: {},
    create: {
      id: "cond2",
      name: "Edifício Solar das Orquídeas",
      address: "Av. das Orquídeas, 456",
      city: "Campinas",
      state: "SP",
      zipCode: "13010-050",
    },
  });

  console.log("Created condominios:", cond1.name, cond2.name);

  // Blocos - Cond 1
  const blocoA = await prisma.bloco.upsert({
    where: { id: "bloco-a" },
    update: {},
    create: { id: "bloco-a", name: "Bloco A", condominioId: cond1.id },
  });
  const blocoB = await prisma.bloco.upsert({
    where: { id: "bloco-b" },
    update: {},
    create: { id: "bloco-b", name: "Bloco B", condominioId: cond1.id },
  });

  // Blocos - Cond 2
  const torre1 = await prisma.bloco.upsert({
    where: { id: "torre-1" },
    update: {},
    create: { id: "torre-1", name: "Torre 1", condominioId: cond2.id },
  });

  // Unidades - Cond 1
  const unidades1 = [];
  for (const num of ["101", "102", "201", "202", "301"]) {
    const u = await prisma.unidade.upsert({
      where: { id: `u-a-${num}` },
      update: {},
      create: {
        id: `u-a-${num}`,
        number: num,
        blocoId: blocoA.id,
        status: ["101", "201", "301"].includes(num) ? "OCUPADA" : "VAGA",
      },
    });
    unidades1.push(u);
  }

  const unidades2 = [];
  for (const num of ["101", "201"]) {
    const u = await prisma.unidade.upsert({
      where: { id: `u-b-${num}` },
      update: {},
      create: {
        id: `u-b-${num}`,
        number: num,
        blocoId: blocoB.id,
        status: "VAGA",
      },
    });
    unidades2.push(u);
  }

  // Síndico Cond 1
  const sindicoPassword = await bcrypt.hash("senha123", 10);
  const sindico1 = await prisma.user.upsert({
    where: { email: "sindico@palmeiras.com" },
    update: {},
    create: {
      email: "sindico@palmeiras.com",
      name: "Carlos Silva",
      passwordHash: sindicoPassword,
      role: "SINDICO",
    },
  });
  await prisma.condominioUser.upsert({
    where: { userId_condominioId: { userId: sindico1.id, condominioId: cond1.id } },
    update: {},
    create: { userId: sindico1.id, condominioId: cond1.id, role: "SINDICO" },
  });

  // Porteiro Cond 1
  const porteiroPassword = await bcrypt.hash("senha123", 10);
  const porteiro1 = await prisma.user.upsert({
    where: { email: "portaria@palmeiras.com" },
    update: {},
    create: {
      email: "portaria@palmeiras.com",
      name: "José Santos",
      passwordHash: porteiroPassword,
      role: "PORTEIRO",
    },
  });
  await prisma.condominioUser.upsert({
    where: { userId_condominioId: { userId: porteiro1.id, condominioId: cond1.id } },
    update: {},
    create: { userId: porteiro1.id, condominioId: cond1.id, role: "PORTEIRO" },
  });

  // Síndico Cond 2
  const sindico2 = await prisma.user.upsert({
    where: { email: "sindico@orquideas.com" },
    update: {},
    create: {
      email: "sindico@orquideas.com",
      name: "Ana Costa",
      passwordHash: sindicoPassword,
      role: "SINDICO",
    },
  });
  await prisma.condominioUser.upsert({
    where: { userId_condominioId: { userId: sindico2.id, condominioId: cond2.id } },
    update: {},
    create: { userId: sindico2.id, condominioId: cond2.id, role: "SINDICO" },
  });

  // Porteiro Cond 2
  const porteiro2 = await prisma.user.upsert({
    where: { email: "portaria@orquideas.com" },
    update: {},
    create: {
      email: "portaria@orquideas.com",
      name: "Roberto Lima",
      passwordHash: porteiroPassword,
      role: "PORTEIRO",
    },
  });
  await prisma.condominioUser.upsert({
    where: { userId_condominioId: { userId: porteiro2.id, condominioId: cond2.id } },
    update: {},
    create: { userId: porteiro2.id, condominioId: cond2.id, role: "PORTEIRO" },
  });

  console.log("Created síndicos and porteiros");

  // Moradores Cond 1 (5 moradores)
  const moradoresData = [
    { name: "Maria Oliveira", email: "maria@email.com", phone: "(11) 99999-1111", unidadeId: unidades1[0].id, vinculo: "PROPRIETARIO" as const },
    { name: "Pedro Ferreira", email: "pedro@email.com", phone: "(11) 99999-2222", unidadeId: unidades1[0].id, vinculo: "DEPENDENTE" as const },
    { name: "Luiz Almeida", email: "luiz@email.com", phone: "(11) 99999-3333", unidadeId: unidades1[2].id, vinculo: "PROPRIETARIO" as const },
    { name: "Fernanda Costa", email: "fernanda@email.com", phone: "(11) 99999-4444", unidadeId: unidades1[4].id, vinculo: "INQUILINO" as const },
    { name: "Ricardo Souza", email: "ricardo@email.com", phone: "(11) 99999-5555", unidadeId: unidades1[4].id, vinculo: "DEPENDENTE" as const },
  ];

  for (let i = 0; i < moradoresData.length; i++) {
    const m = moradoresData[i];
    await prisma.morador.upsert({
      where: { id: `morador-${i + 1}` },
      update: {},
      create: { id: `morador-${i + 1}`, ...m },
    });
  }

  console.log("Created moradores");

  // Create a morador user for Maria
  const moradorPassword = await bcrypt.hash("senha123", 10);
  const mariaUser = await prisma.user.upsert({
    where: { email: "maria@email.com" },
    update: {},
    create: {
      email: "maria@email.com",
      name: "Maria Oliveira",
      passwordHash: moradorPassword,
      role: "MORADOR",
    },
  });
  await prisma.condominioUser.upsert({
    where: { userId_condominioId: { userId: mariaUser.id, condominioId: cond1.id } },
    update: {},
    create: { userId: mariaUser.id, condominioId: cond1.id, role: "MORADOR" },
  });
  await prisma.morador.update({
    where: { id: "morador-1" },
    data: { userId: mariaUser.id },
  });

  // Comunicados
  await prisma.comunicado.upsert({
    where: { id: "com1" },
    update: {},
    create: {
      id: "com1",
      title: "Assembleia Geral Ordinária",
      content: "Informamos que a Assembleia Geral Ordinária será realizada no dia 15 de abril de 2026, às 19h, no salão de festas do Bloco A.\n\nParticipação obrigatória para todos os proprietários.\n\nAtenciosamente,\nA Administração",
      isPinned: true,
      condominioId: cond1.id,
      authorId: sindico1.id,
    },
  });

  await prisma.comunicado.upsert({
    where: { id: "com2" },
    update: {},
    create: {
      id: "com2",
      title: "Manutenção do Elevador",
      content: "O elevador do Bloco A passará por manutenção preventiva no dia 20/03/2026, das 8h às 12h.\n\nDurante este período, utilize as escadas.\n\nPedimos desculpas pelo inconveniente.",
      isPinned: false,
      condominioId: cond1.id,
      authorId: sindico1.id,
    },
  });

  await prisma.comunicado.upsert({
    where: { id: "com3" },
    update: {},
    create: {
      id: "com3",
      title: "Regras para uso da Piscina",
      content: "Lembramos as regras de uso da área de lazer:\n\n- Horário: 8h às 22h\n- Crianças menores de 12 anos devem estar acompanhadas\n- Proibido uso de copos de vidro\n- Respeite os demais moradores",
      isPinned: false,
      condominioId: cond1.id,
      authorId: sindico1.id,
    },
  });

  console.log("Created comunicados");

  // Encomendas
  const encomendasData = [
    { unidadeId: unidades1[0].id, status: "PENDENTE" as const, description: "Caixa Amazon", receivedById: porteiro1.id },
    { unidadeId: unidades1[0].id, status: "PENDENTE" as const, description: "Sedex - Correios", receivedById: porteiro1.id },
    { unidadeId: unidades1[2].id, status: "PENDENTE" as const, description: "Mercado Livre", receivedById: porteiro1.id },
    { unidadeId: unidades1[0].id, status: "ENTREGUE" as const, description: "Shopee", receivedById: porteiro1.id, pickedUpName: "Maria Oliveira", pickedUpAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { unidadeId: unidades1[2].id, status: "ENTREGUE" as const, description: "Magazine Luiza", receivedById: porteiro1.id, pickedUpName: "Luiz Almeida", pickedUpAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  ];

  for (let i = 0; i < encomendasData.length; i++) {
    const e = encomendasData[i];
    await prisma.encomenda.upsert({
      where: { id: `enc${i + 1}` },
      update: {},
      create: {
        id: `enc${i + 1}`,
        ...e,
        pickedUpById: e.status === "ENTREGUE" ? porteiro1.id : undefined,
      },
    });
  }

  console.log("Created encomendas");
  console.log("\n✅ Seed completed successfully!");
  console.log("\nTest accounts:");
  console.log("  Super Admin: admin@teste.com / senha123");
  console.log("  Síndico:     sindico@palmeiras.com / senha123");
  console.log("  Porteiro:    portaria@palmeiras.com / senha123");
  console.log("  Morador:     maria@email.com / senha123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
