from generators.base.template_generator import TemplateGenerator


class EnvGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "config/env.example.j2",
            self.root.parent
            / "app"
            / ".env.example"
        )

        print("✓ .env.example")