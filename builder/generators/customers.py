from generators.base.template_generator import TemplateGenerator


class CustomersGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "customers/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "customers"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ customers/page.tsx")