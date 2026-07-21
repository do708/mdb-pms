from generators.base.template_generator import TemplateGenerator


class SeedGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "prisma/seed.ts.j2",
            self.root.parent
            / "app"
            / "prisma"
            / "seed.ts"
        )

        print("✓ prisma/seed.ts")