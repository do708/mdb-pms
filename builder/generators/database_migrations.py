from generators.base.template_generator import TemplateGenerator


class MigrationGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "prisma/migration.md.j2",
            self.root.parent
            / "app"
            / "prisma"
            / "README.md"
        )

        print("✓ prisma migration guide")