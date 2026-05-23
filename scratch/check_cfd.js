const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        jobTitle: {
          contains: 'CFD',
          mode: 'insensitive'
        }
      }
    });

    console.log(`Found ${projects.length} CFD projects.`);
    for (const project of projects) {
      console.log(`Project ID: ${project.id}`);
      console.log(`Job Title: ${project.jobTitle}`);
      console.log(`Company: ${project.company}`);
      console.log(`ATS Score: ${project.atsScore}%`);
      console.log(`--- Original Resume Text ---`);
      console.log(project.resumeText);
      console.log(`----------------------------`);
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
