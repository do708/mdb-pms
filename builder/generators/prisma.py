from generators.base.template_generator import TemplateGenerator


class PrismaGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "prisma/schema.prisma.j2",
            self.root.parent
            / "app"
            / "prisma"
            / "schema.prisma",
            project=self.manifest["project"]
        )

        print("✓ schema.prisma")