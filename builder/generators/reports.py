from generators.base.template_generator import TemplateGenerator


class ReportsGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "reports/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "reports"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ reports/page.tsx")