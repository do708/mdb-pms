from generators.base.template_generator import TemplateGenerator


class DatabaseGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "database/prisma.ts.j2",
            self.root.parent
            / "app"
            / "src"
            / "lib"
            / "prisma.ts"
        )

        print("✓ lib/prisma.ts")